const mikrotik = require('../services/mikrotik');
const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { getRouterConfigForCompany } = require('../services/routerResolver');

// GET /mikrotik/status — Test connection and get router info
const getStatus = async (req, res, next) => {
  try {
    const routerConfig = await getRouterConfigForCompany(req.companyId);
    const info = await mikrotik.testConnection(routerConfig);
    res.json({ success: true, data: info });
  } catch (err) {
    res.json({
      success: false,
      data: { connected: false, error: err.message },
    });
  }
};

// GET /mikrotik/sessions — Get active PPPoE sessions from router
const getSessions = async (req, res, next) => {
  try {
    const routerConfig = await getRouterConfigForCompany(req.companyId);
    const sessions = await mikrotik.getActiveSessions(routerConfig);
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    next(new ApiError(502, 'Failed to fetch MikroTik sessions: ' + err.message));
  }
};

// GET /mikrotik/secrets — Get all PPPoE secrets from router
const getSecrets = async (req, res, next) => {
  try {
    const routerConfig = await getRouterConfigForCompany(req.companyId);
    const secrets = await mikrotik.getPPPoESecrets(routerConfig);
    res.json({ success: true, count: secrets.length, data: secrets });
  } catch (err) {
    next(new ApiError(502, 'Failed to fetch MikroTik secrets: ' + err.message));
  }
};

// GET /mikrotik/profiles — Get all PPPoE profiles from router
const getProfilesList = async (req, res, next) => {
  try {
    const routerConfig = await getRouterConfigForCompany(req.companyId);
    const profiles = await mikrotik.getProfiles(routerConfig);
    res.json({ success: true, count: profiles.length, data: profiles });
  } catch (err) {
    next(new ApiError(502, 'Failed to fetch MikroTik profiles: ' + err.message));
  }
};

// POST /mikrotik/profiles — Create a PPPoE profile on router
const createProfileOnRouter = async (req, res, next) => {
  try {
    const { name, rateLimit, comment } = req.body;
    const routerConfig = await getRouterConfigForCompany(req.companyId);
    await mikrotik.createProfile({ name, rateLimit, comment }, routerConfig);
    res.status(201).json({ success: true, message: `Profile '${name}' created on MikroTik` });
  } catch (err) {
    next(new ApiError(502, err.message));
  }
};

// POST /mikrotik/disconnect/:username — Disconnect active session
const disconnectUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const routerConfig = await getRouterConfigForCompany(req.companyId);
    const result = await mikrotik.disconnectSession(username, routerConfig);
    if (!result) {
      throw new ApiError(404, `No active session found for '${username}'`);
    }
    res.json({ success: true, message: `Session disconnected: ${username}` });
  } catch (err) {
    next(err);
  }
};

// POST /mikrotik/sync-customers — Import users from RADIUS DB as customers
const EXCLUDED_PROFILES = ['vpn'];
const EXCLUDED_USERNAMES = ['branch1', 'remote-admin', 'vpn'];

const syncCustomersFromRouter = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const radiusDb = require('../config/radiusDb');

    const radiusUsers = await radiusDb.query(`
      SELECT rc.username, rc.value AS password,
        (SELECT rug.groupname FROM radusergroup rug WHERE rug.username = rc.username LIMIT 1) AS groupname
      FROM radcheck rc
      WHERE rc.attribute = 'Cleartext-Password'
      ORDER BY rc.username
    `);

    const existingRes = await pool.query('SELECT username FROM users WHERE company_id = $1', [companyId]);
    const existing = new Set(existingRes.rows.map(r => r.username));

    const plansRes = await pool.query('SELECT id, name, mikrotik_profile FROM plans WHERE company_id = $1', [companyId]);
    const profileToPlan = {};
    plansRes.rows.forEach(p => {
      if (p.mikrotik_profile) profileToPlan[p.mikrotik_profile] = p.id;
      profileToPlan[p.name] = p.id;
    });

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const ru of radiusUsers.rows) {
      const username = ru.username;
      if (!username || existing.has(username)) { skipped++; continue; }
      if (EXCLUDED_USERNAMES.includes(username.toLowerCase())) { skipped++; continue; }
      if (ru.groupname && EXCLUDED_PROFILES.includes(ru.groupname.toLowerCase())) { skipped++; continue; }

      try {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const userRes = await client.query(
            `INSERT INTO users (company_id, username, full_name, password, active)
             VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
            [companyId, username, username, ru.password || '']
          );
          const planId = profileToPlan[ru.groupname] || null;
          if (planId) {
            await client.query('INSERT INTO user_plans (user_id, plan_id, active) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING', [userRes.rows[0].id, planId]);
          }
          await client.query('COMMIT');
          imported++;
          existing.add(username);
        } catch (e) {
          await client.query('ROLLBACK');
          errors.push(`${username}: ${e.message}`);
        } finally { client.release(); }
      } catch (e) { errors.push(`${username}: ${e.message}`); }
    }

    res.json({
      success: true,
      data: { total_in_radius: radiusUsers.rows.length, imported, skipped, errors: errors.slice(0, 10) },
    });
  } catch (err) {
    next(new ApiError(502, 'Failed to sync from RADIUS: ' + err.message));
  }
};

module.exports = { getStatus, getSessions, getSecrets, getProfilesList, createProfileOnRouter, disconnectUser, syncCustomersFromRouter };
