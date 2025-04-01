const express = require('express');
const router = express.Router();
const { 
  saveMonitorData, 
  updateGameStatus,
  reportClientError,
  markPlayerDisconnected,
  getMonitoringStats,
  getMonitorDataById
} = require('../controllers/monitorController');
const { protect } = require('../middleware/auth');

router.post('/', saveMonitorData);
router.post('/game-status', updateGameStatus);
router.post('/error', reportClientError);
router.put('/disconnect', protect, markPlayerDisconnected);
router.get('/stats', protect, getMonitoringStats);
router.get('/:id', protect, getMonitorDataById);

module.exports = router;