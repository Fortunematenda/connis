const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { checkAndReactivate } = require('../services/billingService');
const { getComputedBalance, recordTransaction } = require('../services/transactionHelper');
const { generatePaymentInvoice } = require('../services/invoiceService');

// GET /transactions — List transactions for company (admin)
const getTransactions = async (req, res, next) => {
  try {
    const { user_id, type, category, limit = 100, offset = 0 } = req.query;
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
    if (category) { params.push(category); query += ` AND t.category = $${params.length}`; }
    query += ' ORDER BY t.created_at DESC';
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /transactions/user/:userId — Transaction history for a specific customer
const getUserTransactions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type, category, limit = 100, offset = 0 } = req.query;

    // Verify user belongs to company
    const userRes = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2', [userId, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    let query = `
      SELECT t.id, t.amount, t.type, t.category, t.description, t.reference,
        t.created_at, ca.full_name AS created_by_name
      FROM transactions t
      LEFT JOIN company_admins ca ON t.created_by = ca.id
      WHERE t.user_id = $1 AND t.company_id = $2
    `;
    const params = [userId, req.companyId];
    if (type) { params.push(type); query += ` AND t.type = $${params.length}`; }
    if (category) { params.push(category); query += ` AND t.category = $${params.length}`; }
    query += ' ORDER BY t.created_at DESC';
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    // Also return computed balance
    const balance = await getComputedBalance(userId);

    res.json({ success: true, balance, data: result.rows });
  } catch (err) { next(err); }
};

// GET /transactions/balance/:userId — Computed balance for a customer
const getBalance = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userRes = await pool.query(
      'SELECT id, username, full_name FROM users WHERE id = $1 AND company_id = $2',
      [userId, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    const balance = await getComputedBalance(userId);

    // Also get summary by category
    const summaryRes = await pool.query(
      `SELECT category, type,
         COUNT(*) AS count,
         SUM(amount) AS total
       FROM transactions WHERE user_id = $1
       GROUP BY category, type
       ORDER BY category, type`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        user_id: userId,
        username: userRes.rows[0].username,
        full_name: userRes.rows[0].full_name,
        balance,
        summary: summaryRes.rows,
      },
    });
  } catch (err) { next(err); }
};

// POST /transactions/credit — Manual credit (admin)
const addCredit = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id, amount, description, category } = req.body;
    if (!user_id || !amount || amount <= 0) throw new ApiError(400, 'user_id and positive amount required');

    await client.query('BEGIN');

    // Verify user belongs to company
    const userRes = await client.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2', [user_id, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    const tx = await recordTransaction(client, {
      companyId: req.companyId,
      userId: user_id,
      amount,
      type: 'credit',
      category: category || 'manual',
      description: description || 'Manual credit',
      createdBy: req.adminId || null,
    });

    // Auto-generate invoice for credit (payment received)
    let invoice = null;
    try {
      invoice = await generatePaymentInvoice(client, {
        companyId: req.companyId,
        userId: user_id,
        amount,
        description: description || 'Manual credit',
        transactionId: tx.id,
        createdBy: req.adminId || null,
      });
    } catch (invErr) {
      console.warn(`[TRANSACTION] Invoice generation failed: ${invErr.message}`);
    }

    await client.query('COMMIT');

    // Reactivate user if they were suspended and balance is now positive
    await checkAndReactivate(user_id);

    const balance = await getComputedBalance(user_id);
    res.status(201).json({
      success: true,
      data: { transaction: tx, new_balance: balance, invoice },
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
    const { user_id, amount, description, category } = req.body;
    if (!user_id || !amount || amount <= 0) throw new ApiError(400, 'user_id and positive amount required');

    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2', [user_id, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    const tx = await recordTransaction(client, {
      companyId: req.companyId,
      userId: user_id,
      amount,
      type: 'debit',
      category: category || 'manual',
      description: description || 'Manual debit',
      createdBy: req.adminId || null,
    });

    await client.query('COMMIT');

    const balance = await getComputedBalance(user_id);
    res.status(201).json({
      success: true,
      data: { transaction: tx, new_balance: balance },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getTransactions, getUserTransactions, getBalance, addCredit, addDebit };
