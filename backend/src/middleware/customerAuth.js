const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ApiError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'connis-saas-jwt-secret-change-in-production';

// Generate JWT for customer (different payload than admin)
const generateCustomerToken = (userId, companyId) => {
  return jwt.sign(
    { userId, companyId, role: 'customer' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Verify customer JWT — attach user + company to req
const authenticateCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'customer') {
      throw new ApiError(401, 'Invalid customer token');
    }

    // Verify user still exists and is active
    const userRes = await pool.query(
      `SELECT u.id, u.company_id, u.username, u.full_name, u.email, u.phone,
              u.address, u.balance, u.active, u.seq_id
       FROM users u
       WHERE u.id = $1 AND u.company_id = $2`,
      [decoded.userId, decoded.companyId]
    );

    if (userRes.rows.length === 0) {
      throw new ApiError(401, 'Account not found');
    }

    req.customer = userRes.rows[0];
    req.companyId = decoded.companyId;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'));
    }
    next(err);
  }
};

module.exports = { generateCustomerToken, authenticateCustomer };
