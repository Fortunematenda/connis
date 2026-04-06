const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

const VALID_ROLES = ['admin', 'support', 'accounts', 'technician'];

// GET /staff — List all staff for the company
const getStaff = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, phone, role, active, created_at, updated_at
       FROM company_admins
       WHERE company_id = $1
       ORDER BY
         CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'support' THEN 2 WHEN 'accounts' THEN 3 WHEN 'technician' THEN 4 END,
         created_at ASC`,
      [req.companyId]
    );

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// POST /staff — Invite / create a new staff member
const createStaff = async (req, res, next) => {
  try {
    const { email, password, full_name, phone, role } = req.body;
    const companyId = req.companyId;

    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    // Check duplicate email
    const existing = await pool.query('SELECT id FROM company_admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, 'A staff member with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO company_admins (company_id, email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, phone, role, active, created_at`,
      [companyId, email, passwordHash, full_name, phone || null, role]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /staff/:id — Update a staff member
const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, active, password } = req.body;

    // Verify staff belongs to company
    const existing = await pool.query(
      'SELECT id, role FROM company_admins WHERE id = $1 AND company_id = $2',
      [id, req.companyId]
    );
    if (existing.rows.length === 0) {
      throw new ApiError(404, 'Staff member not found');
    }

    // Cannot change the owner's role
    if (existing.rows[0].role === 'owner' && role && role !== 'owner') {
      throw new ApiError(403, 'Cannot change the owner\'s role');
    }

    if (role && role !== 'owner' && !VALID_ROLES.includes(role)) {
      throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    let idx = 1;

    if (full_name !== undefined) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (role && existing.rows[0].role !== 'owner') { fields.push(`role = $${idx++}`); values.push(role); }
    if (active !== undefined) {
      // Cannot deactivate yourself or the owner
      if (existing.rows[0].role === 'owner') {
        throw new ApiError(403, 'Cannot deactivate the company owner');
      }
      if (id === req.admin.id) {
        throw new ApiError(403, 'Cannot deactivate your own account');
      }
      fields.push(`active = $${idx++}`);
      values.push(active);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      fields.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    if (fields.length === 0) {
      throw new ApiError(400, 'No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(id);
    values.push(req.companyId);

    const result = await pool.query(
      `UPDATE company_admins SET ${fields.join(', ')}
       WHERE id = $${idx++} AND company_id = $${idx}
       RETURNING id, email, full_name, phone, role, active, updated_at`,
      values
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /staff/:id — Remove a staff member (cannot delete owner)
const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify and check role
    const existing = await pool.query(
      'SELECT id, role FROM company_admins WHERE id = $1 AND company_id = $2',
      [id, req.companyId]
    );
    if (existing.rows.length === 0) {
      throw new ApiError(404, 'Staff member not found');
    }
    if (existing.rows[0].role === 'owner') {
      throw new ApiError(403, 'Cannot delete the company owner');
    }
    if (id === req.admin.id) {
      throw new ApiError(403, 'Cannot delete your own account');
    }

    await pool.query(
      'DELETE FROM company_admins WHERE id = $1 AND company_id = $2',
      [id, req.companyId]
    );

    res.json({ success: true, message: 'Staff member removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };
