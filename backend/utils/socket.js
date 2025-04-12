// utils/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configurar Socket.io
const socketSetup = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: ['https://anti5-0-site.onrender.com', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization']
    }
  });

  // Middleware para autenticación
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Autenticación requerida'));
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Usuario no encontrado'));
      }

      // Guardar información del usuario en el socket
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Token inválido'));
    }
  });

  // Manejo de conexiones
  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.user.name} (${socket.id})`);

    // Unirse a sala de torneo si está especificado
    if (socket.handshake.query.tournamentId) {
      socket.join(`tournament:${socket.handshake.query.tournamentId}`);
      console.log(`${socket.user.name} se unió al torneo ${socket.handshake.query.tournamentId}`);
    }

    // Unirse a salas de canales si están especificados
    if (socket.handshake.query.channels) {
      const channels = socket.handshake.query.channels.split(',');
      channels.forEach(channel => {
        socket.join(`channel:${channel}`);
        console.log(`${socket.user.name} se unió al canal ${channel}`);
      });
    }

    // Manejar suscripción a canales adicionales
    socket.on('join-channel', (channelId) => {
      socket.join(`channel:${channelId}`);
      console.log(`${socket.user.name} se unió al canal ${channelId}`);
    });

    // Manejar desuscripción de canales
    socket.on('leave-channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
      console.log(`${socket.user.name} salió del canal ${channelId}`);
    });

    // Manejar solicitud de captura remota
    socket.on('request-screenshot', ({ activisionId, channelId, requestedBy }) => {
      // Mejorado: Logging detallado para debug
      console.log(`[SOCKET] ${socket.user.name} solicitó captura para ${activisionId} en canal ${channelId}`);

      // Almacenar la solicitud en la caché global
      const key = `${activisionId}-${channelId}`;
      if (!global.screenshotRequests) {
        global.screenshotRequests = {};
      }
      
      global.screenshotRequests[key] = {
        timestamp: new Date(),
        requestedBy: socket.user.name,
        expireAt: Date.now() + 120000 // Expires in 2 minutes
      };
      
      console.log(`[SOCKET] Almacenada solicitud de captura para ${activisionId} en canal ${channelId}`);

      // Enviar el evento a todos los clientes en ese canal específico
      io.to(`channel:${channelId}`).emit('take-screenshot', {
        requestedBy: requestedBy || socket.user.name,
        activisionId,
        timestamp: new Date()
      });

      // Emitir una alerta para notificar a otros jueces
      io.to(`channel:${channelId}`).emit('new-alert', {
        type: 'screenshot-request',
        message: `Captura solicitada para ${activisionId}`,
        activisionId,
        channelId,
        requestedBy: requestedBy || socket.user.name,
        severity: 'info',
        timestamp: new Date()
      });
    });

    // Manejar cambio de canal para jugador
    socket.on('change-player-channel', ({ activisionId, fromChannel, toChannel, changedBy }) => {
      io.to(`channel:${fromChannel}`).emit('player-channel-changed', {
        activisionId,
        fromChannel,
        toChannel,
        changedBy: changedBy || socket.user.name,
        timestamp: new Date()
      });
      
      // Notificar al nuevo canal también
      io.to(`channel:${toChannel}`).emit('player-channel-changed', {
        activisionId,
        fromChannel,
        toChannel,
        changedBy: changedBy || socket.user.name,
        timestamp: new Date()
      });
      
      console.log(`${socket.user.name} movió a ${activisionId} del canal ${fromChannel} al ${toChannel}`);
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.user.name}`);
    });
  });

  // Exponer io para poder usarlo en otros archivos
  global.io = io;
  
  return io;
};

// Función para emitir datos de monitoreo a los canales correspondientes
const emitMonitorData = (data) => {
  if (!global.io) return;

  // Log para depuración
  console.log(`Emitiendo datos de monitoreo para ${data.activisionId}:`, 
    JSON.stringify({
      activisionId: data.activisionId,
      channelId: data.channelId,
      isOnline: data.isOnline,
      processCount: data.processes ? data.processes.length : 'none',
      timestamp: new Date()
    }));

  // Emitir al canal específico
  global.io.to(`channel:${data.channelId}`).emit('monitor-update', data);
  
  // Emitir a todos los canales si el jugador cambió de estado (conectado/desconectado)
  if (data.statusChanged) {
    global.io.emit('player-status-changed', {
      activisionId: data.activisionId,
      channelId: data.channelId,
      isOnline: data.isOnline,
      timestamp: new Date()
    });
  }
};

// Función para emitir alerta
const emitAlert = (alert) => {
  if (!global.io) return;

  // Log para depuración
  console.log(`Emitiendo alerta: ${alert.message}`);

  // Emitir a canal específico
  global.io.to(`channel:${alert.channelId}`).emit('new-alert', alert);
  
  // Si es alerta crítica, emitir a todos
  if (alert.severity === 'high') {
    global.io.emit('critical-alert', alert);
  }
};

module.exports = socketSetup;
module.exports.emitMonitorData = emitMonitorData;
module.exports.emitAlert = emitAlert;
