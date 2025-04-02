const express = require('express');
const router = express.Router();
const { 
  getAlerts, 
  getAlertById, 
  createAlert 
} = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

// Rutas protegidas
router.get('/', protect, getAlerts);
router.get('/:id', protect, getAlertById);
router.post('/', protect, createAlert);

module.exports = router;
