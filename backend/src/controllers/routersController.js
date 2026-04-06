const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { encrypt, decrypt } = require('../utils/encryption');
const { createMikroTikClient } = require('../services/mikrotik');

// POST /routers — Add a new router for the company
const addRouter = async (req, res, next) => {
  try {
    const { name, ip_address, username, password, port, auth_type, is_default } = req.body;
    const companyId = req.companyId;

    // If setting as default, unset other defaults first
    if (is_default) {
      await pool.query(
        'UPDATE routers SET is_default = FALSE WHERE company_id = $1',
        [companyId]
      );
    }

    // Encrypt the router password before storing
    const passwordEnc = encrypt(password);

    const result = await pool.query(
      `INSERT INTO routers (company_id, name, ip_address, username, password_enc, port, auth_type, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, company_id, name, ip_address, username, port, auth_type, is_default, active, created_at`,
      [companyId, name, ip_address, username || 'admin', passwordEnc, port || 8728, auth_type || 'radius', is_default || false]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /routers — List all routers for the company
const getRouters = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, company_id, name, ip_address, username, port, auth_type, is_default, active, created_at
       FROM routers WHERE company_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [req.companyId]
    );

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// PUT /routers/:id — Update a router
const updateRouter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, ip_address, username, password, port, auth_type, is_default } = req.body;
    const companyId = req.companyId;

    // Verify router belongs to company
    const existing = await pool.query(
      'SELECT id FROM routers WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    if (existing.rows.length === 0) {
      throw new ApiError(404, 'Router not found');
    }

    if (is_default) {
      await pool.query(
        'UPDATE routers SET is_default = FALSE WHERE company_id = $1',
        [companyId]
      );
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    let idx = 1;

    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (ip_address) { fields.push(`ip_address = $${idx++}`); values.push(ip_address); }
    if (username) { fields.push(`username = $${idx++}`); values.push(username); }
    if (password) { fields.push(`password_enc = $${idx++}`); values.push(encrypt(password)); }
    if (port) { fields.push(`port = $${idx++}`); values.push(port); }
    if (auth_type) { fields.push(`auth_type = $${idx++}`); values.push(auth_type); }
    if (is_default !== undefined) { fields.push(`is_default = $${idx++}`); values.push(is_default); }
    fields.push(`updated_at = NOW()`);

    values.push(id);
    values.push(companyId);

    const result = await pool.query(
      `UPDATE routers SET ${fields.join(', ')} WHERE id = $${idx++} AND company_id = $${idx}
       RETURNING id, company_id, name, ip_address, username, port, auth_type, is_default, active, updated_at`,
      values
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /routers/:id — Remove a router
const deleteRouter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM routers WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, req.companyId]
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Router not found');
    }
    res.json({ success: true, message: 'Router deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /routers/:id/test — Test connection to a router
const testRouterConnection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM routers WHERE id = $1 AND company_id = $2',
      [id, req.companyId]
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Router not found');
    }

    const router = result.rows[0];
    const routerPassword = decrypt(router.password_enc);

    const client = createMikroTikClient({
      host: router.ip_address,
      user: router.username,
      password: routerPassword,
      port: router.port,
    });

    try {
      await client.connect();
      await client.login();
      const identity = await client.talk(['/system/identity/print']);
      const resources = await client.talk(['/system/resource/print']);
      client.close();

      res.json({
        success: true,
        data: {
          connected: true,
          identity: identity[0]?.name || 'Unknown',
          version: resources[0]?.version || 'Unknown',
          uptime: resources[0]?.uptime || 'Unknown',
          cpu: resources[0]?.['cpu-load'] || 'Unknown',
        },
      });
    } catch (mkErr) {
      client.close();
      res.json({
        success: true,
        data: { connected: false, error: mkErr.message },
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { addRouter, getRouters, updateRouter, deleteRouter, testRouterConnection };
