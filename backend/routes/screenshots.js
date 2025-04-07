const express = require('express');
const router = express.Router();
const { 
  saveScreenshot, 
  requestScreenshot,
  getScreenshots,
  getScreenshotById,
  addNoteToScreenshot,
  getPlayerScreenshots,
  getScreenshotImage
} = require('../controllers/screenshotController');
const { protect } = require('../middleware/auth');

router.post('/', saveScreenshot);
router.post('/request', protect, requestScreenshot);
router.get('/', protect, getScreenshots);
router.get('/player/:id', protect, getPlayerScreenshots);
router.get('/:id', protect, getScreenshotById);
router.get('/:id/image', protect, getScreenshotImage);
router.put('/:id/notes', protect, addNoteToScreenshot);

// Punto de compatibilidad para la API del cliente que usa la ruta en singular
router.post('/screenshot', saveScreenshot);

module.exports = router;
