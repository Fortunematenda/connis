const express = require('express');
const {
  getLiveUsage, getFlaggedUsers, throttleUser, unthrottleUser,
  getUserHistory, getSettings, updateSettings, getTopUploaders,
} = require('../controllers/bandwidthController');

const router = express.Router();

router.get('/live', getLiveUsage);
router.get('/flagged', getFlaggedUsers);
router.get('/top-uploaders', getTopUploaders);
router.get('/history/:userId', getUserHistory);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/throttle/:userId', throttleUser);
router.post('/unthrottle/:userId', unthrottleUser);

module.exports = router;
