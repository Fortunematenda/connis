const express = require('express');
const { authenticateCustomer } = require('../middleware/customerAuth');
const { customerLogin, getMe, getTransactions, redeemVoucher } = require('../controllers/portalController');

const router = express.Router();

// Public — customer login
router.post('/login', customerLogin);

// Protected — customer must be authenticated
router.get('/me', authenticateCustomer, getMe);
router.get('/transactions', authenticateCustomer, getTransactions);
router.post('/redeem', authenticateCustomer, redeemVoucher);

module.exports = router;
