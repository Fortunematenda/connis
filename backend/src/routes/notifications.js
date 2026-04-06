const express = require('express');
const { getNotifications, getUnreadCount, markRead, markAllRead } = require('../controllers/notificationsController');

const router = express.Router();

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

module.exports = router;
