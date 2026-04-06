const pool = require('../config/db');

// Helper: create a notification (called from other controllers)
const createNotification = async (companyId, type, title, body, link, refId) => {
  try {
    await pool.query(
      `INSERT INTO notifications (company_id, type, title, body, link, ref_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [companyId, type, title, body || null, link || null, refId || null]
    );
  } catch (err) {
    console.error('[Notifications] Failed to create:', err.message);
  }
};

// GET /notifications — list notifications for company
const getNotifications = async (req, res, next) => {
  try {
    const { limit = 30, unread_only } = req.query;
    let query = 'SELECT * FROM notifications WHERE company_id = $1';
    const params = [req.companyId];
    if (unread_only === 'true') {
      query += ' AND is_read = FALSE';
    }
    query += ' ORDER BY created_at DESC LIMIT $2';
    params.push(parseInt(limit));
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /notifications/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE company_id = $1 AND is_read = FALSE',
      [req.companyId]
    );
    res.json({ success: true, data: { count: parseInt(result.rows[0].count) } });
  } catch (err) { next(err); }
};

// PUT /notifications/:id/read — mark one as read
const markRead = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND company_id = $2',
      [req.params.id, req.companyId]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// PUT /notifications/read-all — mark all as read
const markAllRead = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE company_id = $1 AND is_read = FALSE',
      [req.companyId]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { createNotification, getNotifications, getUnreadCount, markRead, markAllRead };
