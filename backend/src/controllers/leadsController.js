const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const mikrotik = require('../services/mikrotik');
const { getRouterConfigForCompany } = require('../services/routerResolver');
const { getStrategy } = require('../services/authStrategy');

// Valid pipeline stages
const VALID_STATUSES = ['new', 'contacted', 'site_survey', 'quoted', 'install_pending', 'converted', 'lost'];

// POST /leads/create — Create a new lead in the pipeline
const createLead = async (req, res, next) => {
  try {
    const { full_name, phone, email, address, notes } = req.body;
    const companyId = req.companyId;

    const result = await pool.query(
      `INSERT INTO leads (company_id, full_name, phone, email, address, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'new', $7)
       RETURNING *`,
      [companyId, full_name, phone, email, address, notes || null, req.adminId || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// GET /leads — Fetch all leads (optionally filter by status)
const getLeads = async (req, res, next) => {
  try {
    const { status } = req.query;

    const companyId = req.companyId;
    let query = `SELECT l.*, ca.full_name AS created_by_name
      FROM leads l
      LEFT JOIN company_admins ca ON l.created_by = ca.id
      WHERE l.company_id = $1`;
    const params = [companyId];

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      query += ' AND l.status = $2';
      params.push(status);
    }

    query += ' ORDER BY l.created_at DESC';

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

// PUT /leads/:id/status — Move a lead to a new pipeline stage
const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const result = await pool.query(
      `UPDATE leads SET status = $1, updated_at = NOW()
       WHERE id = $2 AND company_id = $3
       RETURNING *`,
      [status, id, req.companyId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Lead not found');
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// GET /leads/:id — Get single lead details
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT l.*, ca.full_name AS created_by_name
       FROM leads l
       LEFT JOIN company_admins ca ON l.created_by = ca.id
       WHERE l.id = $1 AND l.company_id = $2`,
      [id, req.companyId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Lead not found');
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/comments — Add a comment to a lead
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Verify lead exists and belongs to company
    const lead = await pool.query('SELECT id FROM leads WHERE id = $1 AND company_id = $2', [id, req.companyId]);
    if (lead.rows.length === 0) {
      throw new ApiError(404, 'Lead not found');
    }

    // Get admin name
    const adminRes = await pool.query('SELECT full_name FROM company_admins WHERE id = $1', [req.adminId]);
    const authorName = adminRes.rows[0]?.full_name || 'Admin';

    const result = await pool.query(
      `INSERT INTO lead_comments (lead_id, author, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, authorName, content]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// GET /leads/:id/comments — Get all comments for a lead
const getComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify lead belongs to company
    const leadCheck = await pool.query('SELECT id FROM leads WHERE id = $1 AND company_id = $2', [id, req.companyId]);
    if (leadCheck.rows.length === 0) {
      throw new ApiError(404, 'Lead not found');
    }

    const result = await pool.query(
      'SELECT * FROM lead_comments WHERE lead_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/convert — Convert a lead into a customer
// Uses auth strategy (RADIUS vs API) based on router config
const convertLead = async (req, res, next) => {
  const client = await pool.connect();
  let routerSyncResult = null;
  let pppoeUsername = null;

  try {
    const { id } = req.params;
    const { username, password, plan_id, full_name, email, phone, address } = req.body;
    const companyId = req.companyId;
    pppoeUsername = username;

    await client.query('BEGIN');

    // Fetch the lead (scoped to company)
    const leadResult = await client.query('SELECT * FROM leads WHERE id = $1 AND company_id = $2', [id, companyId]);
    if (leadResult.rows.length === 0) {
      throw new ApiError(404, 'Lead not found');
    }

    const lead = leadResult.rows[0];

    if (lead.status === 'converted') {
      throw new ApiError(400, 'Lead has already been converted');
    }

    // Validate the selected plan exists, is active, and belongs to company
    const planResult = await client.query(
      'SELECT * FROM plans WHERE id = $1 AND active = TRUE AND company_id = $2',
      [plan_id, companyId]
    );
    if (planResult.rows.length === 0) {
      throw new ApiError(400, 'Selected plan does not exist or is inactive');
    }

    const plan = planResult.rows[0];

    // Check PPPoE username uniqueness within company
    const existing = await client.query('SELECT id FROM users WHERE username = $1 AND company_id = $2', [username, companyId]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, 'PPPoE username already exists');
    }

    // ── Step 1: Resolve router config + auth strategy ──
    const routerConfig = await getRouterConfigForCompany(companyId);
    const authType = routerConfig?.authType || 'radius';
    const strategy = getStrategy(authType);

    // ── Step 2: Execute strategy-specific user provisioning ──
    routerSyncResult = await strategy.onUserCreate(
      { username, password, fullName: full_name, plan },
      routerConfig
    );

    // ── Step 3: Create user in database ──
    const userResult = await client.query(
      `INSERT INTO users (company_id, username, password, full_name, email, phone, address, created_by, seq_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE((SELECT MAX(seq_id) FROM users WHERE company_id = $1), 0) + 1)
       RETURNING id, username, full_name, email, phone, address, balance, active, seq_id, created_at`,
      [companyId, username, password, full_name, email || null, phone || null, address || null, req.adminId || null]
    );

    const newUser = userResult.rows[0];

    // ── Step 4: Assign the selected plan ──
    await client.query(
      `INSERT INTO user_plans (user_id, plan_id, start_date, active)
       VALUES ($1, $2, CURRENT_DATE, TRUE)`,
      [newUser.id, plan_id]
    );

    // ── Step 5: Update lead status ──
    await client.query(
      `UPDATE leads SET status = 'converted', converted_to = $1, updated_at = NOW() WHERE id = $2`,
      [newUser.id, id]
    );

    // ── Step 6: Add system comment ──
    const syncNote = routerSyncResult.synced
      ? `${authType.toUpperCase()}: ${routerSyncResult.note || routerSyncResult.profile || 'synced'}`
      : `${authType.toUpperCase()}: NOT synced — ${routerSyncResult.error || 'router unreachable'}`;
    await client.query(
      `INSERT INTO lead_comments (lead_id, author, content)
       VALUES ($1, 'System', $2)`,
      [id, `Lead converted to customer: ${username} | Plan: ${plan.name} (${plan.download_speed}/${plan.upload_speed}) | ${syncNote}`]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        user: { ...newUser, plan_name: plan.name },
        lead: { id, status: 'converted', converted_to: newUser.id },
        router: { authType, ...routerSyncResult },
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    // If API mode created a PPP secret but DB failed, roll back
    if (routerSyncResult?.synced && routerSyncResult?.method === 'api' && pppoeUsername) {
      try {
        const rc = await getRouterConfigForCompany(req.companyId);
        await mikrotik.removePPPoESecret(pppoeUsername, rc);
        console.log(`[CONVERT] Rolled back MikroTik secret: ${pppoeUsername}`);
      } catch (cleanupErr) {
        console.error(`[CONVERT] Failed to rollback MikroTik secret: ${cleanupErr.message}`);
      }
    }
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { createLead, getLeads, updateLeadStatus, getLeadById, addComment, getComments, convertLead };
