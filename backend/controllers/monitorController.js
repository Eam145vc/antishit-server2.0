// controllers/monitorController.js
const MonitorData = require('../models/MonitorData');
const Player = require('../models/Player');
const Device = require('../models/Device');
const { emitMonitorData, emitAlert } = require('../utils/socket');
const { trackHWID } = require('../utils/hwid');

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
      usbDevices: usbDevices || [],
      networkConnections: networkConnections || [],
      loadedDrivers: loadedDrivers || []
    });
    
    // Procesar y guardar dispositivos
    if (usbDevices && usbDevices.length > 0) {
      await processDevices(player._id, usbDevices);
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
    console.error('Error al guardar datos de monitoreo:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Actualizar estado del juego
// @route   POST /api/monitor/game-status
// @access  Público (desde cliente anti-cheat)
const updateGameStatus = async (req, res) => {
  try {
    const { activisionId, channelId, isGameRunning } = req.body;
    
    // Verificar campos obligatorios
    if (!activisionId || channelId === undefined || isGameRunning === undefined) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    
    // Buscar jugador
    const player = await Player.findOne({ activisionId });
    
    if (!player) {
      return res.status(404).json({ message: 'Jugador no encontrado' });
    }
    
    // Actualizar estado
    const previousStatus = player.isGameRunning;
    player.isGameRunning = isGameRunning;
    player.lastSeen = new Date();
    
    await player.save();
    
    // Si cambió el estado, emitir evento
    if (previousStatus !== isGameRunning) {
      const eventType = isGameRunning ? 'game-started' : 'game-stopped';
      
      emitAlert({
        type: eventType,
        playerId: player._id,
        activisionId,
        channelId,
        message: isGameRunning ? 
          `${activisionId} inició el juego` : 
          `${activisionId} cerró el juego`,
        severity: 'info',
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      isGameRunning
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reportar error del cliente
// @route   POST /api/monitor/error
// @access  Público (desde cliente anti-cheat)
const reportClientError = async (req, res) => {
    try {
      const { error, timestamp, activisionId } = req.body;
      
      // Emitir alerta de error
      if (activisionId) {
        const player = await Player.findOne({ activisionId });
        
        if (player) {
          emitAlert({
            type: 'client-error',
            playerId: player._id,
            activisionId,
            channelId: player.currentChannelId,
            message: `Error en cliente: ${activisionId}`,
            details: error,
            severity: 'medium',
            timestamp: timestamp || new Date()
          });
        }
      }
      
      res.json({
        success: true
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // @desc    Marcar jugador como desconectado
  // @route   PUT /api/monitor/disconnect
  // @access  Privado
  const markPlayerDisconnected = async (req, res) => {
    try {
      const { activisionId } = req.body;
      
      if (!activisionId) {
        return res.status(400).json({ message: 'ID de Activision es requerido' });
      }
      
      const player = await Player.findOne({ activisionId });
      
      if (!player) {
        return res.status(404).json({ message: 'Jugador no encontrado' });
      }
      
      // Actualizar estado
      player.isOnline = false;
      player.isGameRunning = false;
      await player.save();
      
      // Emitir notificación
      emitAlert({
        type: 'player-disconnected',
        playerId: player._id,
        activisionId,
        channelId: player.currentChannelId,
        message: `Jugador desconectado: ${activisionId}`,
        severity: 'info',
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: 'Jugador marcado como desconectado'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // @desc    Obtener estadísticas de monitoreo
  // @route   GET /api/monitor/stats
  // @access  Privado
  const getMonitoringStats = async (req, res) => {
    try {
      // Contar jugadores activos
      const onlinePlayers = await Player.countDocuments({ isOnline: true });
      
      // Contar jugadores con juego activo
      const playersInGame = await Player.countDocuments({ 
        isOnline: true, 
        isGameRunning: true 
      });
      
      // Contar dispositivos por nivel de confianza
      const trustedDevices = await Device.countDocuments({ trustLevel: 'Trusted' });
      const unknownDevices = await Device.countDocuments({ trustLevel: 'Unknown' });
      const externalDevices = await Device.countDocuments({ trustLevel: 'External' });
      const suspiciousDevices = await Device.countDocuments({ trustLevel: 'Suspicious' });
      
      // Contar dispositivos por tipo
      const usbDevices = await Device.countDocuments({ 
        type: { $regex: 'usb', $options: 'i' } 
      });
      
      const pciDevices = await Device.countDocuments({ 
        type: { $regex: 'pci', $options: 'i' } 
      });
      
      const monitors = await Device.countDocuments({ isMonitor: true });
      
      // Contar capturas recientes
      const recentScreenshots = await Screenshot.countDocuments({
        capturedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      // Retornar estadísticas
      res.json({
        players: {
          total: await Player.countDocuments(),
          online: onlinePlayers,
          playing: playersInGame
        },
        devices: {
          total: await Device.countDocuments(),
          byTrustLevel: {
            trusted: trustedDevices,
            unknown: unknownDevices,
            external: externalDevices,
            suspicious: suspiciousDevices
          },
          byType: {
            usb: usbDevices,
            pci: pciDevices,
            monitor: monitors,
            other: await Device.countDocuments({
              $and: [
                { type: { $not: { $regex: 'usb', $options: 'i' } } },
                { type: { $not: { $regex: 'pci', $options: 'i' } } },
                { isMonitor: { $ne: true } }
              ]
            })
          }
        },
        screenshots: {
          total: await Screenshot.countDocuments(),
          last24h: recentScreenshots
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // @desc    Obtener datos de monitoreo por ID
  // @route   GET /api/monitor/:id
  // @access  Privado
  const getMonitorDataById = async (req, res) => {
    try {
      const monitorData = await MonitorData.findById(req.params.id)
        .populate('player', 'activisionId currentChannelId');
      
      if (!monitorData) {
        return res.status(404).json({ message: 'Datos de monitoreo no encontrados' });
      }
      
      res.json(monitorData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
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
        } else {
          // Crear nuevo dispositivo
          const newDevice = {
            player: playerId,
            deviceId: deviceInfo.deviceId,
            name: deviceInfo.name || 'Dispositivo desconocido',
            description: deviceInfo.description || '',
            manufacturer: deviceInfo.manufacturer || '',
            type: deviceInfo.type || '',
            status: deviceInfo.status || '',
            connectionStatus: deviceInfo.connectionStatus || 'Connected',
            deviceClass: deviceInfo.deviceClass || '',
            classGuid: deviceInfo.classGuid || '',
            driver: deviceInfo.driver || '',
            hardwareId: deviceInfo.hardwareId || '',
            locationInfo: deviceInfo.locationInfo || '',
            trustLevel: deviceInfo.trustLevel || 'Unknown',
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
          
          await Device.create(newDevice);
          
          // Emitir alerta de nuevo dispositivo si es externo
          if (deviceInfo.trustLevel === 'External' || 
              deviceInfo.trustLevel === 'Suspicious') {
            const player = await Player.findById(playerId);
            
            if (player) {
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
    getMonitorDataById
  };