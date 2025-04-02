require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const socketSetup = require('./utils/socket');

// Conectar a la base de datos
connectDB();

// Inicializar app
const app = express();

// Configuración de CORS más detallada y permisiva
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://anti5-0-site.onrender.com', 
      'http://localhost:3000',
      'https://anti5-0.onrender.com',
      /\.onrender\.com$/
    ];
    
    // Permitir solicitudes sin origen (como las de Postman o herramientas de desarrollo)
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? origin === allowed : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware de depuración
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming ${req.method} request to ${req.path}`);
  console.log('[DEBUG] Headers:', req.headers);
  next();
});

app.use(cors(corsOptions));

// Middleware para logging de solicitudes
app.use(morgan('dev'));

// Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/screenshots', require('./routes/screenshots'));
app.use('/api/monitor', require('./routes/monitor'));
app.use('/api/tournaments', require('./routes/tournaments'));

// Middleware para manejar rutas no encontradas
app.use((req, res, next) => {
  console.log(`[ERROR] Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: 'Ruta no encontrada', 
    path: req.path,
    method: req.method
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('[ERROR] Error en el servidor:', err);
  res.status(500).json({
    message: 'Algo salió mal en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Ruta raíz para verificación
app.get('/', (req, res) => {
  res.send('API Anti-Cheat funcionando correctamente');
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log('Entorno:', process.env.NODE_ENV || 'development');
});

// Configurar Socket.io
socketSetup(server);

module.exports = server;
