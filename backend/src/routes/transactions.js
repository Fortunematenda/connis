const express = require('express');
const { getTransactions, addCredit, addDebit } = require('../controllers/transactionsController');

const router = express.Router();

router.get('/', getTransactions);
router.post('/credit', addCredit);
router.post('/debit', addDebit);

module.exports = router;
