// controllers/screenshotController.js
const Screenshot = require('../models/Screenshot');
const Player = require('../models/Player');
const { emitAlert } = require('../utils/socket');

// Global cache for pending screenshot requests
if (!global.screenshotRequests) {
  global.screenshotRequests = {};
}

// @desc    Save new screenshot
// @route   POST /api/screenshots
// @access  Public (from anti-cheat client)
const saveScreenshot = async (req, res) => {
  try {
    const { activisionId, channelId, screenshot, timestamp } = req.body;
    
    // Verify required fields
    if (!activisionId || !channelId || !screenshot) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Log for debugging
    console.log(`[SCREENSHOT] Receiving screenshot for ${activisionId} in channel ${channelId}`);
    
    // Find or create player
    let player = await Player.findOne({ activisionId });
    
    if (!player) {
      // If player doesn't exist, create them
      player = await Player.create({
        activisionId,
        currentChannelId: channelId,
        isOnline: true,
        lastSeen: new Date()
      });
    } else {
      // Update player fields
      player.lastSeen = new Date();
      player.currentChannelId = channelId;
      await player.save();
    }
    
    // Normalize and verify image data
    let imageData = screenshot;
    
    // If it doesn't have base64 prefix, add it
    if (!imageData.startsWith('data:image')) {
      imageData = `data:image/png;base64,${imageData}`;
    }
    
    // Save screenshot
    const newScreenshot = await Screenshot.create({
      player: player._id,
      activisionId,
      channelId,
      imageData: imageData,
      capturedAt: timestamp || new Date()
    });
    
    // Emit event for new screenshot
    global.io?.to(`channel:${channelId}`).emit('new-screenshot', {
      id: newScreenshot._id,
      activisionId,
      channelId,
      timestamp: newScreenshot.capturedAt
    });
    
    // Emit alert
    emitAlert({
      type: 'screenshot-taken',
      playerId: player._id,
      activisionId,
      channelId,
      message: `New screenshot from ${activisionId}`,
      severity: 'info',
      timestamp: newScreenshot.capturedAt
    });
    
    console.log(`[SCREENSHOT] Successfully saved screenshot with ID: ${newScreenshot._id}`);
    
    res.status(201).json({
      success: true,
      id: newScreenshot._id
    });
  } catch (error) {
    console.error('Error saving screenshot:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if there are pending screenshot requests
// @route   GET /api/screenshots/check-requests
// @access  Public (from anti-cheat client)
const checkScreenshotRequests = async (req, res) => {
  try {
    const { activisionId, channelId } = req.query;
    
    if (!activisionId || !channelId) {
      return res.status(400).json({ hasRequest: false, message: 'Incomplete parameters' });
    }
    
    console.log(`[SCREENSHOT] Client checking for requests: ${activisionId} in channel ${channelId}`);
    
    // Check in global cache if there's a pending request for this player
    const key = `${activisionId}-${channelId}`;
    const hasRequest = !!global.screenshotRequests[key];
    
    // If there is a request, remove it so it won't be processed again
    if (hasRequest) {
      console.log(`[SCREENSHOT] Pending request found for ${activisionId} in channel ${channelId}`);
      delete global.screenshotRequests[key];
    } else {
      console.log(`[SCREENSHOT] No pending requests for ${activisionId} in channel ${channelId}`);
    }
    
    res.json({ hasRequest });
  } catch (error) {
    console.error('Error checking screenshot requests:', error);
    res.status(500).json({ hasRequest: false, message: error.message });
  }
};

// @desc    Request remote screenshot
// @route   POST /api/screenshots/request
// @access  Private
const requestScreenshot = async (req, res) => {
  try {
    const { activisionId, channelId } = req.body;
    
    // Verify required fields
    if (!activisionId || !channelId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find player
    const player = await Player.findOne({ activisionId });
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Store the request in memory for the client to pick up
    if (!global.screenshotRequests) {
      global.screenshotRequests = {};
    }
    
    const key = `${activisionId}-${channelId}`;
    global.screenshotRequests[key] = {
      timestamp: new Date(),
      requestedBy: req.user?.name || 'Unknown'
    };
    
    console.log(`[SCREENSHOT] New request stored for ${activisionId} in channel ${channelId} by ${req.user?.name || 'Unknown'}`);
    
    // Emit screenshot request through socket.io
    global.io?.to(`channel:${channelId}`).emit('take-screenshot', {
      activisionId,
      requestedBy: req.user?.name || 'Unknown',
      timestamp: new Date()
    });
    
    // Emit alert for screenshot request
    emitAlert({
      type: 'screenshot-request',
      playerId: player._id,
      activisionId,
      channelId,
      message: `Screenshot requested for ${activisionId}`,
      severity: 'info',
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Screenshot request sent'
    });
  } catch (error) {
    console.error('Error requesting screenshot:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all screenshots
// @route   GET /api/screenshots
// @access  Private
const getScreenshots = async (req, res) => {
  try {
    const { limit = 20, activisionId, channelId } = req.query;
    
    // Build filter based on parameters
    const filter = {};
    
    if (activisionId) {
      filter.activisionId = activisionId;
    }
    
    if (channelId) {
      filter.channelId = parseInt(channelId);
    }
    
    // Get screenshots with pagination
    const screenshots = await Screenshot.find(filter)
      .sort({ capturedAt: -1 })
      .limit(parseInt(limit))
      .select('-imageData') // Exclude large binary data
      .populate('player', 'activisionId');
    
    res.json(screenshots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a screenshot by ID
// @route   GET /api/screenshots/:id
// @access  Private
const getScreenshotById = async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id)
      .populate('player', 'activisionId currentChannelId')
      .populate('requestedBy', 'name');
    
    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found' });
    }
    
    res.json(screenshot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get image of a screenshot
// @route   GET /api/screenshots/:id/image
// @access  Private
const getScreenshotImage = async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id);
    
    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found' });
    }
    
    // Ensure the image has the correct prefix
    const imageData = screenshot.imageData.startsWith('data:image')
      ? screenshot.imageData
      : `data:image/png;base64,${screenshot.imageData}`;
    
    res.json({ imageData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add note to a screenshot
// @route   PUT /api/screenshots/:id/notes
// @access  Private
const addNoteToScreenshot = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const screenshot = await Screenshot.findById(req.params.id);
    
    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found' });
    }
    
    screenshot.notes = notes;
    await screenshot.save();
    
    res.json(screenshot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get player screenshots
// @route   GET /api/screenshots/player/:id
// @access  Private
const getPlayerScreenshots = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Find player
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Get screenshots
    const screenshots = await Screenshot.find({ player: player._id })
      .sort({ capturedAt: -1 })
      .limit(parseInt(limit))
      .select('-imageData'); // Exclude large binary data
    
    res.json(screenshots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export all functions
module.exports = {
  saveScreenshot,
  requestScreenshot,
  getScreenshots,
  getScreenshotById,
  addNoteToScreenshot,
  getPlayerScreenshots,
  getScreenshotImage,
  checkScreenshotRequests
};
