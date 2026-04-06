const crypto = require('crypto');
const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { checkAndReactivate } = require('../services/billingService');

// Generate a random voucher code like "VCH-A3F8-K9X2"
const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n) => Array.from({ length: n }, () => chars[crypto.randomInt(chars.length)]).join('');
  return `VCH-${seg(4)}-${seg(4)}`;
};

// POST /vouchers/generate — Generate vouchers (admin)
const generateVouchers = async (req, res, next) => {
  try {
    const { amount, count = 1 } = req.body;
    if (!amount || amount <= 0) throw new ApiError(400, 'Amount must be greater than 0');
    if (count < 1 || count > 100) throw new ApiError(400, 'Count must be between 1 and 100');

    const vouchers = [];
    for (let i = 0; i < count; i++) {
      let code;
      let attempts = 0;
      // Ensure unique code
      while (attempts < 10) {
        code = generateCode();
        const exists = await pool.query(
          'SELECT id FROM vouchers WHERE company_id = $1 AND code = $2', [req.companyId, code]
        );
        if (exists.rows.length === 0) break;
        attempts++;
      }

      const result = await pool.query(
        `INSERT INTO vouchers (company_id, code, amount, created_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.companyId, code, amount, req.adminId || null]
      );
      vouchers.push(result.rows[0]);
    }

    res.status(201).json({ success: true, data: vouchers });
  } catch (err) { next(err); }
};

// GET /vouchers — List vouchers (admin)
const getVouchers = async (req, res, next) => {
  try {
    const { used } = req.query;
    let query = `
      SELECT v.*, u.full_name AS used_by_name, u.username AS used_by_username,
        ca.full_name AS created_by_name
      FROM vouchers v
      LEFT JOIN users u ON v.used_by = u.id
      LEFT JOIN company_admins ca ON v.created_by = ca.id
      WHERE v.company_id = $1
    `;
    const params = [req.companyId];
    if (used === 'true') { query += ' AND v.is_used = TRUE'; }
    if (used === 'false') { query += ' AND v.is_used = FALSE'; }
    query += ' ORDER BY v.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// DELETE /vouchers/:id — Delete unused voucher (admin)
const deleteVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM vouchers WHERE id = $1 AND company_id = $2 AND is_used = FALSE RETURNING id',
      [id, req.companyId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Voucher not found or already used');
    res.json({ success: true });
  } catch (err) { next(err); }
};

// POST /vouchers/redeem — Redeem voucher (admin on behalf of customer)
const redeemVoucher = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { code, user_id } = req.body;
    if (!code || !user_id) throw new ApiError(400, 'Voucher code and user_id are required');

    await client.query('BEGIN');

    // Find unused voucher
    const voucherRes = await client.query(
      'SELECT * FROM vouchers WHERE company_id = $1 AND code = $2 AND is_used = FALSE FOR UPDATE',
      [req.companyId, code.trim().toUpperCase()]
    );
    if (voucherRes.rows.length === 0) throw new ApiError(404, 'Invalid or already used voucher');
    const voucher = voucherRes.rows[0];

    // Verify user belongs to company
    const userRes = await client.query(
      'SELECT id, username, balance FROM users WHERE id = $1 AND company_id = $2',
      [user_id, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    // Mark voucher as used
    await client.query(
      'UPDATE vouchers SET is_used = TRUE, used_by = $1, used_at = NOW() WHERE id = $2',
      [user_id, voucher.id]
    );

    // Credit user balance
    await client.query(
      'UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
      [voucher.amount, user_id]
    );

    // Record transaction
    await client.query(
      `INSERT INTO transactions (company_id, user_id, amount, type, description, created_by)
       VALUES ($1, $2, $3, 'credit', $4, $5)`,
      [req.companyId, user_id, voucher.amount, `Voucher redeemed: ${voucher.code}`, req.adminId || null]
    );

    await client.query('COMMIT');

    // Reactivate user if balance is now positive and user was suspended
    await checkAndReactivate(user_id);

    const updatedUser = await pool.query('SELECT balance FROM users WHERE id = $1', [user_id]);

    res.json({
      success: true,
      data: {
        voucher_code: voucher.code,
        amount: voucher.amount,
        new_balance: updatedUser.rows[0].balance,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { generateVouchers, getVouchers, deleteVoucher, redeemVoucher };
