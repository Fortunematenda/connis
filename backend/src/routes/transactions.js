const express = require('express');
const { getTransactions, getUserTransactions, getBalance, addCredit, addDebit } = require('../controllers/transactionsController');

const router = express.Router();

router.get('/', getTransactions);
router.get('/user/:userId', getUserTransactions);
router.get('/balance/:userId', getBalance);
router.post('/credit', addCredit);
router.post('/debit', addDebit);

module.exports = router;
