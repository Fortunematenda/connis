const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { getStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');

const router = express.Router();

// GET /staff — List all staff
router.get('/', getStaff);

// POST /staff — Create a new staff member
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').optional().trim(),
    body('role').trim().notEmpty().withMessage('Role is required'),
  ],
  validate,
  createStaff
);

// PUT /staff/:id — Update a staff member
router.put(
  '/:id',
  [
    body('full_name').optional().trim(),
    body('phone').optional().trim(),
    body('role').optional().trim(),
    body('active').optional().isBoolean(),
    body('password').optional().isLength({ min: 6 }),
  ],
  validate,
  updateStaff
);

// DELETE /staff/:id — Remove a staff member
router.delete('/:id', deleteStaff);

module.exports = router;
