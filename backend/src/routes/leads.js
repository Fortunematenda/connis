const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { createLead, getLeads, updateLeadStatus, getLeadById, addComment, getComments, convertLead } = require('../controllers/leadsController');

const router = express.Router();

// POST /leads/create — Add a new lead to the pipeline
router.post(
  '/create',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').optional().trim(),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('address').optional().trim(),
    body('notes').optional().trim(),
  ],
  validate,
  createLead
);

// GET /leads — Fetch all leads (optional ?status=new filter)
router.get('/', getLeads);

// GET /leads/:id — Get single lead
router.get('/:id', getLeadById);

// PUT /leads/:id/status — Update lead pipeline stage
router.put(
  '/:id/status',
  [
    body('status').trim().notEmpty().withMessage('Status is required'),
  ],
  validate,
  updateLeadStatus
);

// POST /leads/:id/comments — Add a comment to a lead
router.post(
  '/:id/comments',
  [
    body('content').trim().notEmpty().withMessage('Comment content is required'),
    body('author').optional().trim(),
  ],
  validate,
  addComment
);

// GET /leads/:id/comments — Get all comments for a lead
router.get('/:id/comments', getComments);

// POST /leads/:id/convert — Convert lead into a customer (Splynx-style)
router.post(
  '/:id/convert',
  [
    body('username').trim().notEmpty().withMessage('PPPoE username is required'),
    body('password').isLength({ min: 6 }).withMessage('PPPoE password must be at least 6 characters'),
    body('plan_id').trim().notEmpty().withMessage('A service plan must be selected'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email format'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
  ],
  validate,
  convertLead
);

module.exports = router;
