const pool = require('../config/db');
const radiusDb = require('../config/radiusDb');
const { ApiError } = require('../middleware/errorHandler');
const { getRouterConfigForCompany } = require('../services/routerResolver');
const { getStrategy } = require('../services/authStrategy');

// GET /customers — List all customers (users with plans) — Splynx-style
// Joins users with their active plan and the lead they were converted from
const getCustomers = async (req, res, next) => {
  try {
    const { status } = req.query; // ?status=active or ?status=inactive

    const companyId = req.companyId;

    let query = `
      SELECT
        u.id, u.username, u.full_name, u.email, u.phone, u.address,
        u.balance, u.active, u.seq_id, u.created_at,
        p.id AS plan_id, p.name AS plan_name,
        p.download_speed, p.upload_speed, p.price AS plan_price,
        up.start_date AS plan_start_date,
        l.id AS lead_id
      FROM users u
      LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
      LEFT JOIN plans p ON up.plan_id = p.id
      LEFT JOIN leads l ON l.converted_to = u.id
    `;

    const conditions = ['u.company_id = $1'];
    const params = [companyId];

    if (status === 'active') {
      conditions.push('u.active = TRUE');
    } else if (status === 'inactive') {
      conditions.push('u.active = FALSE');
    }

    query += ' WHERE ' + conditions.join(' AND ');

    query += ' ORDER BY u.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /customers/:id — Single customer detail with full service info
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        u.id, u.username, u.full_name, u.email, u.phone, u.address,
        u.balance, u.active, u.created_at, u.updated_at,
        p.id AS plan_id, p.name AS plan_name,
        p.download_speed, p.upload_speed, p.price AS plan_price,
        up.start_date AS plan_start_date, up.end_date AS plan_end_date,
        l.id AS lead_id, l.full_name AS lead_name,
        ca.full_name AS added_by_name, ca.email AS added_by_email,
        u.seq_id
      FROM users u
      LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
      LEFT JOIN plans p ON up.plan_id = p.id
      LEFT JOIN leads l ON l.converted_to = u.id
      LEFT JOIN company_admins ca ON u.created_by = ca.id
      WHERE u.id = $1 AND u.company_id = $2`,
      [id, req.companyId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Customer not found');
    }

    const customer = result.rows[0];

    // Fetch cleartext PPPoE password from RADIUS DB
    try {
      const radResult = await radiusDb.query(
        `SELECT value FROM radcheck WHERE username = $1 AND attribute = 'Cleartext-Password' LIMIT 1`,
        [customer.username]
      );
      customer.password = radResult.rows[0]?.value || null;
    } catch {
      customer.password = null;
    }

    // Fetch pending plan (future start_date, not yet active)
    const pendingResult = await pool.query(
      `SELECT up.start_date, up.end_date,
              p.id AS plan_id, p.name AS plan_name,
              p.download_speed, p.upload_speed, p.price,
              ca.full_name AS changed_by_name, ca.email AS changed_by_email
       FROM user_plans up
       JOIN plans p ON up.plan_id = p.id
       LEFT JOIN company_admins ca ON up.changed_by = ca.id
       WHERE up.user_id = $1 AND up.active = FALSE AND up.start_date > CURRENT_DATE
       ORDER BY up.start_date ASC LIMIT 1`,
      [id]
    );
    customer.pending_plan = pendingResult.rows[0] || null;

    res.json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /customers/:id — Update customer details (edit PPPoE, info, status)
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, address, username, password, active } = req.body;

    // Check customer exists and belongs to company
    const existing = await pool.query('SELECT id, username FROM users WHERE id = $1 AND company_id = $2', [id, req.companyId]);
    if (existing.rows.length === 0) {
      throw new ApiError(404, 'Customer not found');
    }

    // If username is being changed, check uniqueness
    if (username && username !== existing.rows[0].username) {
      const dup = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2 AND company_id = $3', [username, id, req.companyId]);
      if (dup.rows.length > 0) {
        throw new ApiError(409, 'PPPoE username already taken');
      }
    }

    const oldUsername = existing.rows[0].username;

    const result = await pool.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        username = COALESCE($5, username),
        password = COALESCE($6, password),
        active = COALESCE($7, active),
        updated_at = NOW()
      WHERE id = $8
      RETURNING id, username, full_name, email, phone, address, password, balance, active, updated_at`,
      [full_name, email, phone, address, username, password, active, id]
    );

    const updated = result.rows[0];

    // Sync password change to auth strategy (RADIUS or API)
    if (password) {
      try {
        const routerConfig = await getRouterConfigForCompany(req.companyId);
        const strategy = getStrategy(routerConfig?.authType || 'radius');
        await strategy.onUserUpdate(oldUsername, { password }, routerConfig);
      } catch (mkErr) {
        console.warn(`[CUSTOMER] Password sync failed for ${oldUsername}: ${mkErr.message}`);
      }
    }

    // Sync active status via auth strategy (RADIUS or API)
    if (active !== undefined && active !== null) {
      try {
        const routerConfig = await getRouterConfigForCompany(req.companyId);
        const strategy = getStrategy(routerConfig?.authType || 'radius');
        await strategy.onUserStatusChange(oldUsername, active, routerConfig);
      } catch (mkErr) {
        console.warn(`[CUSTOMER] Status sync failed for ${oldUsername}: ${mkErr.message}`);
      }
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /customers/:id/plan — Change customer's service plan
// Accepts: plan_id, start_date (optional), end_date (optional)
// If start_date is in the future, plan is scheduled as pending (active=FALSE)
const changeCustomerPlan = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { plan_id, start_date, end_date } = req.body;

    await client.query('BEGIN');

    // Validate plan exists and belongs to company
    const plan = await client.query('SELECT * FROM plans WHERE id = $1 AND active = TRUE AND company_id = $2', [plan_id, req.companyId]);
    if (plan.rows.length === 0) {
      throw new ApiError(400, 'Plan does not exist or is inactive');
    }

    const effectiveStart = start_date || new Date().toISOString().split('T')[0];
    const isFuture = new Date(effectiveStart) > new Date(new Date().toISOString().split('T')[0]);

    // Remove any existing pending plans for this user
    await client.query(
      `DELETE FROM user_plans WHERE user_id = $1 AND active = FALSE AND start_date > CURRENT_DATE`,
      [id]
    );

    if (isFuture) {
      // Schedule as pending — current plan stays active
      await client.query(
        `INSERT INTO user_plans (user_id, plan_id, start_date, end_date, active, changed_by) VALUES ($1, $2, $3, $4, FALSE, $5)`,
        [id, plan_id, effectiveStart, end_date || null, req.adminId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: { user_id: id, plan: plan.rows[0], scheduled: true, start_date: effectiveStart, end_date: end_date || null },
      });
    } else {
      // Apply immediately — deactivate current plan
      await client.query(
        `UPDATE user_plans SET active = FALSE, end_date = COALESCE(end_date, CURRENT_DATE) WHERE user_id = $1 AND active = TRUE`,
        [id]
      );

      await client.query(
        `INSERT INTO user_plans (user_id, plan_id, start_date, end_date, active, changed_by) VALUES ($1, $2, $3, $4, TRUE, $5)`,
        [id, plan_id, effectiveStart, end_date || null, req.adminId]
      );

      await client.query('COMMIT');

      // Sync plan change via auth strategy (RADIUS or API)
      const newPlan = plan.rows[0];
      const user = await pool.query('SELECT username FROM users WHERE id = $1 AND company_id = $2', [id, req.companyId]);
      let syncResult = null;
      if (user.rows.length > 0) {
        try {
          const routerConfig = await getRouterConfigForCompany(req.companyId);
          const strategy = getStrategy(routerConfig?.authType || 'radius');
          syncResult = await strategy.onPlanChange(user.rows[0].username, newPlan, routerConfig);
        } catch (mkErr) {
          console.warn(`[CUSTOMER] Plan sync failed: ${mkErr.message}`);
        }
      }

      res.json({
        success: true,
        data: { user_id: id, plan: newPlan, sync: syncResult, scheduled: false },
      });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// DELETE /customers/:id/plan/pending — Cancel a scheduled (pending) plan change
const cancelPendingPlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM user_plans WHERE user_id = $1 AND active = FALSE AND start_date > CURRENT_DATE`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, 'No pending plan change found');
    }

    res.json({ success: true, message: 'Pending plan change cancelled' });
  } catch (err) {
    next(err);
  }
};

// DELETE /customers/:id — Delete customer
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if customer exists and belongs to company
    const existing = await pool.query('SELECT id, username FROM users WHERE id = $1 AND company_id = $2', [id, req.companyId]);
    if (existing.rows.length === 0) {
      throw new ApiError(404, 'Customer not found');
    }

    // Delete related records first (cascade manually)
    await pool.query('DELETE FROM user_plans WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM payments WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM documents WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM tickets WHERE user_id = $1', [id]);

    // Delete the customer
    await pool.query('DELETE FROM users WHERE id = $1 AND company_id = $2', [id, req.companyId]);

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCustomers, getCustomerById, updateCustomer, deleteCustomer, changeCustomerPlan, cancelPendingPlan };
