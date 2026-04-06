const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { getRouterConfigForCompany } = require('../services/routerResolver');
const sessionCache = require('../services/sessionCache');

// POST /users/create — Register a new ISP subscriber
const createUser = async (req, res, next) => {
  try {
    const { username, password, full_name, email, phone, address } = req.body;

    const companyId = req.companyId;

    // Check for duplicate username within company
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 AND company_id = $2', [username, companyId]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, 'Username already exists');
    }

    const result = await pool.query(
      `INSERT INTO users (company_id, username, password, full_name, email, phone, address, created_by, seq_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE((SELECT MAX(seq_id) FROM users WHERE company_id = $1), 0) + 1)
       RETURNING id, username, full_name, email, phone, address, balance, active, seq_id, created_at`,
      [companyId, username, password, full_name, email, phone, address, req.adminId || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// GET /users — List all subscribers
const getUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, email, phone, address, balance, active, created_at
       FROM users WHERE company_id = $1 ORDER BY created_at DESC`,
      [req.companyId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /users/:id — Get single user with their plan
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.address,
              u.balance, u.active, u.created_at,
              p.name AS plan_name, p.download_speed, p.upload_speed, p.price AS plan_price
       FROM users u
       LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
       LEFT JOIN plans p ON up.plan_id = p.id
       WHERE u.id = $1 AND u.company_id = $2`,
      [id, req.companyId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// GET /users/status — Live user status using cached MikroTik sessions + RADIUS accounting
// Splynx-style: server-side cache refreshes every 30s, clients poll the cache (no flickering)
const getUsersStatus = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const forceRefresh = req.query.refresh === 'true';

    // 1. Fetch all users for this company with their plan info
    const usersResult = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.active,
              p.name AS plan_name, p.download_speed, p.upload_speed
       FROM users u
       LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
       LEFT JOIN plans p ON up.plan_id = p.id
       WHERE u.company_id = $1
       ORDER BY u.username ASC`,
      [companyId]
    );

    const users = usersResult.rows;

    // 2. Get cached sessions (refreshes from MikroTik/RADIUS every 30s, not per request)
    const routerConfig = await getRouterConfigForCompany(companyId);
    const cached = forceRefresh
      ? await sessionCache.forceRefresh(companyId, routerConfig)
      : await sessionCache.getSessions(companyId, routerConfig);

    // 3. Merge users with cached session data
    const merged = users.map((user) => {
      const session = cached.sessionMap.get(user.username);
      return {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        active: user.active,
        plan_name: user.plan_name,
        download_speed: user.download_speed,
        upload_speed: user.upload_speed,
        online: !!session,
        ip: session?.ip || null,
        uptime: session?.uptime || null,
        caller_id: session?.callerId || null,
      };
    });

    const onlineCount = merged.filter((u) => u.online).length;

    res.json({
      success: true,
      routerOnline: cached.routerOnline,
      count: merged.length,
      online: onlineCount,
      offline: merged.length - onlineCount,
      lastUpdate: cached.lastUpdate,
      data: merged,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createUser, getUsers, getUserById, getUsersStatus };
