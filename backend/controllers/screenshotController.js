// controllers/screenshotController.js
const Screenshot = require('../models/Screenshot');
const Player = require('../models/Player');
const { emitAlert } = require('../utils/socket');

// @desc    Guardar nueva captura de pantalla
// @route   POST /api/screenshots
// @access  Público (desde cliente anti-cheat)
const saveScreenshot = async (req, res) => {
  try {
    const { activisionId, channelId, screenshot, timestamp } = req.body;
    
    // Verificar campos requeridos
    if (!activisionId || !channelId || !screenshot) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    
    // Buscar o crear jugador
    let player = await Player.findOne({ activisionId });
    
    if (!player) {
      // Si no existe el jugador, crearlo
      player = await Player.create({
        activisionId,
        currentChannelId: channelId,
        isOnline: true,
        lastSeen: new Date()
      });
    } else {
      // Actualizar campos de jugador
      player.lastSeen = new Date();
      player.currentChannelId = channelId;
      await player.save();
    }
    
    // Guardar captura de pantalla
    const newScreenshot = await Screenshot.create({
      player: player._id,
      activisionId,
      channelId,
      imageData: screenshot,
      capturedAt: timestamp || new Date()
    });
    
    // Emitir evento de nueva captura
    global.io?.to(`channel:${channelId}`).emit('new-screenshot', {
      id: newScreenshot._id,
      activisionId,
      channelId,
      timestamp: newScreenshot.capturedAt
    });
    
    res.status(201).json({
      success: true,
      id: newScreenshot._id
    });
  } catch (error) {
    console.error('Error al guardar screenshot:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Solicitar captura de pantalla remota
// @route   POST /api/screenshots/request
// @access  Privado
const requestScreenshot = async (req, res) => {
  try {
    const { activisionId, channelId } = req.body;
    
    // Verificar campos requeridos
    if (!activisionId || !channelId) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    
    // Buscar jugador
    const player = await Player.findOne({ activisionId });
    
    if (!player) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }
    
    // Emitir solicitud de captura a través de socket.io
    global.io?.to(`channel:${channelId}`).emit('take-screenshot', {
      activisionId,
      requestedBy: req.user.name,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Solicitud de captura enviada'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener últimas capturas de pantalla
// @route   GET /api/screenshots
// @access  Privado
const getScreenshots = async (req, res) => {
  try {
    const { limit = 20, activisionId, channelId } = req.query;
    
    // Construir filtro según parámetros
    const filter = {};
    
    if (activisionId) {
      filter.activisionId = activisionId;
    }
    
    if (channelId) {
      filter.channelId = parseInt(channelId);
    }
    
    // Obtener capturas con paginación
    const screenshots = await Screenshot.find(filter)
      .sort({ capturedAt: -1 })
      .limit(parseInt(limit))
      .select('-imageData') // Excluir datos binarios grandes
      .populate('player', 'activisionId');
    
    res.json(screenshots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener una captura de pantalla por ID
// @route   GET /api/screenshots/:id
// @access  Privado
const getScreenshotById = async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id)
      .populate('player', 'activisionId currentChannelId')
      .populate('requestedBy', 'name');
    
    if (!screenshot) {
      return res.status(404).json({ message: 'Captura no encontrada' });
    }
    
    res.json(screenshot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Agregar nota a una captura de pantalla
// @route   PUT /api/screenshots/:id/notes
// @access  Privado
const addNoteToScreenshot = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const screenshot = await Screenshot.findById(req.params.id);
    
    if (!screenshot) {
      return res.status(404).json({ message: 'Captura no encontrada' });
    }
    
    screenshot.notes = notes;
    await screenshot.save();
    
    res.json(screenshot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener capturas de pantalla de un jugador
// @route   GET /api/screenshots/player/:id
// @access  Privado
const getPlayerScreenshots = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Buscar jugador
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }
    
    // Obtener capturas
    const screenshots = await Screenshot.find({ player: player._id })
      .sort({ capturedAt: -1 })
      .limit(parseInt(limit))
      .select('-imageData'); // Excluir datos binarios grandes
    
    res.json(screenshots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener imagen de la captura de pantalla
// @route   GET /api/screenshots/:id/image
// @access  Privado
const getScreenshotImage = async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id);
    
    if (!screenshot) {
      return res.status(404).json({ message: 'Captura no encontrada' });
    }
    
    res.json({ imageData: screenshot.imageData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  saveScreenshot,
  requestScreenshot,
  getScreenshots,
  getScreenshotById,
  addNoteToScreenshot,
  getPlayerScreenshots,
  getScreenshotImage
};