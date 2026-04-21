const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { addRouter, getRouters, updateRouter, deleteRouter, testRouterConnection } = require('../controllers/routersController');

const router = express.Router();

// POST /routers — Add a new router
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Router name is required'),
    body('ip_address').trim().notEmpty().withMessage('IP address is required'),
    body('username').optional().trim(),
    body('password').notEmpty().withMessage('Router password is required'),
    body('port').optional().isInt({ min: 1, max: 65535 }).withMessage('Port must be 1-65535'),
    body('is_default').optional().isBoolean(),
  ],
  validate,
  addRouter
);

// GET /routers — List company routers
router.get('/', getRouters);

// PUT /routers/:id — Update a router
router.put(
  '/:id',
  [
    body('name').optional().trim(),
    body('ip_address').optional().trim(),
    body('username').optional().trim(),
    body('password').optional(),
    body('port').optional().isInt({ min: 1, max: 65535 }),
    body('is_default').optional().isBoolean(),
  ],
  validate,
  updateRouter
);

// DELETE /routers/:id — Delete a router
router.delete('/:id', deleteRouter);

// GET /routers/:id/test — Test router connection (shows online/offline status)
router.get('/:id/test', testRouterConnection);

module.exports = router;
