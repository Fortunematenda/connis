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

// ── Empty cache entry ────────────────────────────────────────
const emptyEntry = () => ({
  sessions: [],
  sessionMap: new Map(),
  routerOnline: false,
  lastUpdate: 0,
  lastSuccess: 0,
  refreshing: false,
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
  const sessions = [];
  let routerOnline = false;
  let fetchSuccess = false;

  // Support both single routerConfig and array of configs
  const configs = Array.isArray(routerConfig) ? routerConfig : (routerConfig ? [routerConfig] : []);

  // Source 1: MikroTik active PPP sessions from ALL routers
  const seenUsernames = new Set();
  for (const cfg of configs) {
    try {
      const raw = await getActiveSessions(cfg);
      routerOnline = true;
      fetchSuccess = true;
      for (const s of raw) {
        if (seenUsernames.has(s.name)) continue; // avoid duplicates
        seenUsernames.add(s.name);
        sessions.push({
          username: s.name,
          ip: s.address || '',
          uptime: s.uptime || '',
          callerId: s['caller-id'] || '',
          service: s.service || '',
          source: 'mikrotik',
          router: cfg.name || cfg.host,
        });
      }
    } catch (err) {
      console.warn(`[SESSION-CACHE] MikroTik fetch failed for ${cfg.name || cfg.host}: ${err.message}`);
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

  const now = Date.now();
  const entry = {
    sessions,
    sessionMap,
    routerOnline,
    lastUpdate: now,
    lastSuccess: fetchSuccess ? now : (existing?.lastSuccess || 0),
    refreshing: false,
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
