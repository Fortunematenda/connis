const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /tickets — list tickets for company (optionally filter by user_id)
const getTickets = async (req, res, next) => {
  try {
    const { user_id, status } = req.query;
    let query = `
      SELECT t.*, u.full_name AS customer_name, u.username AS customer_username,
        ca.full_name AS assigned_name, cb.full_name AS created_by_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN company_admins ca ON t.assigned_to = ca.id
      LEFT JOIN company_admins cb ON t.created_by = cb.id
      WHERE t.company_id = $1
    `;
    const params = [req.companyId];
    if (user_id) { params.push(user_id); query += ` AND t.user_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }
    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /tickets/:id — single ticket with comments
const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticketRes = await pool.query(
      `SELECT t.*, u.full_name AS customer_name, u.username AS customer_username,
        ca.full_name AS assigned_name, cb.full_name AS created_by_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN company_admins ca ON t.assigned_to = ca.id
      LEFT JOIN company_admins cb ON t.created_by = cb.id
      WHERE t.id = $1 AND t.company_id = $2`,
      [id, req.companyId]
    );
    if (ticketRes.rows.length === 0) throw new ApiError(404, 'Ticket not found');

    const commentsRes = await pool.query(
      `SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC`, [id]
    );

    res.json({ success: true, data: { ...ticketRes.rows[0], comments: commentsRes.rows } });
  } catch (err) { next(err); }
};

// POST /tickets — create ticket
const createTicket = async (req, res, next) => {
  try {
    const { user_id, subject, description, priority, assigned_to } = req.body;
    if (!subject) throw new ApiError(400, 'Subject is required');

    const result = await pool.query(
      `INSERT INTO tickets (company_id, user_id, subject, description, priority, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.companyId, user_id || null, subject, description || null, priority || 'medium', assigned_to || null, req.adminId || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /tickets/:id — update ticket
const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, description, status, priority, assigned_to } = req.body;

    const sets = [];
    const params = [id, req.companyId];
    if (subject !== undefined) { params.push(subject); sets.push(`subject = $${params.length}`); }
    if (description !== undefined) { params.push(description); sets.push(`description = $${params.length}`); }
    if (status !== undefined) {
      params.push(status); sets.push(`status = $${params.length}`);
      if (status === 'closed' || status === 'resolved') sets.push(`closed_at = NOW()`);
    }
    if (priority !== undefined) { params.push(priority); sets.push(`priority = $${params.length}`); }
    if (assigned_to !== undefined) { params.push(assigned_to || null); sets.push(`assigned_to = $${params.length}`); }
    sets.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE tickets SET ${sets.join(', ')} WHERE id = $1 AND company_id = $2 RETURNING *`, params
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Ticket not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /tickets/:id/comments — add comment
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) throw new ApiError(400, 'Content is required');

    // Get admin name
    const adminRes = await pool.query('SELECT full_name FROM company_admins WHERE id = $1', [req.adminId]);
    const authorName = adminRes.rows[0]?.full_name || 'Admin';

    const result = await pool.query(
      `INSERT INTO ticket_comments (ticket_id, author_id, author_name, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, req.adminId, authorName, content]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// DELETE /tickets/:id
const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tickets WHERE id = $1 AND company_id = $2', [id, req.companyId]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getTickets, getTicketById, createTicket, updateTicket, addComment, deleteTicket };
