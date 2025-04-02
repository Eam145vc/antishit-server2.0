// controllers/monitorController.js
const mongoose = require('mongoose');
const Player = require('../models/Player');
const Device = require('../models/Device');
const MonitorData = require('../models/MonitorData');
const Screenshot = require('../models/Screenshot'); 
const { emitMonitorData, emitAlert } = require('../utils/socket');
const { trackHWID } = require('../utils/hwid');

// Tiempo máximo de inactividad antes de marcar a un jugador como desconectado (5 minutos en ms)
const INACTIVE_THRESHOLD = 5 * 60 * 1000;

// Función para procesar y sanear datos de dispositivos USB
const sanitizeUsbDevices = (devices) => {
  if (!Array.isArray(devices)) {
    console.warn('Invalid USB devices data. Expected an array.');
    return [];
  }

  return devices.map(device => {
    // Mapeo flexible de campos, ignorando mayúsculas/minúsculas
    return {
      deviceId: device.DeviceId || device.deviceId || device.device_id,
      name: device.Name || device.name,
      description: device.Description || device.description,
      manufacturer: device.Manufacturer || device.manufacturer,
      type: device.Type || device.type,
      status: device.Status || device.status,
      connectionStatus: device.ConnectionStatus || device.connectionStatus || device.connection_status,
      deviceClass: device.DeviceClass || device.deviceClass || device.device_class,
      classGuid: device.ClassGuid || device.classGuid || device.class_guid,
      driver: device.Driver || device.driver,
      hardwareId: device.HardwareId || device.hardwareId || device.hardware_id,
      locationInfo: device.LocationInfo || device.locationInfo || device.location_info,
      trustLevel: device.TrustLevel || device.trustLevel || device.trust_level || 'Unknown'
    };
  }).filter(device => device.deviceId); // Eliminar entradas sin deviceId
};

// Configuración para la verificación automática de desconexiones
function setupDisconnectionCheck() {
  console.log('Configurando verificación automática de desconexiones');
  
  // Comprueba cada 1 minuto los jugadores inactivos
  setInterval(async () => {
    const cutoffTime = new Date(Date.now() - INACTIVE_THRESHOLD);
    
    try {
      // Busca jugadores marcados como conectados pero que no han enviado datos recientemente
      const inactivePlayers = await Player.find({
        isOnline: true,
        lastSeen: { $lt: cutoffTime }
      });
      
      console.log(`Marcando ${inactivePlayers.length} jugadores como desconectados por inactividad`);
      
      // Marcar cada jugador como desconectado
      for (const player of inactivePlayers) {
        player.isOnline = false;
        player.isGameRunning = false;
        await player.save();
        
        // Emitir evento de desconexión a través de socket.io
        emitMonitorData({
          _id: player._id,
          activisionId: player.activisionId,
          channelId: player.currentChannelId,
          isOnline: false,
          isGameRunning: false,
          lastSeen: new Date(),
          statusChanged: true
        });
        
        // Emitir alerta de desconexión
        emitAlert({
          type: 'player-disconnected',
          playerId: player._id,
          activisionId: player.activisionId,
          channelId: player.currentChannelId,
          message: `Jugador desconectado automáticamente: ${player.activisionId} (inactividad)`,
          severity: 'info',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error al verificar jugadores inactivos:', error);
    }
  }, 60000); // Ejecutar cada 1 minuto
}

// @desc    Guardar datos de monitoreo desde cliente
// @route   POST /api/monitor
// @access  Público (desde cliente anti-cheat)
const saveMonitorData = async (req, res) => {
  try {
    const { 
      activisionId, 
      channelId, 
      timestamp, 
      clientStartTime,
      pcStartTime,
      isGameRunning, 
      processes, 
      usbDevices, 
      hardwareInfo,
      systemInfo,
      networkConnections,
      loadedDrivers
    } = req.body;
    
    // Verificar campos obligatorios
    if (!activisionId || !channelId) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    
    // Sanear datos de dispositivos USB
    const sanitizedUsbDevices = sanitizeUsbDevices(usbDevices);
    
    // Buscar o crear jugador
    let player = await Player.findOne({ activisionId });
    let isNewPlayer = false;
    let statusChanged = false;
    
    if (!player) {
      // Crear nuevo jugador
      player = await Player.create({
        activisionId,
        currentChannelId: channelId,
        isOnline: true,
        isGameRunning: isGameRunning || false,
        lastSeen: timestamp || new Date(),
        clientStartTime: clientStartTime || new Date(),
        pcStartTime: pcStartTime || '',
        systemInfo: systemInfo || {},
        hardwareInfo: hardwareInfo || {}
      });
      isNewPlayer = true;
      statusChanged = true;
    } else {
      // Verificar si cambió estado
      if (!player.isOnline) {
        statusChanged = true;
      }
      
      // Actualizar información del jugador
      player.lastSeen = timestamp || new Date();
      player.currentChannelId = channelId;
      player.isOnline = true;
      player.isGameRunning = isGameRunning || false;
      
      if (clientStartTime) {
        player.clientStartTime = clientStartTime;
      }
      
      if (pcStartTime) {
        player.pcStartTime = pcStartTime;
      }
      
      // Actualizar info del sistema si existe
      if (systemInfo) {
        player.systemInfo = {
          ...player.systemInfo,
          ...systemInfo
        };
      }
      
      // Actualizar info de hardware si existe
      if (hardwareInfo) {
        player.hardwareInfo = {
          ...player.hardwareInfo,
          ...hardwareInfo
        };
      }
      
      await player.save();
    }
    
    // Crear registro de monitoreo
    const monitorData = await MonitorData.create({
      player: player._id,
      activisionId,
      channelId,
      timestamp: timestamp || new Date(),
      isGameRunning: isGameRunning || false,
      pcStartTime,
      processes: processes || [],
      usbDevices: sanitizedUsbDevices,
      networkConnections: networkConnections || [],
      loadedDrivers: loadedDrivers || []
    });
    
    // Procesar y guardar dispositivos
    if (sanitizedUsbDevices.length > 0) {
      await processDevices(player._id, sanitizedUsbDevices);
    }
    
    // Procesar HWIDs para detección de cuentas duplicadas
    if (hardwareInfo) {
      await trackHWID(player._id, activisionId, hardwareInfo);
    }
    
    // Emitir datos de monitoreo en tiempo real
    emitMonitorData({
      _id: monitorData._id,
      activisionId,
      channelId,
      isOnline: true,
      isGameRunning: isGameRunning || false,
      lastSeen: timestamp || new Date(),
      statusChanged,
      isNewPlayer
    });
    
    // Si es un nuevo jugador, emitir notificación especial
    if (isNewPlayer) {
      emitAlert({
        type: 'new-player',
        playerId: player._id,
        activisionId,
        channelId,
        message: `Nuevo jugador conectado: ${activisionId}`,
        severity: 'info',
        timestamp: new Date()
      });
    }
    
    // Si ha cambiado el estado, emitir notificación
    if (statusChanged && !isNewPlayer) {
      emitAlert({
        type: 'player-reconnected',
        playerId: player._id,
        activisionId,
        channelId,
        message: `Jugador reconectado: ${activisionId}`,
        severity: 'info',
        timestamp: new Date()
      });
    }
    
    res.status(201).json({
      success: true,
      id: monitorData._id
    });
  } catch (error) {
    console.error('Detalles del error al guardar datos de monitoreo:', error);
    
    // Log de datos problemáticos para depuración
    console.log('Datos USB problemáticos:', JSON.stringify(usbDevices, null, 2));
    
    res.status(500).json({ 
      message: 'Error al guardar datos de monitoreo', 
      details: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// [Resto de las funciones del controlador permanecen iguales]

// Función auxiliar para procesar dispositivos
async function processDevices(playerId, devices) {
  try {
    for (const deviceInfo of devices) {
      // Buscar si el dispositivo ya existe
      let device = await Device.findOne({
        player: playerId,
        deviceId: deviceInfo.deviceId
      });
      
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
        device.trustLevel = deviceInfo.trustLevel || device.trustLevel;
        
        await device.save();
      } else {
        // Crear nuevo dispositivo
        await Device.create({
          player: playerId,
          ...deviceInfo
        });
      }
    }
  } catch (error) {
    console.error('Error procesando dispositivos:', error);
  }
}

module.exports = {
  saveMonitorData,
  setupDisconnectionCheck,
  // Otras funciones existentes
};
