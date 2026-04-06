const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateCustomer } = require('../middleware/customerAuth');
const {
  customerLogin, getMe, getTransactions, redeemVoucher,
  getTickets, createTicket, getTicketById, addTicketComment, getStatistics,
} = require('../controllers/portalController');
const { getCustomerMessages, sendCustomerMessage, getCustomerUnreadCount } = require('../controllers/messagesController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/chat'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|heic|heif|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1]);
    cb(null, ext || mime);
  },
});

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
router.post('/upload', authenticateCustomer, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
  const url = `/api/uploads/chat/${req.file.filename}`;
  res.json({ success: true, data: { url, filename: req.file.originalname } });
});

module.exports = router;
