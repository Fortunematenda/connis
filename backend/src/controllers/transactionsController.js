const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { checkAndReactivate } = require('../services/billingService');

// GET /transactions — List transactions for company (admin)
const getTransactions = async (req, res, next) => {
  try {
    const { user_id, type, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT t.*, u.full_name AS customer_name, u.username AS customer_username,
        ca.full_name AS created_by_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN company_admins ca ON t.created_by = ca.id
      WHERE t.company_id = $1
    `;
    const params = [req.companyId];
    if (user_id) { params.push(user_id); query += ` AND t.user_id = $${params.length}`; }
    if (type) { params.push(type); query += ` AND t.type = $${params.length}`; }
    query += ' ORDER BY t.created_at DESC';
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /transactions/credit — Manual credit (admin)
const addCredit = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id, amount, description } = req.body;
    if (!user_id || !amount || amount <= 0) throw new ApiError(400, 'user_id and positive amount required');

    await client.query('BEGIN');

    // Verify user belongs to company
    const userRes = await client.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2', [user_id, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    // Credit balance
    await client.query(
      'UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
      [amount, user_id]
    );

    // Record transaction
    const txRes = await client.query(
      `INSERT INTO transactions (company_id, user_id, amount, type, description, created_by)
       VALUES ($1, $2, $3, 'credit', $4, $5) RETURNING *`,
      [req.companyId, user_id, amount, description || 'Manual credit', req.adminId || null]
    );

    await client.query('COMMIT');

    // Reactivate user if they were suspended and balance is now positive
    await checkAndReactivate(user_id);

    const updated = await pool.query('SELECT balance FROM users WHERE id = $1', [user_id]);
    res.status(201).json({
      success: true,
      data: { transaction: txRes.rows[0], new_balance: updated.rows[0].balance },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /transactions/debit — Manual debit (admin)
const addDebit = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id, amount, description } = req.body;
    if (!user_id || !amount || amount <= 0) throw new ApiError(400, 'user_id and positive amount required');

    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT id, balance FROM users WHERE id = $1 AND company_id = $2', [user_id, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    // Debit balance
    await client.query(
      'UPDATE users SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
      [amount, user_id]
    );

    // Record transaction
    const txRes = await client.query(
      `INSERT INTO transactions (company_id, user_id, amount, type, description, created_by)
       VALUES ($1, $2, $3, 'debit', $4, $5) RETURNING *`,
      [req.companyId, user_id, amount, description || 'Manual debit', req.adminId || null]
    );

    await client.query('COMMIT');

    const updated = await pool.query('SELECT balance FROM users WHERE id = $1', [user_id]);
    res.status(201).json({
      success: true,
      data: { transaction: txRes.rows[0], new_balance: updated.rows[0].balance },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getTransactions, addCredit, addDebit };
