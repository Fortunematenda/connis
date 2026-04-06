const pool = require('../config/db');

// ── Computed balance from transactions (source of truth) ──
const getComputedBalance = async (userId) => {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) -
       COALESCE(SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END), 0) AS balance
     FROM transactions WHERE user_id = $1`,
    [userId]
  );
  return parseFloat(result.rows[0].balance);
};

// ── Record a transaction and sync cached balance on users table ──
// Returns the inserted transaction row
const recordTransaction = async (client, { companyId, userId, amount, type, category, description, reference, createdBy }) => {
  // Insert transaction (source of truth)
  const txRes = await client.query(
    `INSERT INTO transactions (company_id, user_id, amount, type, category, description, reference, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [companyId, userId, amount, type, category || 'manual', description || '', reference || null, createdBy || null]
  );

  // Sync cached balance on users table (denormalized for read performance)
  const sign = type === 'credit' ? '+' : '-';
  await client.query(
    `UPDATE users SET balance = balance ${sign} $1, updated_at = NOW() WHERE id = $2`,
    [amount, userId]
  );

  return txRes.rows[0];
};

// ── Get computed balance via subquery (for use in SELECT statements) ──
// Returns SQL snippet to replace u.balance
const BALANCE_SUBQUERY = `(
  COALESCE((SELECT SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END)
            FROM transactions t WHERE t.user_id = u.id), 0)
)`;

module.exports = { getComputedBalance, recordTransaction, BALANCE_SUBQUERY };
