// controllers/monitorController.js
const mongoose = require('mongoose');
const Player = require('../models/Player');
const Device = require('../models/Device');
const MonitorData = require('../models/MonitorData');
const Alert = require('../models/Alert');
const { emitMonitorData, emitAlert } = require('../utils/socket');

// Función para verificar si un dispositivo es de tipo DMA
const isDMADevice = (deviceInfo) => {
  // Verificar si tiene recursos DMA
  if (deviceInfo.resources && deviceInfo.resources.dma) {
    return true;
  }
  
  // Verificar nombres o descripciones que indiquen DMA
  const dmaKeywords = ['dma', 'direct memory access', 'memory controller'];
  
  const nameCheck = deviceInfo.name 
    ? dmaKeywords.some(keyword => deviceInfo.name.toLowerCase().includes(keyword))
    : false;
    
  const descriptionCheck = deviceInfo.description
    ? dmaKeywords.some(keyword => deviceInfo.description.toLowerCase().includes(keyword))
    : false;
    
  return nameCheck || descriptionCheck;
};

// @desc    Save monitor data from anti-cheat client
// @route   POST /api/monitor
// @access  Public (from anti-cheat client)
const saveMonitorData = async (req, res) => {
  try {
    const { 
      activisionId, 
      channelId, 
      isGameRunning,
      pcStartTime,
      processes,
      usbDevices,
      networkConnections,
      loadedDrivers,
      systemInfo,
      hardwareInfo
    } = req.body;
    
    if (!activisionId || !channelId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find or create player
    let player = await Player.findOne({ activisionId });
    let isNewPlayer = false;
    
    if (!player) {
      isNewPlayer = true;
      player = await Player.create({
        activisionId,
        currentChannelId: channelId,
        isOnline: true,
        isGameRunning,
        lastSeen: new Date(),
        pcStartTime,
        systemInfo,
        hardwareInfo
      });
      
      // Emitir alerta de nuevo jugador
      emitAlert({
        type: 'new-player',
        playerId: player._id,
        activisionId,
        channelId,
        message: `New player connected: ${activisionId}`,
        severity: 'info',
        timestamp: new Date()
      });
    } else {
      // Update player info
      const wasOnline = player.isOnline;
      const wasPlaying = player.isGameRunning;
      
      player.currentChannelId = channelId;
      player.isOnline = true;
      player.isGameRunning = isGameRunning;
      player.lastSeen = new Date();
      
      // Update system info if provided
      if (systemInfo) {
        player.systemInfo = { ...player.systemInfo, ...systemInfo };
      }
      
      // Update hardware info if provided
      if (hardwareInfo) {
        player.hardwareInfo = { ...player.hardwareInfo, ...hardwareInfo };
        
        // Track hardware ID and check for duplicates
        if (hardwareInfo.hardwareId) {
          const { trackHWID } = require('../utils/hwid');
          await trackHWID(player._id, activisionId, hardwareInfo);
        }
      }
      
      await player.save();
      
      // Emitir reconexión si el jugador estaba desconectado
      if (!wasOnline) {
        emitAlert({
          type: 'player-reconnected',
          playerId: player._id,
          activisionId: player.activisionId,
          channelId: player.currentChannelId,
          message: `Player reconnected: ${activisionId}`,
          severity: 'info',
          timestamp: new Date()
        });
      }
    }
    
    // Process devices if provided
    if (usbDevices && Array.isArray(usbDevices)) {
      await processDevices(player._id, usbDevices);
    }
    
    // Create monitor data entry
    const monitorData = await MonitorData.create({
      player: player._id,
      activisionId,
      channelId,
      isGameRunning,
      pcStartTime,
      processes,
      usbDevices,
      networkConnections,
      loadedDrivers,
      timestamp: new Date()
    });
    
    // Emitir datos de monitoreo en tiempo real
    emitMonitorData({
      _id: player._id,
      activisionId,
      channelId,
      isOnline: true,
      isGameRunning,
      lastSeen: new Date(),
      statusChanged: isNewPlayer,
      isNewPlayer,
      processes,
      networkConnections,
      systemInfo,
      hardwareInfo
    });
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error saving monitor data:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update game status
// @route   POST /api/monitor/game-status
// @access  Public (from anti-cheat client)
const updateGameStatus = async (req, res) => {
  try {
    const { activisionId, isGameRunning } = req.body;
    
    if (!activisionId) {
      return res.status(400).json({ message: 'Missing activisionId' });
    }
    
    const player = await Player.findOne({ activisionId });
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Update game status
    player.isGameRunning = isGameRunning;
    player.lastSeen = new Date();
    await player.save();
    
    // Emit status update
    emitMonitorData({
      _id: player._id,
      activisionId,
      channelId: player.currentChannelId,
      isOnline: true,
      isGameRunning,
      lastSeen: new Date(),
      statusChanged: true
    });
    
    // Emit alert
    emitAlert({
      type: isGameRunning ? 'game-started' : 'game-stopped',
      playerId: player._id,
      activisionId,
      channelId: player.currentChannelId,
      message: `Game ${isGameRunning ? 'started' : 'stopped'} for ${activisionId}`,
      severity: 'info',
      timestamp: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating game status:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report client errors
// @route   POST /api/monitor/error
// @access  Public (from anti-cheat client)
const reportClientError = async (req, res) => {
  try {
    const { activisionId, errorMessage, errorDetails, severity } = req.body;
    
    if (!activisionId || !errorMessage) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find player
    const player = await Player.findOne({ activisionId });
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Create alert for the error
    await Alert.create({
      type: 'client-error',
      playerId: player._id,
      activisionId,
      channelId: player.currentChannelId,
      message: errorMessage,
      details: errorDetails || '',
      severity: severity || 'medium',
      timestamp: new Date()
    });
    
    // Emit alert in real-time
    emitAlert({
      type: 'client-error',
      playerId: player._id,
      activisionId,
      channelId: player.currentChannelId,
      message: errorMessage,
      details: errorDetails || '',
      severity: severity || 'medium',
      timestamp: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error reporting client error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark player as disconnected
// @route   PUT /api/monitor/disconnect
// @access  Private
const markPlayerDisconnected = async (req, res) => {
  try {
    const { activisionId } = req.body;
    
    if (!activisionId) {
      return res.status(400).json({ message: 'Missing activisionId' });
    }
    
    const player = await Player.findOne({ activisionId });
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    player.isOnline = false;
    player.isGameRunning = false;
    await player.save();
    
    // Emit disconnect event
    emitMonitorData({
      _id: player._id,
      activisionId,
      channelId: player.currentChannelId,
      isOnline: false,
      isGameRunning: false,
      lastSeen: new Date(),
      statusChanged: true
    });
    
    // Emit alert
    emitAlert({
      type: 'player-disconnected',
      playerId: player._id,
      activisionId,
      channelId: player.currentChannelId,
      message: `Player disconnected: ${activisionId}`,
      severity: 'info',
      timestamp: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking player as disconnected:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monitoring statistics
// @route   GET /api/monitor/stats
// @access  Private
const getMonitoringStats = async (req, res) => {
  try {
    // Players stats
    const totalPlayers = await Player.countDocuments();
    const onlinePlayers = await Player.countDocuments({ isOnline: true });
    const playingPlayers = await Player.countDocuments({ isOnline: true, isGameRunning: true });
    
    // Devices stats
    const totalDevices = await Device.countDocuments();
    
    // Group devices by trust level
    const devicesByTrustLevel = await Device.aggregate([
      { $group: { _id: "$trustLevel", count: { $sum: 1 } } }
    ]);
    
    // Convert to object format
    const trustLevelCounts = {};
    devicesByTrustLevel.forEach(item => {
      trustLevelCounts[item._id || 'Unknown'] = item.count;
    });
    
    // Group devices by type
    const devicesByType = await Device.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    
    // Convert to object format
    const typeCounts = {};
    devicesByType.forEach(item => {
      typeCounts[item._id || 'Unknown'] = item.count;
    });
    
    // Screenshot stats
    const Screenshot = mongoose.model('Screenshot');
    const totalScreenshots = await Screenshot.countDocuments();
    
    // Screenshots in last 24h
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const last24hScreenshots = await Screenshot.countDocuments({
      capturedAt: { $gte: oneDayAgo }
    });
    
    res.json({
      timestamp: new Date(),
      players: {
        total: totalPlayers,
        online: onlinePlayers,
        playing: playingPlayers
      },
      devices: {
        total: totalDevices,
        byTrustLevel: trustLevelCounts,
        byType: typeCounts
      },
      screenshots: {
        total: totalScreenshots,
        last24h: last24hScreenshots
      }
    });
  } catch (error) {
    console.error('Error getting monitoring stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monitor data by ID
// @route   GET /api/monitor/:id
// @access  Private
const getMonitorDataById = async (req, res) => {
  try {
    const monitorData = await MonitorData.findById(req.params.id);
    
    if (!monitorData) {
      return res.status(404).json({ message: 'Monitor data not found' });
    }
    
    res.json(monitorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Función para verificar si hay jugadores desconectados
const checkDisconnectedPlayers = async () => {
  try {
    // Buscar jugadores marcados como online pero con último ping hace más de 5 minutos
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const disconnectedPlayers = await Player.find({
      isOnline: true,
      lastSeen: { $lt: fiveMinutesAgo }
    });
    
    console.log(`Verificando jugadores desconectados: ${disconnectedPlayers.length} encontrados.`);
    
    // Marcar como desconectados
    for (const player of disconnectedPlayers) {
      player.isOnline = false;
      player.isGameRunning = false;
      await player.save();
      
      // Emitir evento de desconexión
      emitAlert({
        type: 'player-disconnected',
        playerId: player._id,
        activisionId: player.activisionId,
        channelId: player.currentChannelId,
        message: `Player timed out: ${player.activisionId}`,
        severity: 'info',
        timestamp: new Date()
      });
      
      emitMonitorData({
        _id: player._id,
        activisionId: player.activisionId,
        channelId: player.currentChannelId,
        isOnline: false,
        isGameRunning: false,
        lastSeen: player.lastSeen,
        statusChanged: true
      });
    }
  } catch (error) {
    console.error('Error verificando jugadores desconectados:', error);
  }
};

// Configurar chequeo automático de desconexiones
const setupDisconnectionCheck = () => {
  // Ejecutar cada 2 minutos
  setInterval(checkDisconnectedPlayers, 2 * 60 * 1000);
};

// Función auxiliar para procesar dispositivos
async function processDevices(playerId, devices) {
  try {
    for (const deviceInfo of devices) {
      // Buscar si el dispositivo ya existe
      let device = await Device.findOne({
        player: playerId,
        deviceId: deviceInfo.deviceId
      });
      
      // Verificar si es un dispositivo DMA sospechoso
      const isDMA = isDMADevice(deviceInfo);
      
      if (device) {
        // Actualizar información si existe
        device.name = deviceInfo.name || device.name;
        device.description = deviceInfo.description || device.description;
        device.manufacturer = deviceInfo.manufacturer || device.manufacturer;
        device.type = deviceInfo.type || device.type;
        device.status = deviceInfo.status || device.status;
        device.connectionStatus = deviceInfo.connectionStatus || device.connectionStatus;
        device.deviceClass = deviceInfo.deviceClass || device.deviceClass;
        device.classGuid = deviceInfo.classGuid || device.classGuid;
        device.driver = deviceInfo.driver || device.driver;
        device.hardwareId = deviceInfo.hardwareId || device.hardwareId;
        device.locationInfo = deviceInfo.locationInfo || device.locationInfo;
        device.resources = deviceInfo.resources || device.resources || {};
        
        // Si es un DMA, marcar explícitamente como sospechoso
        if (isDMA) {
          device.trustLevel = 'Suspicious';
          device.isDMA = true;
          
          // Añadir nota/tag para alertar sobre DMA
          if (!device.tags) device.tags = [];
          if (!device.tags.includes('DMA')) {
            device.tags.push('DMA');
          }
        } else {
          // Mantener el nivel de confianza actual o el nuevo
          device.trustLevel = deviceInfo.trustLevel || device.trustLevel;
        }
        
        // Determinar si es un monitor
        if (deviceInfo.type?.toLowerCase().includes('monitor') ||
            deviceInfo.name?.toLowerCase().includes('monitor') ||
            deviceInfo.description?.toLowerCase().includes('monitor') ||
            deviceInfo.name?.toLowerCase().includes('display')) {
          device.isMonitor = true;
          
          // Extraer información del monitor
          if (deviceInfo.description && deviceInfo.description.includes('x')) {
            device.monitorInfo = {
              ...device.monitorInfo,
              resolution: deviceInfo.description
            };
          }
        }
        
        // Registrar conexión si cambió el estado
        if (deviceInfo.connectionStatus && 
            device.connectionStatus !== deviceInfo.connectionStatus) {
          device.connectionHistory.push({
            status: deviceInfo.connectionStatus,
            timestamp: new Date()
          });
        }
        
        await device.save();
        
        // Emitir alerta si es un DMA y no se emitió antes
        if (isDMA && !device.dmaAlertSent) {
          device.dmaAlertSent = true;
          await device.save();
          
          const player = await Player.findById(playerId);
          if (player) {
            emitAlert({
              type: 'dma-device-detected',
              playerId: player._id,
              activisionId: player.activisionId,
              channelId: player.currentChannelId,
              deviceId: device._id,
              message: `¡ALERTA CRÍTICA! Dispositivo DMA detectado: ${device.name || 'Dispositivo desconocido'}`,
              details: `Descripción: ${device.description || 'N/A'} | ID: ${device.deviceId}`,
              severity: 'high',
              trustLevel: 'Suspicious',
              timestamp: new Date()
            });
          }
        }
      } else {
        // Crear nuevo dispositivo
        const newDevice = {
          player: playerId,
          ...deviceInfo,
          // Si es DMA, marcar explícitamente como sospechoso
          trustLevel: isDMA ? 'Suspicious' : (deviceInfo.trustLevel || 'Unknown'),
          isDMA: isDMA,
          tags: isDMA ? ['DMA'] : [],
          dmaAlertSent: false,
          resources: deviceInfo.resources || {},
          connectionHistory: [{
            status: deviceInfo.connectionStatus || 'Connected',
            timestamp: new Date()
          }]
        };
        
        // Determinar si es un monitor
        if (deviceInfo.type?.toLowerCase().includes('monitor') ||
            deviceInfo.name?.toLowerCase().includes('monitor') ||
            deviceInfo.description?.toLowerCase().includes('monitor') ||
            deviceInfo.name?.toLowerCase().includes('display')) {
          newDevice.isMonitor = true;
          
          // Extraer información del monitor
          if (deviceInfo.description && deviceInfo.description.includes('x')) {
            newDevice.monitorInfo = {
              resolution: deviceInfo.description,
              refreshRate: '',
              connectionType: ''
            };
          }
        }

        const createdDevice = await Device.create(newDevice);
        
        // Emitir alerta por DMA o dispositivo externo
        const player = await Player.findById(playerId);
        if (player) {
          if (isDMA) {
            // Alerta especial para DMA
            emitAlert({
              type: 'dma-device-detected',
              playerId: player._id,
              activisionId: player.activisionId,
              channelId: player.currentChannelId,
              deviceId: createdDevice._id,
              message: `¡ALERTA CRÍTICA! Dispositivo DMA detectado: ${deviceInfo.name || 'Dispositivo desconocido'}`,
              details: `Descripción: ${deviceInfo.description || 'N/A'} | ID: ${deviceInfo.deviceId}`,
              severity: 'high',
              trustLevel: 'Suspicious',
              timestamp: new Date()
            });
            
            // Marcar alerta como enviada
            createdDevice.dmaAlertSent = true;
            await createdDevice.save();
          }
          else if (deviceInfo.trustLevel === 'External' || deviceInfo.trustLevel === 'Suspicious') {
            // Alerta para otros dispositivos sospechosos
            emitAlert({
              type: 'new-device',
              playerId: player._id,
              activisionId: player.activisionId,
              channelId: player.currentChannelId,
              message: `Nuevo dispositivo detectado: ${deviceInfo.name}`,
              deviceId: deviceInfo.deviceId,
              trustLevel: deviceInfo.trustLevel,
              severity: 'medium',
              timestamp: new Date()
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error procesando dispositivos:', error);
  }
}

module.exports = {
  saveMonitorData,
  updateGameStatus,
  reportClientError,
  markPlayerDisconnected,
  getMonitoringStats,
  getMonitorDataById,
  setupDisconnectionCheck,
  processDevices
};
