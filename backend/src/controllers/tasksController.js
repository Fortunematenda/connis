const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /tasks — list tasks for company
const getTasks = async (req, res, next) => {
  try {
    const { user_id, status, assigned_to } = req.query;
    let query = `
      SELECT t.*, u.full_name AS customer_name,
        ca.full_name AS assigned_name, cb.full_name AS created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN company_admins ca ON t.assigned_to = ca.id
      LEFT JOIN company_admins cb ON t.created_by = cb.id
      WHERE t.company_id = $1
    `;
    const params = [req.companyId];
    if (user_id) { params.push(user_id); query += ` AND t.user_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }
    if (assigned_to) { params.push(assigned_to); query += ` AND t.assigned_to = $${params.length}`; }
    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.full_name AS customer_name,
        ca.full_name AS assigned_name, cb.full_name AS created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN company_admins ca ON t.assigned_to = ca.id
      LEFT JOIN company_admins cb ON t.created_by = cb.id
      WHERE t.id = $1 AND t.company_id = $2`,
      [req.params.id, req.companyId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Task not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /tasks
const createTask = async (req, res, next) => {
  try {
    const { user_id, ticket_id, title, description, priority, assigned_to, due_date } = req.body;
    if (!title) throw new ApiError(400, 'Title is required');

    const result = await pool.query(
      `INSERT INTO tasks (company_id, user_id, ticket_id, title, description, priority, assigned_to, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.companyId, user_id || null, ticket_id || null, title, description || null,
       priority || 'medium', assigned_to || null, due_date || null, req.adminId || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigned_to, due_date } = req.body;

    const sets = [];
    const params = [id, req.companyId];
    if (title !== undefined) { params.push(title); sets.push(`title = $${params.length}`); }
    if (description !== undefined) { params.push(description); sets.push(`description = $${params.length}`); }
    if (status !== undefined) {
      params.push(status); sets.push(`status = $${params.length}`);
      if (status === 'done') sets.push(`completed_at = NOW()`);
      else sets.push(`completed_at = NULL`);
    }
    if (priority !== undefined) { params.push(priority); sets.push(`priority = $${params.length}`); }
    if (assigned_to !== undefined) { params.push(assigned_to || null); sets.push(`assigned_to = $${params.length}`); }
    if (due_date !== undefined) { params.push(due_date || null); sets.push(`due_date = $${params.length}`); }
    sets.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = $1 AND company_id = $2 RETURNING *`, params
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Task not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// DELETE /tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1 AND company_id = $2', [req.params.id, req.companyId]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
