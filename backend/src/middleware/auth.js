const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ApiError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'connis-saas-jwt-secret-change-in-production';

// Verify JWT token and attach company_id + admin info to req
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify admin still exists and is active
    const admin = await pool.query(
      'SELECT ca.id, ca.company_id, ca.email, ca.full_name, ca.role, c.subscription_status, c.expires_at FROM company_admins ca JOIN companies c ON ca.company_id = c.id WHERE ca.id = $1 AND ca.active = TRUE',
      [decoded.adminId]
    );

    if (admin.rows.length === 0) {
      throw new ApiError(401, 'Account not found or disabled');
    }

    req.admin = admin.rows[0];
    req.companyId = admin.rows[0].company_id;
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

// ── Subscription helpers ──────────────────────────────────

// Returns true if the company subscription is expired or cancelled
const isSubscriptionInactive = (admin) => {
  const { subscription_status, expires_at } = admin;
  if (subscription_status === 'cancelled' || subscription_status === 'expired') return true;
  if (expires_at && new Date(expires_at) < new Date()) return true;
  return false;
};

// Standard 403 response for expired subscriptions — stops execution immediately
const sendSubscriptionExpired = (req, res) => {
  console.log(`[SUBSCRIPTION] Blocked ${req.method} ${req.originalUrl} — admin ${req.admin.id} (company ${req.companyId})`);
  return res.status(403).json({
    success: false,
    error: 'SUBSCRIPTION_EXPIRED',
    message: 'Your subscription has expired. Please renew to continue.',
  });
};

// Check subscription is active (use after authenticate)
// Only blocks mutative requests (POST/PUT/DELETE/PATCH) — GET requests pass through
// so users can still VIEW their data when subscription is expired
const requireActiveSubscription = (req, res, next) => {
  const readOnly = req.method === 'GET' || req.method === 'HEAD';
  if (readOnly) return next();

  if (isSubscriptionInactive(req.admin)) {
    return sendSubscriptionExpired(req, res);
  }

  next();
};

// Strict subscription check — blocks ALL methods including GET
// Use for routes that trigger heavy external calls (MikroTik, bandwidth)
const requireActiveSubscriptionStrict = (req, res, next) => {
  if (isSubscriptionInactive(req.admin)) {
    return sendSubscriptionExpired(req, res);
  }
  next();
};

// Generate JWT token
const generateToken = (adminId, companyId) => {
  return jwt.sign(
    { adminId, companyId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { authenticate, requireActiveSubscription, requireActiveSubscriptionStrict, generateToken };
