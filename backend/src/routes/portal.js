const express = require('express');
const { authenticateCustomer } = require('../middleware/customerAuth');
const {
  customerLogin, getMe, getTransactions, redeemVoucher,
  getTickets, createTicket, getTicketById, addTicketComment, getStatistics,
} = require('../controllers/portalController');
const { getCustomerMessages, sendCustomerMessage, getCustomerUnreadCount } = require('../controllers/messagesController');

const router = express.Router();

// Public — customer login
router.post('/login', customerLogin);

// Protected — customer must be authenticated
router.get('/me', authenticateCustomer, getMe);
router.get('/transactions', authenticateCustomer, getTransactions);
router.post('/redeem', authenticateCustomer, redeemVoucher);
router.get('/statistics', authenticateCustomer, getStatistics);
router.get('/tickets', authenticateCustomer, getTickets);
router.post('/tickets', authenticateCustomer, createTicket);
router.get('/tickets/:id', authenticateCustomer, getTicketById);
router.post('/tickets/:id/comments', authenticateCustomer, addTicketComment);
router.get('/messages', authenticateCustomer, getCustomerMessages);
router.post('/messages', authenticateCustomer, sendCustomerMessage);
router.get('/messages/unread-count', authenticateCustomer, getCustomerUnreadCount);

module.exports = router;
