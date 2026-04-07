/**
 * Bandwidth Monitor — Background worker
 *
 * Runs periodically per company:
 * 1. Fetches current upload/download from radacct (active sessions)
 * 2. Computes delta rates from previous samples
 * 3. Logs to bandwidth_usage_log
 * 4. Auto-flags users with sustained high upload
 * 5. Auto-recovers flagged users whose usage normalized
 */

const pool = require('../config/db');
const radiusDb = require('../config/radiusDb');
const bandwidthService = require('./bandwidthService');

// In-memory: previous sample per user for delta computation
// Map<companyId, Map<username, { upload_bytes, download_bytes, timestamp }>>
const previousSamples = new Map();

let running = false;
let intervalHandle = null;

/**
 * Single monitoring cycle — runs for ALL companies with bandwidth monitoring enabled.
 */
const runCycle = async () => {
  if (running) return;
  running = true;

  try {
    // Get all companies with active bandwidth monitoring
    const companiesRes = await pool.query(
      `SELECT c.id AS company_id
       FROM companies c
       LEFT JOIN bandwidth_settings bs ON bs.company_id = c.id
       WHERE c.subscription_status IN ('active', 'trial')
         AND (bs.enabled IS NULL OR bs.enabled = TRUE)`
    );

    for (const { company_id } of companiesRes.rows) {
      try {
        await monitorCompany(company_id);
      } catch (err) {
        console.error(`[BW-MONITOR] Error monitoring company ${company_id}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[BW-MONITOR] Cycle error: ${err.message}`);
  } finally {
    running = false;
  }
};

/**
 * Monitor a single company's users.
 */
const monitorCompany = async (companyId) => {
  const settings = await bandwidthService.getSettings(companyId);

  // Get active users for this company
  const usersRes = await pool.query(
    `SELECT u.id, u.username, u.is_flagged, u.flagged_at
     FROM users u
     WHERE u.company_id = $1 AND u.active = TRUE`,
    [companyId]
  );

  if (usersRes.rows.length === 0) return;

  const usernames = usersRes.rows.map(u => u.username);
  const userMap = new Map(usersRes.rows.map(u => [u.username, u]));

  // Fetch current traffic (MikroTik API first, radacct fallback)
  const currentUsage = await bandwidthService.getUsage(usernames, companyId);

  if (!previousSamples.has(companyId)) {
    previousSamples.set(companyId, new Map());
  }
  const prevMap = previousSamples.get(companyId);
  const now = Date.now();

  for (const [username, current] of currentUsage) {
    const user = userMap.get(username);
    if (!user) continue;

    const prev = prevMap.get(username);
    let uploadRateMbps = 0;
    let downloadRateMbps = 0;

    if (prev) {
      const deltaSec = (now - prev.timestamp) / 1000;
      if (deltaSec > 0) {
        uploadRateMbps = bandwidthService.computeUploadRateMbps(
          current.upload_bytes, prev.upload_bytes, deltaSec
        );
        downloadRateMbps = bandwidthService.computeUploadRateMbps(
          current.download_bytes, prev.download_bytes, deltaSec
        );
        if (uploadRateMbps < 0) uploadRateMbps = 0;
        if (downloadRateMbps < 0) downloadRateMbps = 0;
      }
    }

    // Save current as previous for next cycle
    prevMap.set(username, {
      upload_bytes: current.upload_bytes,
      download_bytes: current.download_bytes,
      timestamp: now,
    });

    // Log to bandwidth_usage_log
    try {
      await pool.query(
        `INSERT INTO bandwidth_usage_log (company_id, user_id, username, upload_bytes, download_bytes, upload_rate, download_rate, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'radacct')`,
        [companyId, user.id, username, current.upload_bytes, current.download_bytes,
         uploadRateMbps.toFixed(2), downloadRateMbps.toFixed(2)]
      );
    } catch (err) {
      console.warn(`[BW-MONITOR] Failed to log usage for ${username}: ${err.message}`);
    }

    // Auto-flag check (only if not already flagged and we have valid rate data)
    if (!user.is_flagged && uploadRateMbps > 0) {
      try {
        const shouldThrottle = await bandwidthService.shouldFlag(user.id, companyId, settings);
        if (shouldThrottle) {
          await bandwidthService.throttleUser(user.id, companyId, `Sustained upload > ${settings.upload_threshold_mbps} Mbps`);
          console.log(`[BW-MONITOR] Auto-throttled: ${username} (upload: ${uploadRateMbps.toFixed(2)} Mbps)`);
        }
      } catch (err) {
        console.error(`[BW-MONITOR] Auto-flag error for ${username}: ${err.message}`);
      }
    }

    // Auto-recover check
    if (user.is_flagged && settings.auto_recover) {
      try {
        const shouldRestore = await bandwidthService.shouldRecover(user.id, companyId, settings);
        if (shouldRestore) {
          await bandwidthService.unthrottleUser(user.id, companyId);
          console.log(`[BW-MONITOR] Auto-recovered: ${username}`);
        }
      } catch (err) {
        console.error(`[BW-MONITOR] Auto-recover error for ${username}: ${err.message}`);
      }
    }
  }

  // ── Store aggregate snapshot for the chart ──────────────────
  try {
    let totalUpload = 0, totalDownload = 0, onlineCount = 0;
    for (const [username, current] of currentUsage) {
      const user = userMap.get(username);
      if (!user) continue;
      onlineCount++;
      const prev = prevMap.get(username);
      if (prev) {
        const deltaSec = (now - prev.timestamp) / 1000;
        if (deltaSec > 0) {
          const uRate = bandwidthService.computeUploadRateMbps(current.upload_bytes, prev.upload_bytes, deltaSec);
          const dRate = bandwidthService.computeUploadRateMbps(current.download_bytes, prev.download_bytes, deltaSec);
          if (uRate > 0) totalUpload += uRate;
          if (dRate > 0) totalDownload += dRate;
        }
      }
    }
    await pool.query(
      `INSERT INTO bandwidth_aggregate_log (company_id, total_upload_mbps, total_download_mbps, active_users, sampled_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [companyId, totalUpload.toFixed(2), totalDownload.toFixed(2), onlineCount]
    );
  } catch (err) {
    // Table might not exist yet — non-critical
    if (!err.message.includes('does not exist')) {
      console.warn(`[BW-MONITOR] Failed to store aggregate: ${err.message}`);
    }
  }

  // Clean old logs (keep 7 days)
  try {
    await pool.query(
      `DELETE FROM bandwidth_usage_log WHERE company_id = $1 AND sampled_at < NOW() - INTERVAL '7 days'`,
      [companyId]
    );
    await pool.query(
      `DELETE FROM bandwidth_aggregate_log WHERE company_id = $1 AND sampled_at < NOW() - INTERVAL '7 days'`,
      [companyId]
    ).catch(() => {});
  } catch {} // non-critical
};

/**
 * Start the background monitor.
 * Default: runs every 2 minutes.
 */
const start = (intervalMs = 120_000) => {
  if (intervalHandle) return;
  console.log(`[BW-MONITOR] Starting bandwidth monitor (interval: ${intervalMs / 1000}s)`);

  // Run first cycle after 10s delay to let server boot
  setTimeout(() => {
    runCycle();
    intervalHandle = setInterval(runCycle, intervalMs);
  }, 10_000);
};

const stop = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log(`[BW-MONITOR] Stopped`);
  }
};

module.exports = { start, stop, runCycle };
