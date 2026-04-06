const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { createPlan, getPlans, updatePlan, deletePlan } = require('../controllers/plansController');

const router = express.Router();

// POST /plans/create
router.post(
  '/create',
  [
    body('name').trim().notEmpty().withMessage('Plan name is required'),
    body('download_speed').trim().notEmpty().withMessage('Download speed is required'),
    body('upload_speed').trim().notEmpty().withMessage('Upload speed is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('description').optional().trim(),
  ],
  validate,
  createPlan
);

// GET /plans
router.get('/', getPlans);

// PUT /plans/:id
router.put('/:id', updatePlan);

// DELETE /plans/:id
router.delete('/:id', deletePlan);

module.exports = router;
