const express = require('express');
const router = express.Router();
const { 
  getDevices, 
  getDeviceById,
  getSuspiciousDevices,
  getDeviceConnectionHistory,
  updateDeviceTrustLevel,
  getAllMonitors,
  getDevicesByType
} = require('../controllers/deviceController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDevices);
router.get('/suspicious', protect, getSuspiciousDevices);
router.get('/monitors', protect, getAllMonitors);
router.get('/by-type/:type', protect, getDevicesByType);
router.get('/:id', protect, getDeviceById);
router.get('/:id/history', protect, getDeviceConnectionHistory);
router.put('/:id/trust-level', protect, updateDeviceTrustLevel);

module.exports = router;
