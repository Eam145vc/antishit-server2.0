const express = require('express');
const router = express.Router();
const { 
  getPlayers, 
  getPlayerById, 
  getPlayerByActivisionId,
  getPlayersByChannel,
  updatePlayerChannel,
  getPlayerHistory,
  getPlayerDevices,
  markPlayerAsSuspicious,
  detectDuplicateHWIDs
} = require('../controllers/playerController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getPlayers);
router.get('/channel/:channelId', protect, getPlayersByChannel);
router.get('/activision/:activisionId', protect, getPlayerByActivisionId);
router.get('/detect-duplicates', protect, detectDuplicateHWIDs);
router.get('/:id', protect, getPlayerById);
router.get('/:id/history', protect, getPlayerHistory);
router.get('/:id/devices', protect, getPlayerDevices);
router.put('/:id/channel', protect, updatePlayerChannel);
router.put('/:id/suspect', protect, markPlayerAsSuspicious);

module.exports = router;
