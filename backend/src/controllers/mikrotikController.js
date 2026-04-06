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

// POST /mikrotik/sync-customers — Import PPPoE secrets from router as customers
const syncCustomersFromRouter = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const routerConfig = await getRouterConfigForCompany(companyId);
    const secrets = await mikrotik.getPPPoESecrets(routerConfig);

    // Get existing usernames in DB for this company
    const existingRes = await pool.query(
      'SELECT username FROM users WHERE company_id = $1', [companyId]
    );
    const existingUsernames = new Set(existingRes.rows.map(r => r.username));

    // Get plans to match profiles
    const plansRes = await pool.query(
      'SELECT id, name, profile_name FROM plans WHERE company_id = $1', [companyId]
    );
    const profileToPlan = {};
    plansRes.rows.forEach(p => {
      if (p.profile_name) profileToPlan[p.profile_name] = p.id;
      profileToPlan[p.name] = p.id;
    });

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const secret of secrets) {
      const username = secret.name;
      if (!username || existingUsernames.has(username)) {
        skipped++;
        continue;
      }

      try {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Insert user
          const userRes = await client.query(
            `INSERT INTO users (company_id, username, full_name, password, active, address)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [
              companyId,
              username,
              secret.comment || username,
              secret.password || '',
              secret.disabled !== 'true',
              secret['caller-id'] || null,
            ]
          );
          const userId = userRes.rows[0].id;

          // Match plan by profile name
          const planId = profileToPlan[secret.profile] || null;
          if (planId) {
            await client.query(
              `INSERT INTO user_plans (user_id, plan_id, active) VALUES ($1, $2, TRUE)
               ON CONFLICT DO NOTHING`,
              [userId, planId]
            );
          }

          await client.query('COMMIT');
          imported++;
          existingUsernames.add(username);
        } catch (e) {
          await client.query('ROLLBACK');
          errors.push(`${username}: ${e.message}`);
        } finally {
          client.release();
        }
      } catch (e) {
        errors.push(`${username}: ${e.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        total_on_router: secrets.length,
        imported,
        skipped,
        errors: errors.slice(0, 10),
      },
    });
  } catch (err) {
    next(new ApiError(502, 'Failed to sync from router: ' + err.message));
  }
};

module.exports = { getStatus, getSessions, getSecrets, getProfilesList, createProfileOnRouter, disconnectUser, syncCustomersFromRouter };
