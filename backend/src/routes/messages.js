const express = require('express');
const { getConversations, getMessages, sendMessage, getUnreadMessageCount } = require('../controllers/messagesController');

const router = express.Router();

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadMessageCount);
router.get('/:userId', getMessages);
router.post('/:userId', sendMessage);

module.exports = router;
