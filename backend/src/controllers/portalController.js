const pool = require('../config/db');
const radiusDb = require('../config/radiusDb');
const { ApiError } = require('../middleware/errorHandler');
const { generateCustomerToken } = require('../middleware/customerAuth');
const { getRouterConfigForCompany } = require('../services/routerResolver');
const sessionCache = require('../services/sessionCache');
const { checkAndReactivate } = require('../services/billingService');
const { createNotification } = require('./notificationsController');

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

// GET /portal/tickets — Customer's own tickets
const getTickets = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, subject, status, priority, created_at, updated_at
       FROM tickets
       WHERE user_id = $1 AND company_id = $2
       ORDER BY created_at DESC`,
      [req.userId, req.companyId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /portal/tickets — Create support ticket
const createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority } = req.body;
    if (!subject || !description) {
      throw new ApiError(400, 'Subject and description are required');
    }
    const result = await pool.query(
      `INSERT INTO tickets (company_id, user_id, subject, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, 'open') RETURNING *`,
      [req.companyId, req.userId, subject, description, priority || 'medium']
    );

    // Get customer name for notification
    const userRes = await pool.query('SELECT full_name, username FROM users WHERE id = $1', [req.userId]);
    const customerName = userRes.rows[0]?.full_name || userRes.rows[0]?.username || 'Customer';

    // Auto-create admin notification
    await createNotification(
      req.companyId,
      'new_ticket',
      `New ticket from ${customerName}`,
      subject,
      `/tickets/${result.rows[0].id}`,
      result.rows[0].id
    );

    // Auto-create chat message linked to ticket
    await pool.query(
      `INSERT INTO messages (company_id, user_id, content, sender_type, sender_id, ticket_id)
       VALUES ($1, $2, $3, 'customer', $2, $4)`,
      [req.companyId, req.userId, `[Ticket] ${subject}\n\n${description}`, result.rows[0].id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /portal/tickets/:id — Get ticket detail + comments
const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticketRes = await pool.query(
      `SELECT * FROM tickets WHERE id = $1 AND user_id = $2 AND company_id = $3`,
      [id, req.userId, req.companyId]
    );
    if (ticketRes.rows.length === 0) throw new ApiError(404, 'Ticket not found');

    const commentsRes = await pool.query(
      `SELECT tc.*, ca.full_name AS author_name
       FROM ticket_comments tc
       LEFT JOIN company_admins ca ON tc.author_id = ca.id
       WHERE tc.ticket_id = $1
       ORDER BY tc.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: { ...ticketRes.rows[0], comments: commentsRes.rows },
    });
  } catch (err) { next(err); }
};

// POST /portal/tickets/:id/comments — Add comment to ticket (as customer)
const addTicketComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) throw new ApiError(400, 'Content is required');

    // Verify ticket belongs to customer
    const ticket = await pool.query(
      'SELECT id FROM tickets WHERE id = $1 AND user_id = $2 AND company_id = $3',
      [id, req.userId, req.companyId]
    );
    if (ticket.rows.length === 0) throw new ApiError(404, 'Ticket not found');

    const result = await pool.query(
      `INSERT INTO ticket_comments (ticket_id, content, is_customer)
       VALUES ($1, $2, TRUE) RETURNING *`,
      [id, content]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /portal/statistics — customer usage stats from RADIUS accounting
const getStatistics = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get the customer's PPPoE username
    const userRes = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) throw new ApiError(404, 'User not found');
    const username = userRes.rows[0].username;

    // Total bandwidth all time from radacct
    const totalRes = await radiusDb.query(
      `SELECT COALESCE(SUM(acctinputoctets), 0) AS total_upload,
              COALESCE(SUM(acctoutputoctets), 0) AS total_download,
              COUNT(*) AS total_sessions
       FROM radacct WHERE username = $1`,
      [username]
    );

    // This month bandwidth
    const monthRes = await radiusDb.query(
      `SELECT COALESCE(SUM(acctinputoctets), 0) AS month_upload,
              COALESCE(SUM(acctoutputoctets), 0) AS month_download,
              COUNT(*) AS month_sessions
       FROM radacct WHERE username = $1
         AND acctstarttime >= date_trunc('month', NOW())`,
      [username]
    );

    // Today bandwidth
    const todayRes = await radiusDb.query(
      `SELECT COALESCE(SUM(acctinputoctets), 0) AS today_upload,
              COALESCE(SUM(acctoutputoctets), 0) AS today_download,
              COUNT(*) AS today_sessions
       FROM radacct WHERE username = $1
         AND acctstarttime >= date_trunc('day', NOW())`,
      [username]
    );

    // Recent sessions (last 20)
    const sessionsRes = await radiusDb.query(
      `SELECT acctsessionid AS id, framedipaddress AS framed_ip,
              acctstarttime AS start_time, acctstoptime AS stop_time,
              acctinputoctets AS upload_bytes, acctoutputoctets AS download_bytes,
              acctterminatecause AS terminate_cause
       FROM radacct WHERE username = $1
       ORDER BY acctstarttime DESC LIMIT 20`,
      [username]
    );

    // Daily usage for last 30 days
    const dailyRes = await radiusDb.query(
      `SELECT date_trunc('day', acctstarttime)::date AS day,
              COALESCE(SUM(acctoutputoctets), 0) AS download,
              COALESCE(SUM(acctinputoctets), 0) AS upload
       FROM radacct WHERE username = $1
         AND acctstarttime >= NOW() - INTERVAL '30 days'
       GROUP BY day ORDER BY day ASC`,
      [username]
    );

    res.json({
      success: true,
      data: {
        total: totalRes.rows[0],
        month: monthRes.rows[0],
        today: todayRes.rows[0],
        recent_sessions: sessionsRes.rows,
        daily_usage: dailyRes.rows,
      },
    });
  } catch (err) { next(err); }
};

// GET /portal/company — Get company info for payment details
const getCompany = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT name, email, phone, address, bank_details
       FROM companies WHERE id = $1`,
      [req.companyId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Company not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { customerLogin, getMe, getTransactions, redeemVoucher, getTickets, createTicket, getTicketById, addTicketComment, getStatistics, getCompany };
