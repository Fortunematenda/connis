const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// POST /plans/create — Create a new internet plan
const createPlan = async (req, res, next) => {
  try {
    const { name, download_speed, upload_speed, price, mikrotik_profile, radius_rate_limit, description } = req.body;
    const companyId = req.companyId;

    // Check for duplicate plan name within company
    const existing = await pool.query('SELECT id FROM plans WHERE name = $1 AND company_id = $2', [name, companyId]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, 'Plan name already exists');
    }

    // Auto-generate radius rate limit from speeds if not provided (format: rx/tx for MikroTik)
    const autoRateLimit = radius_rate_limit || `${upload_speed}/${download_speed}`;

    const result = await pool.query(
      `INSERT INTO plans (company_id, name, download_speed, upload_speed, price, mikrotik_profile, radius_rate_limit, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [companyId, name, download_speed, upload_speed, price, mikrotik_profile || name, autoRateLimit, description]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// GET /plans — List all plans
const getPlans = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM plans WHERE active = TRUE AND company_id = $1 ORDER BY price ASC',
      [req.companyId]
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

// PUT /plans/:id — Update a plan
const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, download_speed, upload_speed, price, mikrotik_profile, radius_rate_limit, description } = req.body;

    const existing = await pool.query('SELECT id FROM plans WHERE id = $1 AND company_id = $2', [id, req.companyId]);
    if (existing.rows.length === 0) {
      throw new ApiError(404, 'Plan not found');
    }

    const result = await pool.query(
      `UPDATE plans SET
        name = COALESCE($1, name),
        download_speed = COALESCE($2, download_speed),
        upload_speed = COALESCE($3, upload_speed),
        price = COALESCE($4, price),
        mikrotik_profile = COALESCE($5, mikrotik_profile),
        radius_rate_limit = COALESCE($6, radius_rate_limit),
        description = COALESCE($7, description),
        updated_at = NOW()
      WHERE id = $8 AND company_id = $9
      RETURNING *`,
      [name, download_speed, upload_speed, price, mikrotik_profile, radius_rate_limit, description, id, req.companyId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /plans/:id — Soft-delete (deactivate) a plan
const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE plans SET active = FALSE, updated_at = NOW() WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, req.companyId]
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Plan not found');
    }
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPlan, getPlans, updatePlan, deletePlan };
