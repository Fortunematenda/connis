const mikrotik = require('../services/mikrotik');
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

module.exports = { getStatus, getSessions, getSecrets, getProfilesList, createProfileOnRouter, disconnectUser };
