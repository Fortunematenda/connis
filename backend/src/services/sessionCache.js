/**
 * Session Cache — Splynx-style approach
 * 
 * Caches MikroTik active PPP sessions server-side.
 * Background refresh every 5s. NEVER replaces good data with failed data.
 * Also reads RADIUS accounting (radacct) as backup.
 */
const { getActiveSessions } = require('./mikrotik');
const radiusDb = require('../config/radiusDb');

// ── In-memory cache ──────────────────────────────────────────
const cache = new Map(); // companyId → { sessions, sessionMap, routerOnline, lastUpdate, lastSuccess, refreshing }

const CACHE_TTL = 5000;   // 5s — trigger refresh if older than this
const STALE_TTL = 60000;  // 60s — serve stale data up to 1 minute
const MIKROTIK_RETRY_COOLDOWN = 60000; // 60s — avoid retry storm when router API is unreachable
const FAST_MIKROTIK_TIMEOUT_MS = 4000; // 4s — fail fast, fallback to RADIUS

// ── Empty cache entry ────────────────────────────────────────
const emptyEntry = () => ({
  sessions: [],
  sessionMap: new Map(),
  routerOnline: false,
  lastUpdate: 0,
  lastSuccess: 0,
  refreshing: false,
  mikrotikRetryAfter: 0,
});

// ── Get cached sessions for a company ────────────────────────
const getSessions = async (companyId, routerConfig) => {
  const now = Date.now();
  let entry = cache.get(companyId);

  // No cache at all — blocking first fetch
  if (!entry) {
    return await refreshSessions(companyId, routerConfig);
  }

  // Cache is fresh — return it instantly
  if ((now - entry.lastUpdate) < CACHE_TTL) {
    return entry;
  }

  // Cache is stale but within tolerance — return it, refresh in background
  if ((now - entry.lastSuccess) < STALE_TTL) {
    triggerRefresh(companyId, routerConfig);
    return entry;
  }

  // Cache is very stale — blocking refresh
  return await refreshSessions(companyId, routerConfig);
};

// ── Background refresh (non-blocking) ────────────────────────
const triggerRefresh = (companyId, routerConfig) => {
  const entry = cache.get(companyId);
  if (entry?.refreshing) return; // Already refreshing

  if (entry) entry.refreshing = true;
  refreshSessions(companyId, routerConfig).catch(err => {
    console.warn(`[SESSION-CACHE] Background refresh failed: ${err.message}`);
    // On failure, mark as not refreshing but KEEP old data
    if (entry) entry.refreshing = false;
  });
};

// ── Actual refresh: MikroTik API + RADIUS accounting ─────────
const refreshSessions = async (companyId, routerConfig) => {
  const existing = cache.get(companyId);
  const now = Date.now();
  const sessions = [];
  let routerOnline = false;
  let fetchSuccess = false;
  let mikrotikRetryAfter = existing?.mikrotikRetryAfter || 0;

  // Source 1: MikroTik active PPP sessions (primary)
  if (routerConfig) {
    const inCooldown = existing && existing.mikrotikRetryAfter && now < existing.mikrotikRetryAfter;
    if (!inCooldown) {
      try {
        const fastConfig = { ...routerConfig, timeout: FAST_MIKROTIK_TIMEOUT_MS };
        const raw = await getActiveSessions(fastConfig);
        routerOnline = true;
        fetchSuccess = true;
        mikrotikRetryAfter = 0;
        for (const s of raw) {
          sessions.push({
            username: s.name,
            ip: s.address || '',
            uptime: s.uptime || '',
            callerId: s['caller-id'] || '',
            service: s.service || '',
            source: 'mikrotik',
          });
        }
      } catch (err) {
        const retryAt = now + MIKROTIK_RETRY_COOLDOWN;
        console.warn(`[SESSION-CACHE] MikroTik fetch failed: ${err.message} (retry in ${Math.round(MIKROTIK_RETRY_COOLDOWN / 1000)}s)`);
        mikrotikRetryAfter = retryAt;
        if (existing) existing.mikrotikRetryAfter = retryAt;
      }
    }
  }

  // Source 2: RADIUS accounting (radacct) — backup if MikroTik failed
  if (!fetchSuccess) {
    try {
      const result = await radiusDb.query(
        `SELECT username, framedipaddress, acctstarttime,
                EXTRACT(EPOCH FROM (NOW() - acctstarttime))::INTEGER AS uptime_seconds
         FROM radacct
         WHERE acctstoptime IS NULL
         ORDER BY acctstarttime DESC`
      );
      for (const row of result.rows) {
        if (!sessions.find(s => s.username === row.username)) {
          sessions.push({
            username: row.username,
            ip: row.framedipaddress || '',
            uptime: formatUptime(row.uptime_seconds),
            callerId: '',
            service: 'pppoe',
            source: 'radius-acct',
          });
        }
      }
      if (result.rows.length > 0) {
        routerOnline = true;
        fetchSuccess = true;
      }
    } catch (err) {
      console.warn(`[SESSION-CACHE] RADIUS accounting failed: ${err.message}`);
    }
  }

  // ⚠️ KEY FIX: If fetch failed entirely, KEEP the old cached data
  if (!fetchSuccess && existing && existing.sessions.length > 0) {
    console.warn(`[SESSION-CACHE] Fetch failed — keeping ${existing.sessions.length} cached sessions`);
    existing.refreshing = false;
    return existing;
  }

  // Build session map
  const sessionMap = new Map();
  for (const s of sessions) {
    sessionMap.set(s.username, s);
  }

  const entry = {
    sessions,
    sessionMap,
    routerOnline,
    lastUpdate: now,
    lastSuccess: fetchSuccess ? now : (existing?.lastSuccess || 0),
    refreshing: false,
    mikrotikRetryAfter,
  };

  cache.set(companyId, entry);
  return entry;
};

// ── Helper: seconds → human-readable uptime ──────────────────
const formatUptime = (seconds) => {
  if (!seconds || seconds < 0) return '';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d${h}h${m}m`;
  if (h > 0) return `${h}h${m}m${s}s`;
  return `${m}m${s}s`;
};

// ── Force refresh (for manual refresh button) ────────────────
const forceRefresh = async (companyId, routerConfig) => {
  return await refreshSessions(companyId, routerConfig);
};

// ── Clear cache ──────────────────────────────────────────────
const invalidate = (companyId) => {
  cache.delete(companyId);
};

module.exports = { getSessions, forceRefresh, invalidate };
