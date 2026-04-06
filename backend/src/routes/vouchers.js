const express = require('express');
const { generateVouchers, getVouchers, deleteVoucher, redeemVoucher } = require('../controllers/vouchersController');

const router = express.Router();

router.get('/', getVouchers);
router.post('/generate', generateVouchers);
router.post('/redeem', redeemVoucher);
router.delete('/:id', deleteVoucher);

module.exports = router;
