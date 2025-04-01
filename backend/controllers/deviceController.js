// controllers/deviceController.js
const Device = require('../models/Device');
const Player = require('../models/Player');
const { emitAlert } = require('../utils/socket');

// @desc    Obtener todos los dispositivos
// @route   GET /api/devices
// @access  Privado
const getDevices = async (req, res) => {
  try {
    // Filtrar dispositivos según query params
    const filter = {};
    
    if (req.query.type) {
      filter.type = { $regex: req.query.type, $options: 'i' };
    }
    
    if (req.query.trustLevel) {
      filter.trustLevel = req.query.trustLevel;
    }
    
    if (req.query.isMonitor === 'true') {
      filter.isMonitor = true;
    }
    
    const devices = await Device.find(filter)
      .populate('player', 'activisionId currentChannelId')
      .sort({ updatedAt: -1 });
    
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener dispositivo por ID
// @route   GET /api/devices/:id
// @access  Privado
const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('player', 'activisionId currentChannelId');
    
    if (device) {
      res.json(device);
    } else {
      res.status(404).json({ message: 'Dispositivo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener dispositivos sospechosos
// @route   GET /api/devices/suspicious
// @access  Privado
const getSuspiciousDevices = async (req, res) => {
  try {
    // Obtener dispositivos no confiables
    const devices = await Device.find({
      $or: [
        { trustLevel: 'External' },
        { trustLevel: 'Suspicious' },
        { trustLevel: 'Unknown' }
      ]
    })
    .populate('player', 'activisionId currentChannelId isOnline')
    .sort({ updatedAt: -1 });
    
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener historial de conexión de un dispositivo
// @route   GET /api/devices/:id/history
// @access  Privado
const getDeviceConnectionHistory = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }
    
    res.json(device.connectionHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Actualizar nivel de confianza de un dispositivo
// @route   PUT /api/devices/:id/trust-level
// @access  Privado
const updateDeviceTrustLevel = async (req, res) => {
  try {
    const { trustLevel, notes } = req.body;
    
    if (!['Trusted', 'Unknown', 'External', 'Suspicious'].includes(trustLevel)) {
      return res.status(400).json({ message: 'Nivel de confianza inválido' });
    }
    
    const device = await Device.findById(req.params.id)
      .populate('player', 'activisionId currentChannelId');
    
    if (!device) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }
    
    const oldTrustLevel = device.trustLevel;
    device.trustLevel = trustLevel;
    
    const updatedDevice = await device.save();
    
    // Si cambia a un nivel de menor confianza, emitir alerta
    if (oldTrustLevel === 'Trusted' && (trustLevel === 'External' || trustLevel === 'Suspicious')) {
      emitAlert({
        type: 'device-suspicious',
        deviceId: device._id,
        playerId: device.player._id,
        activisionId: device.player.activisionId,
        channelId: device.player.currentChannelId,
        message: `Dispositivo "${device.name}" marcado como ${trustLevel} por ${req.user.name}`,
        notes: notes || '',
        severity: 'medium',
        timestamp: new Date()
      });
    }
    
    res.json(updatedDevice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener todos los monitores
// @route   GET /api/devices/monitors
// @access  Privado
const getAllMonitors = async (req, res) => {
  try {
    const monitors = await Device.find({ isMonitor: true })
      .populate('player', 'activisionId currentChannelId isOnline')
      .sort({ updatedAt: -1 });
    
    res.json(monitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener dispositivos por tipo
// @route   GET /api/devices/by-type/:type
// @access  Privado
const getDevicesByType = async (req, res) => {
  try {
    const type = req.params.type.toLowerCase();
    let filter = {};
    
    // Filtrar por tipo específico
    switch (type) {
      case 'usb':
        filter.type = { $regex: 'usb', $options: 'i' };
        break;
      case 'pci':
        filter.type = { $regex: 'pci', $options: 'i' };
        break;
      case 'monitor':
        filter.isMonitor = true;
        break;
      default:
        return res.status(400).json({ message: 'Tipo no válido' });
    }
    
    const devices = await Device.find(filter)
      .populate('player', 'activisionId currentChannelId isOnline')
      .sort({ updatedAt: -1 });
    
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDevices,
  getDeviceById,
  getSuspiciousDevices,
  getDeviceConnectionHistory,
  updateDeviceTrustLevel,
  getAllMonitors,
  getDevicesByType
};