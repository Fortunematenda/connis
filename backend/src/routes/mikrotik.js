const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getStatus, getSessions, getSecrets,
  getProfilesList, createProfileOnRouter, disconnectUser, syncCustomersFromRouter,
} = require('../controllers/mikrotikController');

const router = express.Router();

// GET /mikrotik/status — Router connection test + system info
router.get('/status', getStatus);

// GET /mikrotik/sessions — Active PPPoE connections
router.get('/sessions', getSessions);

// GET /mikrotik/secrets — All PPPoE secrets
router.get('/secrets', getSecrets);

// GET /mikrotik/profiles — All PPPoE profiles
router.get('/profiles', getProfilesList);

// POST /mikrotik/profiles — Create a PPPoE profile on the router
router.post(
  '/profiles',
  [
    body('name').trim().notEmpty().withMessage('Profile name is required'),
    body('rateLimit').trim().notEmpty().withMessage('Rate limit is required (e.g. "10M/5M")'),
  ],
  validate,
  createProfileOnRouter
);

// POST /mikrotik/disconnect/:username — Kick an active session
router.post('/disconnect/:username', disconnectUser);

// POST /mikrotik/sync-customers — Import PPPoE secrets from router as customers
router.post('/sync-customers', syncCustomersFromRouter);

module.exports = router;
