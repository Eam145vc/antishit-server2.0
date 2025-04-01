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

module.exports = router;
