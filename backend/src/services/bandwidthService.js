/**
 * Bandwidth Service — Core logic for rate limiting, abuse detection, throttling, recovery
 *
 * - generateRateLimit(user, plan): builds Mikrotik-Rate-Limit string
 * - getUsageFromRadius(usernames): fetches current session traffic from radacct
 * - flagUser / unflagUser: mark users for throttling
 * - applyThrottle / removeThrottle: update RADIUS rate limit + disconnect session
 */

const pool = require('../config/db');
const radiusDb = require('../config/radiusDb');
const radiusService = require('./radiusService');
const mikrotik = require('./mikrotik');
const { getRouterConfigForCompany } = require('./routerResolver');

// ── Rate Limit Generation ───────────────────────────────────

/**
 * Generate Mikrotik-Rate-Limit string for a user.
 * Format: "rx-rate/tx-rate" (from MikroTik's perspective: rx=upload, tx=download)
 *
 * If user is flagged → use throttled rate limit.
 * Otherwise → use plan's rate limit.
 */
const generateRateLimit = (user, plan) => {
  if (user.is_flagged && user.throttled_rate_limit) {
    return user.throttled_rate_limit;
  }
  if (plan?.radius_rate_limit) {
    return plan.radius_rate_limit;
  }
  if (plan) {
    return `${plan.upload_speed}/${plan.download_speed}`;
  }
  return '2M/10M'; // fallback default
};

// ── Usage from RADIUS Accounting ────────────────────────────

/**
 * Get current session traffic for active users from radacct.
 * Returns Map<username, { upload_bytes, download_bytes, session_seconds }>
 */
const getUsageFromRadius = async (usernames = []) => {
  const usageMap = new Map();

  try {
    let query = `
      SELECT username,
        COALESCE(acctinputoctets, 0) AS upload_bytes,
        COALESCE(acctoutputoctets, 0) AS download_bytes,
        EXTRACT(EPOCH FROM (NOW() - acctstarttime))::INTEGER AS session_seconds
      FROM radacct
      WHERE acctstoptime IS NULL
    `;
    const params = [];

    if (usernames.length > 0) {
      query += ` AND username = ANY($1)`;
      params.push(usernames);
    }

    const result = await radiusDb.query(query, params);
    for (const row of result.rows) {
      usageMap.set(row.username, {
        upload_bytes: parseInt(row.upload_bytes),
        download_bytes: parseInt(row.download_bytes),
        session_seconds: parseInt(row.session_seconds),
      });
    }
  } catch (err) {
    console.error(`[BW-SERVICE] Failed to fetch RADIUS accounting: ${err.message}`);
  }

  return usageMap;
};

/**
 * Calculate upload rate in Mbps from two snapshots (delta bytes / delta time).
 * Returns -1 if we can't compute (no previous snapshot).
 */
const computeUploadRateMbps = (currentBytes, previousBytes, deltaSeconds) => {
  if (deltaSeconds <= 0 || previousBytes === undefined) return -1;
  const deltaBytes = currentBytes - previousBytes;
  if (deltaBytes < 0) return -1; // session restarted
  const bitsPerSecond = (deltaBytes * 8) / deltaSeconds;
  return bitsPerSecond / 1_000_000; // convert to Mbps
};

// ── Abuse Detection ─────────────────────────────────────────

/**
 * Check if a user should be flagged based on sustained upload usage.
 * Looks at recent bandwidth_usage_log entries.
 */
const shouldFlag = async (userId, companyId, settings) => {
  const threshold = parseFloat(settings.upload_threshold_mbps) || 1.5;
  const sustainedMin = parseInt(settings.sustained_minutes) || 5;

  // Get recent samples within the sustained window
  const result = await pool.query(
    `SELECT upload_rate FROM bandwidth_usage_log
     WHERE user_id = $1 AND company_id = $2
       AND sampled_at >= NOW() - ($3 || ' minutes')::INTERVAL
     ORDER BY sampled_at DESC`,
    [userId, companyId, sustainedMin.toString()]
  );

  if (result.rows.length < 2) return false; // not enough data

  // Check if ALL recent samples exceed threshold
  const allAbove = result.rows.every(r => parseFloat(r.upload_rate) > threshold);
  return allAbove;
};

/**
 * Check if a flagged user has recovered (normal usage for recover_minutes).
 */
const shouldRecover = async (userId, companyId, settings) => {
  const threshold = parseFloat(settings.upload_threshold_mbps) || 1.5;
  const recoverMin = parseInt(settings.recover_minutes) || 30;

  const result = await pool.query(
    `SELECT upload_rate FROM bandwidth_usage_log
     WHERE user_id = $1 AND company_id = $2
       AND sampled_at >= NOW() - ($3 || ' minutes')::INTERVAL
     ORDER BY sampled_at DESC`,
    [userId, companyId, recoverMin.toString()]
  );

  if (result.rows.length < 2) return false;

  // All recent samples must be below threshold
  return result.rows.every(r => parseFloat(r.upload_rate) <= threshold);
};

// ── Throttle / Recover Actions ──────────────────────────────

/**
 * Flag and throttle a user.
 * 1. Save original rate limit
 * 2. Update RADIUS with throttled rate
 * 3. Disconnect session so user reconnects with new limit
 */
const throttleUser = async (userId, companyId, reason = 'High upload usage detected') => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get user + plan info
    const userRes = await client.query(
      `SELECT u.username, u.is_flagged,
        p.radius_rate_limit, p.upload_speed, p.download_speed
       FROM users u
       LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
       LEFT JOIN plans p ON up.plan_id = p.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) throw new Error('User not found');
    const user = userRes.rows[0];
    if (user.is_flagged) {
      await client.query('COMMIT');
      return { already_flagged: true };
    }

    const originalRate = user.radius_rate_limit || `${user.upload_speed || '2M'}/${user.download_speed || '10M'}`;

    // Get company throttle settings
    const settingsRes = await client.query(
      `SELECT throttle_download, throttle_upload FROM bandwidth_settings WHERE company_id = $1`,
      [companyId]
    );
    const throttleDl = settingsRes.rows[0]?.throttle_download || '5M';
    const throttleUl = settingsRes.rows[0]?.throttle_upload || '1M';
    const throttledRate = `${throttleUl}/${throttleDl}`;

    // Update user flags
    await client.query(
      `UPDATE users SET
        is_flagged = TRUE,
        flagged_at = NOW(),
        flag_reason = $2,
        original_rate_limit = $3,
        throttled_rate_limit = $4,
        updated_at = NOW()
       WHERE id = $1`,
      [userId, reason, originalRate, throttledRate]
    );

    await client.query('COMMIT');

    // Update RADIUS rate limit
    try {
      await radiusService.updateRateLimit(user.username, throttledRate);
    } catch (err) {
      console.error(`[BW-SERVICE] Failed to update RADIUS rate for ${user.username}: ${err.message}`);
    }

    // Disconnect session to force re-auth with new limits
    try {
      const routerConfig = await getRouterConfigForCompany(companyId);
      if (routerConfig) {
        await mikrotik.disconnectSession(user.username, routerConfig);
      }
    } catch (err) {
      console.error(`[BW-SERVICE] Failed to disconnect ${user.username}: ${err.message}`);
    }

    console.log(`[BW-SERVICE] Throttled user "${user.username}" → ${throttledRate} (was: ${originalRate}) reason: ${reason}`);
    return { throttled: true, username: user.username, throttledRate, originalRate };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Unflag and restore a user to their original rate limit.
 */
const unthrottleUser = async (userId, companyId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      `SELECT username, original_rate_limit, is_flagged FROM users WHERE id = $1`,
      [userId]
    );
    if (userRes.rows.length === 0) throw new Error('User not found');
    const user = userRes.rows[0];

    if (!user.is_flagged) {
      await client.query('COMMIT');
      return { already_normal: true };
    }

    // Restore original rate
    const restoreRate = user.original_rate_limit || '2M/10M';

    await client.query(
      `UPDATE users SET
        is_flagged = FALSE,
        flagged_at = NULL,
        flag_reason = NULL,
        original_rate_limit = NULL,
        throttled_rate_limit = NULL,
        updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');

    // Update RADIUS
    try {
      await radiusService.updateRateLimit(user.username, restoreRate);
    } catch (err) {
      console.error(`[BW-SERVICE] Failed to restore RADIUS rate for ${user.username}: ${err.message}`);
    }

    // Disconnect to apply new rate
    try {
      const routerConfig = await getRouterConfigForCompany(companyId);
      if (routerConfig) {
        await mikrotik.disconnectSession(user.username, routerConfig);
      }
    } catch (err) {
      console.error(`[BW-SERVICE] Failed to disconnect ${user.username}: ${err.message}`);
    }

    console.log(`[BW-SERVICE] Restored user "${user.username}" → ${restoreRate}`);
    return { restored: true, username: user.username, restoredRate: restoreRate };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── Settings ────────────────────────────────────────────────

const getSettings = async (companyId) => {
  const result = await pool.query(
    `SELECT * FROM bandwidth_settings WHERE company_id = $1`,
    [companyId]
  );
  if (result.rows.length === 0) {
    // Return defaults
    return {
      upload_threshold_mbps: 1.5,
      sustained_minutes: 5,
      throttle_download: '5M',
      throttle_upload: '1M',
      auto_recover: true,
      recover_minutes: 30,
      monitor_interval_sec: 120,
      enabled: true,
    };
  }
  return result.rows[0];
};

const upsertSettings = async (companyId, settings) => {
  const result = await pool.query(
    `INSERT INTO bandwidth_settings (company_id, upload_threshold_mbps, sustained_minutes, throttle_download, throttle_upload, auto_recover, recover_minutes, monitor_interval_sec, enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (company_id) DO UPDATE SET
       upload_threshold_mbps = $2,
       sustained_minutes = $3,
       throttle_download = $4,
       throttle_upload = $5,
       auto_recover = $6,
       recover_minutes = $7,
       monitor_interval_sec = $8,
       enabled = $9,
       updated_at = NOW()
     RETURNING *`,
    [
      companyId,
      settings.upload_threshold_mbps ?? 1.5,
      settings.sustained_minutes ?? 5,
      settings.throttle_download ?? '5M',
      settings.throttle_upload ?? '1M',
      settings.auto_recover ?? true,
      settings.recover_minutes ?? 30,
      settings.monitor_interval_sec ?? 120,
      settings.enabled ?? true,
    ]
  );
  return result.rows[0];
};

module.exports = {
  generateRateLimit,
  getUsageFromRadius,
  computeUploadRateMbps,
  shouldFlag,
  shouldRecover,
  throttleUser,
  unthrottleUser,
  getSettings,
  upsertSettings,
};
