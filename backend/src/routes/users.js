const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { createUser, getUsers, getUserById, getUsersStatus } = require('../controllers/usersController');

const router = express.Router();

// POST /users/create — Validation rules + handler
router.post(
  '/create',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().trim(),
    body('full_name').optional().trim(),
    body('address').optional().trim(),
  ],
  validate,
  createUser
);

// GET /users/status — Live status merged with MikroTik (must be before /:id)
router.get('/status', getUsersStatus);

// GET /users
router.get('/', getUsers);

// GET /users/:id
router.get('/:id', getUserById);

module.exports = router;
