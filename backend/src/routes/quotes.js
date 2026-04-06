const express = require('express');
const { getQuotes, getQuoteById, createQuote, updateQuoteStatus, convertToInvoice, deleteQuote } = require('../controllers/quotesController');

const router = express.Router();

router.get('/', getQuotes);
router.get('/:id', getQuoteById);
router.post('/', createQuote);
router.put('/:id/status', updateQuoteStatus);
router.post('/:id/convert', convertToInvoice);
router.delete('/:id', deleteQuote);

module.exports = router;
