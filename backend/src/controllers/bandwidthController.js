const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const bandwidthService = require('../services/bandwidthService');
const radiusDb = require('../config/radiusDb');

// GET /bandwidth/live — Live usage for all active users
const getLiveUsage = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    // Get all active users with plan info
    const usersRes = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.is_flagged, u.flagged_at, u.flag_reason,
        u.original_rate_limit, u.throttled_rate_limit,
        p.name AS plan_name, p.download_speed, p.upload_speed, p.radius_rate_limit
       FROM users u
       LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
       LEFT JOIN plans p ON up.plan_id = p.id
       WHERE u.company_id = $1 AND u.active = TRUE
       ORDER BY u.full_name`,
      [companyId]
    );

    const usernames = usersRes.rows.map(u => u.username);
    if (usernames.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get current session data (MikroTik API first, radacct fallback)
    const currentUsage = await bandwidthService.getUsage(usernames, companyId);

    // Get latest rate samples from bandwidth_usage_log (last entry per user)
    const latestRates = await pool.query(
      `SELECT DISTINCT ON (user_id) user_id, upload_rate, download_rate, sampled_at
       FROM bandwidth_usage_log
       WHERE company_id = $1 AND sampled_at >= NOW() - INTERVAL '10 minutes'
       ORDER BY user_id, sampled_at DESC`,
      [companyId]
    );
    const rateMap = new Map(latestRates.rows.map(r => [r.user_id, r]));

    const data = usersRes.rows.map(user => {
      const usage = currentUsage.get(user.username);
      const rate = rateMap.get(user.id);
      const rateLimit = bandwidthService.generateRateLimit(user, {
        radius_rate_limit: user.radius_rate_limit,
        upload_speed: user.upload_speed,
        download_speed: user.download_speed,
      });

      const uploadBytes = usage?.upload_bytes || 0;
      const downloadBytes = usage?.download_bytes || 0;
      const sessionSec = usage?.session_seconds || 0;

      // Use log rates if available, otherwise compute average from total bytes/session time
      let uploadMbps = rate ? parseFloat(rate.upload_rate) : 0;
      let downloadMbps = rate ? parseFloat(rate.download_rate) : 0;
      if (uploadMbps === 0 && uploadBytes > 0 && sessionSec > 0) {
        uploadMbps = (uploadBytes * 8) / sessionSec / 1_000_000;
      }
      if (downloadMbps === 0 && downloadBytes > 0 && sessionSec > 0) {
        downloadMbps = (downloadBytes * 8) / sessionSec / 1_000_000;
      }

      return {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        plan_name: user.plan_name,
        download_speed: user.download_speed,
        upload_speed: user.upload_speed,
        rate_limit: rateLimit,
        is_flagged: user.is_flagged,
        flagged_at: user.flagged_at,
        flag_reason: user.flag_reason,
        is_online: !!usage,
        session_seconds: sessionSec,
        upload_bytes: uploadBytes,
        download_bytes: downloadBytes,
        current_upload_mbps: parseFloat(uploadMbps.toFixed(2)),
        current_download_mbps: parseFloat(downloadMbps.toFixed(2)),
        last_sampled: rate?.sampled_at || null,
      };
    });

    // Sort: online first, then by upload bytes descending (most usage on top)
    data.sort((a, b) => {
      if (a.is_online !== b.is_online) return b.is_online - a.is_online;
      return b.upload_bytes - a.upload_bytes;
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /bandwidth/aggregate — Aggregate bandwidth time-series for charts
const getAggregate = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const range = req.query.range || '1h'; // 1h, 24h, 7d

    let interval;
    switch (range) {
      case '7d': interval = '7 days'; break;
      case '24h': interval = '24 hours'; break;
      case '1h':
      default: interval = '1 hour'; break;
    }

    const result = await pool.query(
      `SELECT total_upload_mbps AS upload, total_download_mbps AS download,
              active_users, sampled_at AS timestamp
       FROM bandwidth_aggregate_log
       WHERE company_id = $1 AND sampled_at >= NOW() - INTERVAL '${interval}'
       ORDER BY sampled_at ASC`,
      [companyId]
    );

    // Today's totals: delta between first and last snapshot today per user
    // (bytes are cumulative MikroTik session counters, so we need last - first)
    const totalsRes = await pool.query(
      `WITH first_snap AS (
         SELECT DISTINCT ON (user_id) user_id,
           upload_bytes AS ub, download_bytes AS db
         FROM bandwidth_usage_log
         WHERE company_id = $1 AND sampled_at >= CURRENT_DATE
         ORDER BY user_id, sampled_at ASC
       ),
       last_snap AS (
         SELECT DISTINCT ON (user_id) user_id,
           upload_bytes AS ub, download_bytes AS db
         FROM bandwidth_usage_log
         WHERE company_id = $1 AND sampled_at >= CURRENT_DATE
         ORDER BY user_id, sampled_at DESC
       )
       SELECT
         COALESCE(SUM(GREATEST(l.ub - f.ub, 0)), 0) AS total_upload_bytes,
         COALESCE(SUM(GREATEST(l.db - f.db, 0)), 0) AS total_download_bytes
       FROM last_snap l
       JOIN first_snap f ON l.user_id = f.user_id`,
      [companyId]
    );

    const totals = totalsRes.rows[0] || {};

    res.json({
      success: true,
      data: {
        series: result.rows.map(r => ({
          timestamp: r.timestamp,
          download: parseFloat(r.download) || 0,
          upload: parseFloat(r.upload) || 0,
          active_users: r.active_users || 0,
        })),
        today_upload_bytes: parseInt(totals.total_upload_bytes) || 0,
        today_download_bytes: parseInt(totals.total_download_bytes) || 0,
      },
    });
  } catch (err) { next(err); }
};

// GET /bandwidth/flagged — Only flagged/throttled users
const getFlaggedUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.is_flagged, u.flagged_at, u.flag_reason,
        u.original_rate_limit, u.throttled_rate_limit,
        p.name AS plan_name
       FROM users u
       LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
       LEFT JOIN plans p ON up.plan_id = p.id
       WHERE u.company_id = $1 AND u.is_flagged = TRUE
       ORDER BY u.flagged_at DESC`,
      [req.companyId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /bandwidth/throttle/:userId — Manually throttle a user
const throttleUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const reason = req.body.reason || 'Manual throttle by admin';
    const result = await bandwidthService.throttleUser(userId, req.companyId, reason);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// POST /bandwidth/unthrottle/:userId — Manually restore a user
const unthrottleUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await bandwidthService.unthrottleUser(userId, req.companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// GET /bandwidth/history/:userId — Usage history for a specific user (last 24h)
const getUserHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT upload_rate, download_rate, upload_bytes, download_bytes, sampled_at
       FROM bandwidth_usage_log
       WHERE user_id = $1 AND company_id = $2
       ORDER BY sampled_at DESC
       LIMIT 200`,
      [userId, req.companyId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /bandwidth/settings — Get bandwidth monitoring settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await bandwidthService.getSettings(req.companyId);
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

// PUT /bandwidth/settings — Update bandwidth monitoring settings
const updateSettings = async (req, res, next) => {
  try {
    const settings = await bandwidthService.upsertSettings(req.companyId, req.body);
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

// GET /bandwidth/top-uploaders — Top 10 uploaders right now
const getTopUploaders = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (bl.user_id)
        bl.user_id, bl.username, bl.upload_rate, bl.download_rate, bl.sampled_at,
        u.full_name, u.is_flagged,
        p.name AS plan_name
       FROM bandwidth_usage_log bl
       JOIN users u ON bl.user_id = u.id
       LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
       LEFT JOIN plans p ON up.plan_id = p.id
       WHERE bl.company_id = $1 AND bl.sampled_at >= NOW() - INTERVAL '10 minutes'
       ORDER BY bl.user_id, bl.sampled_at DESC`,
      [req.companyId]
    );

    // Sort by upload_rate descending and take top 10
    const sorted = result.rows
      .sort((a, b) => parseFloat(b.upload_rate) - parseFloat(a.upload_rate))
      .slice(0, 10);

    res.json({ success: true, data: sorted });
  } catch (err) { next(err); }
};

module.exports = {
  getLiveUsage,
  getAggregate,
  getFlaggedUsers,
  throttleUser,
  unthrottleUser,
  getUserHistory,
  getSettings,
  updateSettings,
  getTopUploaders,
};
