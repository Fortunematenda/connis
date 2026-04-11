const pool = require('../config/db');
const { decrypt } = require('../utils/encryption');

// Resolve the default router config for a company from the database
// Returns { host, user, password, port, authType } for the MikroTik service
const getRouterConfigForCompany = async (companyId) => {
  if (!companyId) return null; // Fall back to .env defaults

  const result = await pool.query(
    `SELECT ip_address, username, password_enc, port, auth_type
     FROM routers
     WHERE company_id = $1 AND is_default = TRUE AND active = TRUE
     LIMIT 1`,
    [companyId]
  );

  if (result.rows.length === 0) {
    // Try any active router for the company
    const fallback = await pool.query(
      `SELECT ip_address, username, password_enc, port, auth_type
       FROM routers
       WHERE company_id = $1 AND active = TRUE
       ORDER BY created_at ASC LIMIT 1`,
      [companyId]
    );
    if (fallback.rows.length === 0) return null;
    const r = fallback.rows[0];
    return { host: r.ip_address, user: r.username, password: decrypt(r.password_enc), port: r.port, authType: r.auth_type || 'radius' };
  }

  const r = result.rows[0];
  return { host: r.ip_address, user: r.username, password: decrypt(r.password_enc), port: r.port, authType: r.auth_type || 'radius' };
};

// Get ALL active router configs for a company (for multi-router support)
const getAllRouterConfigsForCompany = async (companyId) => {
  if (!companyId) return [];

  const result = await pool.query(
    `SELECT ip_address, username, password_enc, port, auth_type, name, is_default
     FROM routers
     WHERE company_id = $1 AND active = TRUE
     ORDER BY is_default DESC, created_at ASC`,
    [companyId]
  );

  return result.rows.map(r => ({
    host: r.ip_address,
    user: r.username,
    password: decrypt(r.password_enc),
    port: r.port,
    authType: r.auth_type || 'radius',
    name: r.name,
    isDefault: r.is_default,
  }));
};

module.exports = { getRouterConfigForCompany, getAllRouterConfigsForCompany };
