const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { generateCustomerToken } = require('../middleware/customerAuth');
const { getRouterConfigForCompany } = require('../services/routerResolver');
const sessionCache = require('../services/sessionCache');
const { checkAndReactivate } = require('../services/billingService');

// POST /portal/login — Customer login with PPPoE username + password
const customerLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) throw new ApiError(400, 'Username and password are required');

    // Find user by username (password stored in plain text for PPPoE compatibility)
    const userRes = await pool.query(
      `SELECT u.id, u.company_id, u.username, u.password, u.full_name, u.email,
              u.phone, u.address, u.balance, u.active, u.seq_id,
              c.name AS company_name
       FROM users u
       JOIN companies c ON u.company_id = c.id
       WHERE u.username = $1`,
      [username.trim()]
    );

    if (userRes.rows.length === 0) {
      throw new ApiError(401, 'Invalid username or password');
    }

    const user = userRes.rows[0];

    // Check password (plain text comparison — PPPoE passwords are stored plain)
    if (user.password !== password) {
      throw new ApiError(401, 'Invalid username or password');
    }

    if (!user.active) {
      throw new ApiError(403, 'Your account has been suspended. Please contact your ISP.');
    }

    const token = generateCustomerToken(user.id, user.company_id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          balance: user.balance,
          company_name: user.company_name,
        },
      },
    });
  } catch (err) { next(err); }
};

// GET /portal/me — Get current customer info + plan + connection status
const getMe = async (req, res, next) => {
  try {
    const userId = req.userId;
    const companyId = req.companyId;

    // Get user + active plan
    const userRes = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.address,
              u.balance, u.active, u.seq_id, u.created_at,
              p.name AS plan_name, p.download_speed, p.upload_speed, p.price AS plan_price,
              p.billing_type,
              up.start_date AS plan_start, up.end_date AS plan_end
       FROM users u
       LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
       LEFT JOIN plans p ON up.plan_id = p.id
       WHERE u.id = $1 AND u.company_id = $2`,
      [userId, companyId]
    );

    if (userRes.rows.length === 0) throw new ApiError(404, 'Account not found');
    const user = userRes.rows[0];

    // Check online status
    let isOnline = false;
    let ipAddress = null;
    try {
      const routerConfig = await getRouterConfigForCompany(companyId);
      const cached = await sessionCache.getSessions(companyId, routerConfig);
      if (cached.sessionMap?.has(user.username)) {
        isOnline = true;
        const session = cached.sessionMap.get(user.username);
        ipAddress = session?.address || session?.callerStation || null;
      }
    } catch { /* ignore router errors */ }

    // Get company name
    const companyRes = await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]);

    res.json({
      success: true,
      data: {
        ...user,
        is_online: isOnline,
        ip_address: ipAddress,
        company_name: companyRes.rows[0]?.name || '',
      },
    });
  } catch (err) { next(err); }
};

// GET /portal/transactions — Customer's own transaction history
const getTransactions = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await pool.query(
      `SELECT id, amount, type, description, created_at
       FROM transactions
       WHERE user_id = $1 AND company_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.userId, req.companyId, parseInt(limit), parseInt(offset)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /portal/redeem — Customer redeems a voucher
const redeemVoucher = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { code } = req.body;
    if (!code) throw new ApiError(400, 'Voucher code is required');

    await client.query('BEGIN');

    // Find unused voucher belonging to same company
    const voucherRes = await client.query(
      'SELECT * FROM vouchers WHERE company_id = $1 AND code = $2 AND is_used = FALSE FOR UPDATE',
      [req.companyId, code.trim().toUpperCase()]
    );
    if (voucherRes.rows.length === 0) throw new ApiError(404, 'Invalid or already used voucher code');
    const voucher = voucherRes.rows[0];

    // Mark voucher as used
    await client.query(
      'UPDATE vouchers SET is_used = TRUE, used_by = $1, used_at = NOW() WHERE id = $2',
      [req.userId, voucher.id]
    );

    // Credit user balance
    await client.query(
      'UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
      [voucher.amount, req.userId]
    );

    // Record transaction
    await client.query(
      `INSERT INTO transactions (company_id, user_id, amount, type, description)
       VALUES ($1, $2, $3, 'credit', $4)`,
      [req.companyId, req.userId, voucher.amount, `Voucher redeemed: ${voucher.code}`]
    );

    await client.query('COMMIT');

    // Reactivate user if they were suspended and balance is now positive
    await checkAndReactivate(req.userId);

    const updated = await pool.query('SELECT balance FROM users WHERE id = $1', [req.userId]);

    res.json({
      success: true,
      data: {
        voucher_code: voucher.code,
        amount: voucher.amount,
        new_balance: updated.rows[0].balance,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { customerLogin, getMe, getTransactions, redeemVoucher };
