const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /billable-items
const getItems = async (req, res, next) => {
  try {
    const { type, active } = req.query;
    let query = `
      SELECT bi.*, p.name AS plan_name, p.download_speed, p.upload_speed
      FROM billable_items bi
      LEFT JOIN plans p ON bi.plan_id = p.id
      WHERE bi.company_id = $1
    `;
    const params = [req.companyId];
    if (type) { params.push(type); query += ` AND bi.type = $${params.length}`; }
    if (active !== undefined) { params.push(active === 'true'); query += ` AND bi.active = $${params.length}`; }
    query += ' ORDER BY bi.name ASC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /billable-items/:id
const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT bi.*, p.name AS plan_name FROM billable_items bi
       LEFT JOIN plans p ON bi.plan_id = p.id
       WHERE bi.id = $1 AND bi.company_id = $2`,
      [id, req.companyId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Item not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /billable-items
const createItem = async (req, res, next) => {
  try {
    const { name, description, price, type, taxable, plan_id } = req.body;
    if (!name) throw new ApiError(400, 'Name is required');

    const result = await pool.query(
      `INSERT INTO billable_items (company_id, name, description, price, type, taxable, plan_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.companyId, name, description || null, parseFloat(price) || 0,
       type || 'service', taxable || false, plan_id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /billable-items/:id
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, type, taxable, active, plan_id } = req.body;

    const result = await pool.query(
      `UPDATE billable_items SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        type = COALESCE($4, type),
        taxable = COALESCE($5, taxable),
        active = COALESCE($6, active),
        plan_id = $7,
        updated_at = NOW()
      WHERE id = $8 AND company_id = $9 RETURNING *`,
      [name, description, price !== undefined ? parseFloat(price) : null, type,
       taxable, active, plan_id || null, id, req.companyId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Item not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// DELETE /billable-items/:id
const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM billable_items WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, req.companyId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Item not found');
    res.json({ success: true });
  } catch (err) { next(err); }
};

// POST /billable-items/sync-plans — Auto-create billable items from plans
const syncFromPlans = async (req, res, next) => {
  try {
    const plans = await pool.query(
      'SELECT id, name, price, download_speed, upload_speed FROM plans WHERE company_id = $1 AND active = TRUE',
      [req.companyId]
    );

    let created = 0;
    for (const plan of plans.rows) {
      const exists = await pool.query(
        'SELECT id FROM billable_items WHERE company_id = $1 AND plan_id = $2',
        [req.companyId, plan.id]
      );
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO billable_items (company_id, name, description, price, type, plan_id)
           VALUES ($1,$2,$3,$4,'recurring',$5)`,
          [req.companyId, plan.name, `${plan.download_speed}/${plan.upload_speed} Internet Plan`, plan.price, plan.id]
        );
        created++;
      }
    }

    res.json({ success: true, data: { synced: created } });
  } catch (err) { next(err); }
};

module.exports = { getItems, getItemById, createItem, updateItem, deleteItem, syncFromPlans };
