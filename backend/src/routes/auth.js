const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/authController');

const router = express.Router();

// POST /auth/register — Register new ISP company
router.post(
  '/register',
  [
    body('company_name').trim().notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').optional().trim(),
    body('phone').optional().trim(),
    body('address').optional().trim(),
  ],
  validate,
  register
);

// POST /auth/login — Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// GET /auth/me — Get current user + company info (requires auth)
router.get('/me', authenticate, getMe);

module.exports = router;
