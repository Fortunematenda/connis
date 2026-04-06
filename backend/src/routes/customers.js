const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { getCustomers, getCustomerById, updateCustomer, deleteCustomer, changeCustomerPlan, cancelPendingPlan } = require('../controllers/customersController');
const { getCustomerStatistics, getLiveBandwidth } = require('../controllers/statisticsController');

const router = express.Router();

// GET /customers — List all customers with plan info
router.get('/', getCustomers);

// GET /customers/:id — Single customer detail
router.get('/:id', getCustomerById);

// PUT /customers/:id — Update customer info / PPPoE / status
router.put(
  '/:id',
  [
    body('full_name').optional().trim(),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('username').optional().trim(),
    body('active').optional().isBoolean().withMessage('Active must be true or false'),
  ],
  validate,
  updateCustomer
);

// PUT /customers/:id/plan — Change service plan
router.put(
  '/:id/plan',
  [
    body('plan_id').trim().notEmpty().withMessage('Plan ID is required'),
  ],
  validate,
  changeCustomerPlan
);

// DELETE /customers/:id/plan/pending — Cancel pending plan change
router.delete('/:id/plan/pending', cancelPendingPlan);

// DELETE /customers/:id — Delete customer
router.delete('/:id', deleteCustomer);

// GET /customers/:id/statistics — RADIUS accounting statistics
router.get('/:id/statistics', getCustomerStatistics);

// GET /customers/:id/bandwidth — Live bandwidth from MikroTik
router.get('/:id/bandwidth', getLiveBandwidth);

module.exports = router;
