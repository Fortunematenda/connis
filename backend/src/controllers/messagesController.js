const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { createNotification } = require('./notificationsController');

// ── ADMIN endpoints ──

// GET /messages/conversations — list all customer conversations with last message
const getConversations = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        u.id AS user_id, u.username, u.full_name, u.email,
        (SELECT COUNT(*) FROM messages m WHERE m.user_id = u.id AND m.company_id = $1 AND m.is_read = FALSE AND m.sender_type = 'customer') AS unread_count,
        (SELECT content FROM messages m2 WHERE m2.user_id = u.id AND m2.company_id = $1 ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages m3 WHERE m3.user_id = u.id AND m3.company_id = $1 ORDER BY m3.created_at DESC LIMIT 1) AS last_message_at
       FROM users u
       WHERE u.company_id = $1
         AND EXISTS (SELECT 1 FROM messages m WHERE m.user_id = u.id AND m.company_id = $1)
       ORDER BY last_message_at DESC`,
      [req.companyId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /messages/:userId — get messages for a specific customer conversation
const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    // Mark customer messages as read
    await pool.query(
      `UPDATE messages SET is_read = TRUE
       WHERE user_id = $1 AND company_id = $2 AND sender_type = 'customer' AND is_read = FALSE`,
      [userId, req.companyId]
    );

    const result = await pool.query(
      `SELECT m.*, u.full_name AS user_name, u.username,
              ca.full_name AS admin_name
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       LEFT JOIN company_admins ca ON m.sender_type = 'admin' AND m.sender_id = ca.id
       WHERE m.user_id = $1 AND m.company_id = $2
       ORDER BY m.created_at ASC
       LIMIT $3`,
      [userId, req.companyId, parseInt(limit)]
    );

    // Get user info
    const userRes = await pool.query(
      'SELECT id, username, full_name, email, phone FROM users WHERE id = $1 AND company_id = $2',
      [userId, req.companyId]
    );

    res.json({
      success: true,
      data: { messages: result.rows, user: userRes.rows[0] || null },
    });
  } catch (err) { next(err); }
};

// POST /messages/:userId — admin sends a message to customer
const sendMessage = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { content, ticket_id } = req.body;
    if (!content) throw new ApiError(400, 'Content is required');

    const result = await pool.query(
      `INSERT INTO messages (company_id, user_id, content, sender_type, sender_id, ticket_id)
       VALUES ($1, $2, $3, 'admin', $4, $5) RETURNING *`,
      [req.companyId, userId, content, req.adminId, ticket_id || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /messages/unread-count — total unread messages from customers
const getUnreadMessageCount = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM messages
       WHERE company_id = $1 AND sender_type = 'customer' AND is_read = FALSE`,
      [req.companyId]
    );
    res.json({ success: true, data: { count: parseInt(result.rows[0].count) } });
  } catch (err) { next(err); }
};

// ── PORTAL (customer) endpoints ──

// GET /portal/messages — customer gets their conversation
const getCustomerMessages = async (req, res, next) => {
  try {
    // Mark admin messages as read
    await pool.query(
      `UPDATE messages SET is_read = TRUE
       WHERE user_id = $1 AND company_id = $2 AND sender_type = 'admin' AND is_read = FALSE`,
      [req.userId, req.companyId]
    );

    const result = await pool.query(
      `SELECT m.*, ca.full_name AS admin_name
       FROM messages m
       LEFT JOIN company_admins ca ON m.sender_type = 'admin' AND m.sender_id = ca.id
       WHERE m.user_id = $1 AND m.company_id = $2
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.userId, req.companyId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /portal/messages — customer sends a message
const sendCustomerMessage = async (req, res, next) => {
  try {
    const { content, ticket_id } = req.body;
    if (!content) throw new ApiError(400, 'Content is required');

    const result = await pool.query(
      `INSERT INTO messages (company_id, user_id, content, sender_type, sender_id, ticket_id)
       VALUES ($1, $2, $3, 'customer', $2, $4) RETURNING *`,
      [req.companyId, req.userId, content, ticket_id || null]
    );

    // Get customer name for notification
    const userRes = await pool.query('SELECT full_name, username FROM users WHERE id = $1', [req.userId]);
    const customerName = userRes.rows[0]?.full_name || userRes.rows[0]?.username || 'Customer';

    // Create admin notification
    await createNotification(
      req.companyId,
      'new_message',
      `New message from ${customerName}`,
      content.substring(0, 100),
      `/messages/${req.userId}`,
      result.rows[0].id
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /portal/messages/unread-count — customer unread count
const getCustomerUnreadCount = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM messages
       WHERE user_id = $1 AND company_id = $2 AND sender_type = 'admin' AND is_read = FALSE`,
      [req.userId, req.companyId]
    );
    res.json({ success: true, data: { count: parseInt(result.rows[0].count) } });
  } catch (err) { next(err); }
};

module.exports = {
  getConversations, getMessages, sendMessage, getUnreadMessageCount,
  getCustomerMessages, sendCustomerMessage, getCustomerUnreadCount,
};
