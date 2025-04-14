// controllers/screenshotController.js
const Screenshot = require('../models/Screenshot');
const Player = require('../models/Player');
const User = require('../models/User');
const { emitAlert } = require('../utils/socket');

// Global cache for pending screenshot requests
if (!global.screenshotRequests) {
  global.screenshotRequests = {};
}

/**
 * Determina si una captura es solicitada por un juez o enviada por un usuario
 * Función mejorada para ser más robusta en la detección
 */
const determineScreenshotSource = (data, pendingRequest) => {
  console.log('[SCREENSHOT] Determinando fuente de la captura:');
  console.log(`[SCREENSHOT] - Fuente explícita en datos: "${data.source || 'no definida'}"`);
  console.log(`[SCREENSHOT] - ¿Pendiente?: ${pendingRequest ? 'Sí' : 'No'}`);
  
  if (pendingRequest) {
    console.log(`[SCREENSHOT] - Fuente de solicitud pendiente: "${pendingRequest.source || 'no definida'}"`);
    console.log(`[SCREENSHOT] - ¿Es solicitud de juez?: ${pendingRequest.isJudgeRequest === true ? 'Sí' : 'No'}`);
    console.log(`[SCREENSHOT] - ¿Forzar como juez?: ${pendingRequest.FORCE_JUDGE_TYPE === true ? 'Sí' : 'No'}`);
  }
  
  // Primero, verificar si hay una solicitud pendiente de un juez
  if (pendingRequest && 
    (pendingRequest.source === 'judge' || 
     pendingRequest.isJudgeRequest === true || 
     pendingRequest.FORCE_JUDGE_TYPE === true)) {
    console.log('[SCREENSHOT] Determinado como: "judge" (por solicitud pendiente)');
    return 'judge';
  }
  
  // Segundo, verificar si el cliente especificó explícitamente "judge"
  if (data.source === 'judge') {
    console.log('[SCREENSHOT] Determinado como: "judge" (por fuente explícita en datos)');
    return 'judge';
  }
  
  // Si tenemos una solicitud pendiente pero sin otra información, confiar en ella
  if (pendingRequest && pendingRequest.source) {
    console.log(`[SCREENSHOT] Determinado como: "${pendingRequest.source}" (por solicitud pendiente genérica)`);
    return pendingRequest.source;
  }
  
  // Por defecto, es una captura enviada por el usuario
  console.log('[SCREENSHOT] Determinado como: "user" (por defecto)');
  return 'user';
};

// @desc    Save new screenshot
// @route   POST /api/screenshots
// @access  Public (from anti-cheat client)
const saveScreenshot = async (req, res) => {
  try {
    const { activisionId, channelId, screenshot, timestamp, source } = req.body;
    
    // Verificar campos obligatorios
    if (!activisionId || !channelId || !screenshot) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Log para depuración
    console.log(`[SCREENSHOT] Receiving screenshot for ${activisionId} in channel ${channelId}`);
    console.log(`[SCREENSHOT] Source from client: ${source || 'not specified'}`);
    
    // Encontrar o crear jugador
    let player = await Player.findOne({ activisionId });
    
    if (!player) {
      // Si el jugador no existe, crearlo
      player = await Player.create({
        activisionId,
        currentChannelId: channelId,
        isOnline: true,
        lastSeen: new Date()
      });
    } else {
      // Actualizar campos del jugador
      player.lastSeen = new Date();
      player.currentChannelId = channelId;
      await player.save();
    }
    
    // Normalizar y verificar datos de imagen
    let imageData = screenshot;
    
    // Si no tiene prefijo base64, añadirlo
    if (!imageData.startsWith('data:image')) {
      imageData = `data:image/png;base64,${imageData}`;
    }
    
    // Verificar si hay una solicitud pendiente
    const key = `${activisionId}-${channelId}`;
    const pendingRequest = global.screenshotRequests?.[key];
    
    console.log(`[SCREENSHOT] Checking pending request for ${key}: ${pendingRequest ? 'Found' : 'Not found'}`);
    if (pendingRequest) {
      console.log(`[SCREENSHOT] Pending request details: ${JSON.stringify(pendingRequest)}`);
    }
    
    // Determinar el origen de la captura con el método mejorado
    const screenshotSource = determineScreenshotSource(req.body, pendingRequest);
    
    // Tipo de captura basado en la fuente
    const screenshotType = screenshotSource === 'judge' ? 'judge-requested' : 'user-submitted';
    
    // Buscar el usuario que solicitó la captura (si existe)
    let requestedBy = null;
    if (pendingRequest?.requestedBy) {
      try {
        // Buscar el usuario por nombre
        const user = await User.findOne({ name: pendingRequest.requestedBy });
        if (user) {
          requestedBy = user._id;
        }
      } catch (error) {
        console.warn('Could not find user for screenshot request:', error);
      }
    }
    
    // Crear la nueva captura con la fuente correcta
    const newScreenshot = await Screenshot.create({
      player: player._id,
      activisionId,
      channelId,
      imageData: imageData,
      capturedAt: timestamp || new Date(),
      source: screenshotSource, // Usar la fuente determinada
      type: screenshotType,     // Tipo basado en la fuente
      requestedBy: requestedBy, // Usuario que solicitó la captura (si existe)
      requestInfo: pendingRequest ? {
        requestTime: pendingRequest.timestamp,
        requestedBy: pendingRequest.requestedBy,
        source: pendingRequest.source,
        isJudgeRequest: pendingRequest.isJudgeRequest,
        FORCE_JUDGE_TYPE: pendingRequest.FORCE_JUDGE_TYPE
      } : null
    });
    
    console.log(`[SCREENSHOT] Screenshot saved with ID: ${newScreenshot._id}`);
    console.log(`[SCREENSHOT] - source: ${newScreenshot.source}`);
    console.log(`[SCREENSHOT] - type: ${newScreenshot.type}`);
    
    // Emitir evento de nueva captura
    global.io?.to(`channel:${channelId}`).emit('new-screenshot', {
      id: newScreenshot._id,
      activisionId,
      channelId,
      timestamp: newScreenshot.capturedAt,
      source: newScreenshot.source,
      type: newScreenshot.type
    });
    
    // Emitir alerta
    emitAlert({
      type: 'screenshot-taken',
      playerId: player._id,
      activisionId,
      channelId,
      message: `New screenshot from ${activisionId}`,
      severity: 'info',
      timestamp: newScreenshot.capturedAt,
      meta: {
        screenshotId: newScreenshot._id,
        source: newScreenshot.source,
        type: newScreenshot.type
      }
    });
    
    // Limpiar solicitud pendiente para este jugador
    if (global.screenshotRequests[key]) {
      console.log(`[SCREENSHOT] Clearing pending request for ${key}`);
      delete global.screenshotRequests[key];
    }
    
    res.status(201).json({
      success: true,
      id: newScreenshot._id,
      source: newScreenshot.source,
      type: newScreenshot.type
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
    
    // Verificar si hay una solicitud pendiente para este jugador
    const key = `${activisionId}-${channelId}`;
    const hasRequest = !!global.screenshotRequests[key];
    
    // Si hay solicitud, proporcionar los detalles
    if (hasRequest) {
      console.log(`[SCREENSHOT] Pending request found for ${activisionId} in channel ${channelId}`);
      const requestDetails = global.screenshotRequests[key];
      
      // Agregar timestamp de expiración si no existe
      if (!requestDetails.expireAt) {
        requestDetails.expireAt = Date.now() + 60000; // 60 segundos
      }
      
      // Incluir explícitamente la fuente de la solicitud
      const source = requestDetails.source || 'judge';
      console.log(`[SCREENSHOT] Request source: ${source}`);
      
      return res.json({ 
        hasRequest: true,
        requestDetails: {
          requestedBy: requestDetails.requestedBy,
          timestamp: requestDetails.timestamp,
          source: source, // Incluir explícitamente la fuente
          isJudgeRequest: requestDetails.isJudgeRequest !== false,
          FORCE_JUDGE_TYPE: requestDetails.FORCE_JUDGE_TYPE !== false
        }
      });
    } else {
      console.log(`[SCREENSHOT] No pending requests for ${activisionId} in channel ${channelId}`);
      return res.json({ hasRequest: false });
    }
  } catch (error) {
    console.error('Error checking screenshot requests:', error);
    res.status(500).json({ hasRequest: false, message: error.message });
  }
};

// @desc    Clean expired screenshot requests
// @route   None (internal function)
// @access  Private
const cleanExpiredRequests = () => {
  const now = Date.now();
  let count = 0;
  
  for (const key in global.screenshotRequests) {
    const request = global.screenshotRequests[key];
    if (request.expireAt && request.expireAt < now) {
      delete global.screenshotRequests[key];
      count++;
    }
  }
  
  if (count > 0) {
    console.log(`[SCREENSHOT] Cleaned ${count} expired screenshot requests`);
  }
};

// Setup a cleanup interval
setInterval(cleanExpiredRequests, 60000); // Clean every minute

// @desc    Request remote screenshot
// @route   POST /api/screenshots/request
// @access  Private
const requestScreenshot = async (req, res) => {
  try {
    const { activisionId, channelId, source, isJudgeRequest } = req.body;
    
    // Verificar campos obligatorios
    if (!activisionId || !channelId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Buscar jugador
    const player = await Player.findOne({ activisionId });
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Comprobar si el jugador está conectado
    const lastSeenDate = new Date(player.lastSeen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isReallyOnline = player.isOnline && lastSeenDate > fiveMinutesAgo;

    if (!isReallyOnline) {
      return res.status(400).json({ 
        message: 'Player appears to be offline. Cannot request screenshot.' 
      });
    }
    
    // Almacenar la solicitud para que el cliente la recoja
    if (!global.screenshotRequests) {
      global.screenshotRequests = {};
    }
    
    const key = `${activisionId}-${channelId}`;
    
    // MEJORA: Asegurarse de que siempre se marque como solicitud de juez
    // con todos los metadatos necesarios
    global.screenshotRequests[key] = {
      timestamp: new Date(),
      requestedBy: req.user?.name || 'Judge', // Nombre por defecto
      expireAt: Date.now() + 120000, // 2 minutos
      source: 'judge', // Forzar a 'judge' - esta es una solicitud de juez
      isJudgeRequest: true, // Siempre true para este endpoint
      FORCE_JUDGE_TYPE: true // Metadato adicional para forzar el tipo
    };
    
    console.log(`[SCREENSHOT] New request stored for ${activisionId} in channel ${channelId}`);
    console.log(`[SCREENSHOT] Request metadata: ${JSON.stringify(global.screenshotRequests[key])}`);
    
    // Emitir solicitud a través de socket
    global.io?.to(`channel:${channelId}`).emit('take-screenshot', {
      activisionId,
      requestedBy: req.user?.name || 'Judge',
      timestamp: new Date(),
      source: 'judge',
      isJudgeRequest: true
    });
    
    // Emitir alerta
    emitAlert({
      type: 'screenshot-request',
      playerId: player._id,
      activisionId,
      channelId,
      message: `Screenshot requested for ${activisionId}`,
      severity: 'info',
      timestamp: new Date(),
      meta: {
        source: 'judge',
        isJudgeRequest: true
      }
    });
    
    res.json({
      success: true,
      message: 'Screenshot request sent',
      source: 'judge'
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
    
    // Crear filtro basado en parámetros
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
    
    // Asegurar que la imagen tenga el prefijo correcto
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
    
    // Buscar jugador
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Obtener capturas
    const screenshots = await Screenshot.find({ player: player._id })
      .sort({ capturedAt: -1 })
      .limit(parseInt(limit))
      .select('-imageData'); // Excluir datos binarios
    
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
