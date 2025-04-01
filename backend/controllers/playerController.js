// controllers/playerController.js
const Player = require('../models/Player');
const Device = require('../models/Device');
const MonitorData = require('../models/MonitorData');
const { emitMonitorData, emitAlert } = require('../utils/socket');
const { detectDuplicateHWID } = require('../utils/hwid');

// @desc    Obtener todos los jugadores
// @route   GET /api/players
// @access  Privado
const getPlayers = async (req, res) => {
  try {
    const players = await Player.find({})
      .sort({ lastSeen: -1 })
      .select('-hardwareIds');
    
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener jugador por ID
// @route   GET /api/players/:id
// @access  Privado
const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (player) {
      res.json(player);
    } else {
      res.status(404).json({ message: 'Jugador no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener jugador por ActivisionID
// @route   GET /api/players/activision/:activisionId
// @access  Privado
const getPlayerByActivisionId = async (req, res) => {
  try {
    const player = await Player.findOne({ activisionId: req.params.activisionId });
    
    if (player) {
      res.json(player);
    } else {
      res.status(404).json({ message: 'Jugador no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener jugadores por canal
// @route   GET /api/players/channel/:channelId
// @access  Privado
const getPlayersByChannel = async (req, res) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const players = await Player.find({ currentChannelId: channelId })
      .sort({ lastSeen: -1 });
    
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Actualizar canal de un jugador
// @route   PUT /api/players/:id/channel
// @access  Privado
const updatePlayerChannel = async (req, res) => {
  try {
    const { channelId } = req.body;
    
    if (!channelId && channelId !== 0) {
      return res.status(400).json({ message: 'ID de canal es requerido' });
    }
    
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }
    
    const previousChannel = player.currentChannelId;
    player.currentChannelId = channelId;
    
    const updatedPlayer = await player.save();
    
    // Emitir el cambio a través de Socket.io
    global.io.emit('player-channel-changed', {
      playerId: player._id,
      activisionId: player.activisionId,
      fromChannel: previousChannel,
      toChannel: channelId,
      changedBy: req.user.name,
      timestamp: new Date()
    });
    
    res.json(updatedPlayer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener historial de datos de monitoreo de un jugador
// @route   GET /api/players/:id/history
// @access  Privado
const getPlayerHistory = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }
    
    // Obtener historial de monitoreo
    const monitorHistory = await MonitorData.find({ 
      activisionId: player.activisionId 
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(req.query.limit) || 100);
    
    res.json(monitorHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener dispositivos de un jugador
// @route   GET /api/players/:id/devices
// @access  Privado
const getPlayerDevices = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }
    
    // Obtener todos los dispositivos asociados al jugador
    const devices = await Device.find({ player: player._id })
      .sort({ updatedAt: -1 });
    
    // Agrupar dispositivos por tipo
    const devicesByType = {
      usb: devices.filter(d => d.type?.toLowerCase().includes('usb')),
      pci: devices.filter(d => d.type?.toLowerCase().includes('pci')),
      monitors: devices.filter(d => d.isMonitor === true),
      other: devices.filter(d => 
        !d.type?.toLowerCase().includes('usb') && 
        !d.type?.toLowerCase().includes('pci') && 
        d.isMonitor !== true
      )
    };
    
    res.json({
      all: devices,
      byType: devicesByType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Marcar jugador como sospechoso
// @route   PUT /api/players/:id/suspect
// @access  Privado
const markPlayerAsSuspicious = async (req, res) => {
  try {
    const { suspicious, notes } = req.body;
    
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }
    
    player.suspiciousActivity = suspicious;
    
    if (notes) {
      player.notes = notes;
    }
    
    const updatedPlayer = await player.save();
    
    // Emitir alerta si se marca como sospechoso
    if (suspicious) {
      emitAlert({
        type: 'player-suspicious',
        playerId: player._id,
        activisionId: player.activisionId,
        channelId: player.currentChannelId,
        message: `Jugador ${player.activisionId} marcado como sospechoso por ${req.user.name}`,
        notes: notes || '',
        severity: 'high',
        timestamp: new Date()
      });
    }
    
    res.json(updatedPlayer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Detectar HWID duplicados
// @route   GET /api/players/detect-duplicates
// @access  Privado
const detectDuplicateHWIDs = async (req, res) => {
  try {
    const results = await detectDuplicateHWID();
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlayers,
  getPlayerById,
  getPlayerByActivisionId,
  getPlayersByChannel,
  updatePlayerChannel,
  getPlayerHistory,
  getPlayerDevices,
  markPlayerAsSuspicious,
  detectDuplicateHWIDs
};