// Path: backend/controllers/monitorController.js

const mongoose = require('mongoose');
const Player = require('../models/Player');
const Device = require('../models/Device');
const MonitorData = require('../models/MonitorData');
const Screenshot = require('../models/Screenshot'); 
const { emitMonitorData, emitAlert } = require('../utils/socket');
const { trackHWID } = require('../utils/hwid');

// Función para detectar si un dispositivo es un DMA
const isDMADevice = (deviceInfo) => {
  // Criterios para identificar dispositivos DMA maliciosos
  const dmaSignatures = [
    // Verifica descripción explícita
    deviceInfo.description?.toLowerCase().includes('direct memory access'),
    deviceInfo.description?.toLowerCase().includes('dma controller'),
    
    // Verifica por tipo
    deviceInfo.type?.toLowerCase().includes('dma'),
    
    // Verifica por recursos
    deviceInfo.resources?.dma === "04",
    
    // Nombres comunes de dispositivos DMA maliciosos disfrazados
    deviceInfo.name?.toLowerCase().includes('usb controller') && deviceInfo.description?.toLowerCase().includes('memory'),
    
    // Verifica hardware IDs comunes (algunos chips utilizados en hardware DMA)
    deviceInfo.hardwareId?.toLowerCase().includes('pnp0z00'),
    deviceInfo.hardwareId?.toLowerCase().includes('pnp0c00'),
    
    // Verifica combinación de clases y conexiones sospechosas
    (deviceInfo.deviceClass === 'Unknown' || deviceInfo.deviceClass === 'Other') && 
    deviceInfo.description?.toLowerCase().includes('memory')
  ];
  
  // Si cumple con al menos 1 criterio, considerarlo potencialmente DMA
  return dmaSignatures.some(match => match === true);
};

// Función para sanitizar y normalizar procesos
const sanitizeProcesses = (processes) => {
  if (!Array.isArray(processes)) {
    console.warn('Invalid processes data. Expected an array.');
    return [];
  }

  return processes.map((proc, index) => {
    // Si el proceso es un objeto vacío o no válido, crear uno predeterminado
    if (!proc || typeof proc !== 'object' || Object.keys(proc).length === 0) {
      return {
        name: `Proceso ${index}`,
        pid: index,
        filePath: "N/A",
        fileHash: "N/A",
        fileVersion: "N/A",
        isSigned: false,
        memoryUsage: 0,
        startTime: "N/A",
        signatureInfo: "N/A",
        suspicious: false
      };
    }

    // Datos de proceso normalizados con valores predeterminados explícitos
    return {
      name: proc.name || proc.Name || `Proceso ${index}`,
      // Mapeamos processId (nueva propiedad del cliente) a pid (campo esperado en MongoDB)
      pid: typeof proc.processId === 'number' ? proc.processId : 
           (typeof proc.pid === 'number' ? proc.pid : 
            (typeof proc.Pid === 'number' ? proc.Pid : index)),
      filePath: proc.filePath || proc.FilePath || "N/A",
      fileHash: proc.fileHash || proc.FileHash || "N/A",
      fileVersion: proc.fileVersion || proc.FileVersion || "N/A",
      isSigned: typeof proc.isSigned === 'boolean' ? proc.isSigned : 
                (typeof proc.IsSigned === 'boolean' ? proc.IsSigned : false),
      memoryUsage: typeof proc.memoryUsage === 'number' ? proc.memoryUsage : 
                  (typeof proc.MemoryUsage === 'number' ? proc.MemoryUsage : 0),
      startTime: proc.startTime || proc.StartTime || "N/A",
      signatureInfo: proc.signatureInfo || proc.SignatureInfo || "N/A",
      commandLine: proc.commandLine || proc.CommandLine || "N/A",
      suspicious: typeof proc.suspicious === 'boolean' ? proc.suspicious : 
                 (typeof proc.Suspicious === 'boolean' ? proc.Suspicious : false)
    };
  });
};

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
    const sanitizedDevice = {
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

    // Procesar recursos del dispositivo (DMA, I/O, etc.)
    sanitizedDevice.resources = {};
    
    // Extraer recursos DMA
    if (device.Resources || device.resources) {
      const deviceResources = device.Resources || device.resources;
      
      // Búsqueda de recursos DMA
      if (deviceResources.DMA || deviceResources.dma) {
        sanitizedDevice.resources.dma = deviceResources.DMA || deviceResources.dma;
      }
      
      // Búsqueda de rangos I/O
      if (deviceResources.IORange || deviceResources.ioRange || deviceResources.io_range) {
        sanitizedDevice.resources.ioRange = deviceResources.IORange || deviceResources.ioRange || deviceResources.io_range;
      }
      
      // Búsqueda de otros recursos
      if (deviceResources.Memory || deviceResources.memory) {
        sanitizedDevice.resources.memory = deviceResources.Memory || deviceResources.memory;
      }
    }
    
    // Procesar la información en formato TikTok Properties (como en las imágenes)
    if (device.ResourceSettings || device.resourceSettings) {
      const settings = device.ResourceSettings || device.resourceSettings;
      
      // Buscar configuración de DMA "04"
      if (Array.isArray(settings)) {
        settings.forEach(setting => {
          const type = setting.Type || setting.type;
          const value = setting.Setting || setting.setting || setting.Value || setting.value;
          
          if (type && type.toLowerCase().includes('dma') && value) {
            sanitizedDevice.resources.dma = value;
          }
          
          if (type && type.toLowerCase().includes('i/o') && value) {
            if (!sanitizedDevice.resources.ioRange) {
              sanitizedDevice.resources.ioRange = [];
            }
            sanitizedDevice.resources.ioRange.push(value);
          }
        });
      }
    }

    return sanitizedDevice;
  }).filter(device => device.deviceId); // Eliminar entradas sin deviceId
};

// Función para sanear y normalizar datos de System Info
const sanitizeSystemInfo = (systemInfo) => {
  if (!systemInfo || typeof systemInfo !== 'object') {
    console.warn('Invalid systemInfo data. Expected an object.');
    return {};
  }

  return {
    windowsVersion: systemInfo.WindowsVersion || systemInfo.windowsVersion,
    directXVersion: systemInfo.DirectXVersion || systemInfo.directXVersion,
    gpuDriverVersion: systemInfo.GpuDriverVersion || systemInfo.gpuDriverVersion,
    screenResolution: systemInfo.ScreenResolution || systemInfo.screenResolution,
    windowsUsername: systemInfo.WindowsUsername || systemInfo.windowsUsername,
    computerName: systemInfo.ComputerName || systemInfo.computerName,
    windowsInstallDate: systemInfo.WindowsInstallDate || systemInfo.windowsInstallDate,
    lastBootTime: systemInfo.LastBootTime || systemInfo.lastBootTime,
    firmwareType: systemInfo.FirmwareType || systemInfo.firmwareType,
    languageSettings: systemInfo.LanguageSettings || systemInfo.languageSettings,
    timeZone: systemInfo.TimeZone || systemInfo.timeZone,
    frameworkVersion: systemInfo.FrameworkVersion || systemInfo.frameworkVersion
  };
};

// Función para sanear y normalizar datos de Hardware Info
const sanitizeHardwareInfo = (hardwareInfo) => {
  if (!hardwareInfo || typeof hardwareInfo !== 'object') {
    console.warn('Invalid hardwareInfo data. Expected an object.');
    return {};
  }

  return {
    cpu: hardwareInfo.Cpu || hardwareInfo.cpu,
    gpu: hardwareInfo.Gpu || hardwareInfo.gpu,
    ram: hardwareInfo.Ram || hardwareInfo.ram,
    motherboard: hardwareInfo.Motherboard || hardwareInfo.motherboard,
    storage: hardwareInfo.Storage || hardwareInfo.storage,
    networkAdapters: hardwareInfo.NetworkAdapters || hardwareInfo.networkAdapters,
    audioDevices: hardwareInfo.AudioDevices || hardwareInfo.audioDevices,
    biosVersion: hardwareInfo.BiosVersion || hardwareInfo.biosVersion,
    hardwareId: hardwareInfo.HardwareId || hardwareInfo.hardwareId
  };
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
    
    // Crear un timestamp para seguimiento
    const requestTimestamp = new Date().toISOString();
    
    // Log de datos recibidos para depuración
    console.log(`[${requestTimestamp}] Datos recibidos de ${activisionId}:`);
    console.log(`[${requestTimestamp}] - channelId: ${channelId}`);
    console.log(`[${requestTimestamp}] - isGameRunning: ${isGameRunning}`);
    
    // Log específico de procesos para identificar problemas
    if (!processes) {
      console.log(`[${requestTimestamp}] - processes: UNDEFINED`);
    } else if (!Array.isArray(processes)) {
      console.log(`[${requestTimestamp}] - processes: NO ES UN ARRAY, es tipo ${typeof processes}`);
      if (typeof processes === 'object') {
        console.log(`[${requestTimestamp}] - Claves del objeto processes: ${Object.keys(processes)}`);
      }
    } else {
      console.log(`[${requestTimestamp}] - processes: ${processes.length} procesos`);
      
      // Log de una muestra de procesos para verificar estructura
      if (processes.length > 0) {
        console.log(`[${requestTimestamp}] - Muestra del primer proceso:`);
        console.log(JSON.stringify(processes[0], null, 2));
      }
    }
    
    console.log(`[${requestTimestamp}] - systemInfo presente: ${systemInfo ? 'SÍ' : 'NO'}`);
    console.log(`[${requestTimestamp}] - hardwareInfo presente: ${hardwareInfo ? 'SÍ' : 'NO'}`);
    
    // Verificar campos obligatorios
    if (!activisionId || !channelId) {
      console.log(`[${requestTimestamp}] ERROR: Faltan campos obligatorios`);
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios',
        timestamp: requestTimestamp 
      });
    }
    
    // Asegurar que processes es un array válido incluso si está mal formado
    let validProcesses = [];
    if (Array.isArray(processes)) {
      // Usar sanitizeProcesses para normalizar los procesos
      validProcesses = sanitizeProcesses(processes);
      console.log(`[${requestTimestamp}] Procesos normalizados: ${validProcesses.length}`);
    } else if (processes && typeof processes === 'object') {
      // Es un objeto pero no un array, convertirlo
      console.log(`[${requestTimestamp}] Convirtiendo objeto processes a array`);
      validProcesses = [
        {
          name: "Proceso convertido",
          pid: 0,
          filePath: "Objeto convertido a array",
          fileHash: "N/A",
          fileVersion: "N/A",
          memoryUsage: 0,
          startTime: new Date().toISOString(),
          isSigned: false,
          signatureInfo: `Conversión en ${requestTimestamp}`
        }
      ];
    } else {
      // No es válido, crear array vacío con un proceso marcador
      console.log(`[${requestTimestamp}] Creando array vacío para processes`);
      validProcesses = [
        {
          name: "Sin datos de procesos",
          pid: 0,
          filePath: "Datos no recibidos del cliente",
          fileHash: "N/A",
          fileVersion: "N/A",
          memoryUsage: 0,
          startTime: new Date().toISOString(),
          isSigned: false,
          signatureInfo: `Creado en servidor ${requestTimestamp}`
        }
      ];
    }
    
    console.log(`[${requestTimestamp}] Procesos validados: ${validProcesses.length}`);
    
    // Sanear datos de dispositivos USB
    const sanitizedUsbDevices = sanitizeUsbDevices(usbDevices);
    
    // Sanear datos de System Info y Hardware Info
    const sanitizedSystemInfo = sanitizeSystemInfo(systemInfo);
    const sanitizedHardwareInfo = sanitizeHardwareInfo(hardwareInfo);
    
    console.log('SystemInfo procesado:', sanitizedSystemInfo);
    console.log('HardwareInfo procesado:', sanitizedHardwareInfo);
    
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
        systemInfo: sanitizedSystemInfo || {},
        hardwareInfo: sanitizedHardwareInfo || {}
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
          ...sanitizedSystemInfo
        };
      }
      
      // Actualizar info de hardware si existe
      if (hardwareInfo) {
        player.hardwareInfo = {
          ...player.hardwareInfo,
          ...sanitizedHardwareInfo
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
      processes: validProcesses,
      usbDevices: sanitizedUsbDevices,
      networkConnections: networkConnections || [],
      loadedDrivers: loadedDrivers || []
    });
    
    console.log(`[${requestTimestamp}] MonitorData creado con ID: ${monitorData._id}`);
    
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
      id: monitorData._id,
      timestamp: requestTimestamp,
      processCount: validProcesses.length
    });
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    console.error(`[${errorTimestamp}] ERROR en saveMonitorData: ${error.message}`);
    console.error(error.stack);
    
    // Log de datos problemáticos para depuración
    try {
      if (typeof usbDevices !== 'undefined') {
        console.log('Datos USB problemáticos:', JSON.stringify(usbDevices, null, 2));
      }
    } catch (logError) {
      console.error('Error al imprimir datos USB problemáticos:', logError.message);
    }
    
    res.status(500).json({ 
      message: 'Error al guardar datos de monitoreo', 
      details: error.message,
      timestamp: errorTimestamp,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
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
    console.error('Error al actualizar estado del juego:', error);
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
    console.error('Error al reportar error del cliente:', error);
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
    console.error('Error al marcar jugador como desconectado:', error);
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
    console.error('Error al obtener estadísticas de monitoreo:', error);
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
    console.error('Error al obtener datos de monitoreo:', error);
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
  getMonitorDataById,
  setupDisconnectionCheck
};
