const express = require('express');
const { getInvoices, getUserInvoices, getInvoiceById, createManualInvoice, updateInvoiceStatus } = require('../controllers/invoicesController');

const router = express.Router();

router.get('/', getInvoices);
router.get('/user/:userId', getUserInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createManualInvoice);
router.put('/:id/status', updateInvoiceStatus);

module.exports = router;
