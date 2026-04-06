const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { generateToken } = require('../middleware/auth');

// POST /auth/register — Register a new ISP company + owner admin
const register = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { company_name, email, password, full_name, phone, address } = req.body;

    await client.query('BEGIN');

    // Check if email already exists
    const existing = await client.query(
      'SELECT id FROM company_admins WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // Create company
    const companyResult = await client.query(
      `INSERT INTO companies (name, email, phone, address, subscription_status, subscription_plan)
       VALUES ($1, $2, $3, $4, 'active', 'trial')
       RETURNING *`,
      [company_name, email, phone || null, address || null]
    );
    const company = companyResult.rows[0];

    // Hash password and create admin
    const passwordHash = await bcrypt.hash(password, 12);
    const adminResult = await client.query(
      `INSERT INTO company_admins (company_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'owner')
       RETURNING id, company_id, email, full_name, role, created_at`,
      [company.id, email, passwordHash, full_name || company_name]
    );
    const admin = adminResult.rows[0];

    await client.query('COMMIT');

    const token = generateToken(admin.id, company.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role },
        company: { id: company.id, name: company.name, subscription_status: company.subscription_status, subscription_plan: company.subscription_plan, expires_at: company.expires_at },
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /auth/login — Login and receive JWT token
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT ca.id, ca.company_id, ca.email, ca.password_hash, ca.full_name, ca.role, ca.active,
              c.name AS company_name, c.subscription_status, c.subscription_plan, c.expires_at
       FROM company_admins ca
       JOIN companies c ON ca.company_id = c.id
       WHERE ca.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const admin = result.rows[0];

    if (!admin.active) {
      throw new ApiError(403, 'Your account has been disabled');
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(admin.id, admin.company_id);

    res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role },
        company: { id: admin.company_id, name: admin.company_name, subscription_status: admin.subscription_status, subscription_plan: admin.subscription_plan, expires_at: admin.expires_at },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /auth/me — Get current admin + company info
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ca.id, ca.email, ca.full_name, ca.role,
              c.id AS company_id, c.name AS company_name, c.email AS company_email,
              c.phone AS company_phone, c.address AS company_address, c.bank_details,
              c.subscription_status, c.subscription_plan, c.expires_at
       FROM company_admins ca
       JOIN companies c ON ca.company_id = c.id
       WHERE ca.id = $1`,
      [req.admin.id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /auth/company — Update company settings (bank details, etc.)
const updateCompanySettings = async (req, res, next) => {
  try {
    const { name, email, phone, address, bank_details } = req.body;
    const result = await pool.query(
      `UPDATE companies SET name = $1, email = $2, phone = $3, address = $4, bank_details = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, email, phone, address, bank_details || null, req.admin.company_id]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Company not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, updateCompanySettings };
