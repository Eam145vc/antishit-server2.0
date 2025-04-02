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

// Rutas públicas (desde cliente anti-cheat)
router.post('/', saveMonitorData); // Asegúrate de pasar la función correctamente
router.post('/game-status', updateGameStatus);
router.post('/error', reportClientError);

// Rutas protegidas (requieren autenticación)
router.put('/disconnect', protect, markPlayerDisconnected);
router.get('/stats', protect, getMonitoringStats);
router.get('/:id', protect, getMonitorDataById);

module.exports = router;
