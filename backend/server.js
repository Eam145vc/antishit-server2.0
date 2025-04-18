require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path'); // Asegúrate de que path esté importado
const { connectDB } = require('./config/db');
const socketSetup = require('./utils/socket');
const { setupDisconnectionCheck } = require('./controllers/monitorController');

// Inicializar app
const app = express();

// Ruta de health check (debe ir antes de cualquier otro middleware)
app.get('/', (req, res) => {
  res.status(200).send('API Anti-Cheat funcionando correctamente');
});

// Configuración de CORS mejorada
app.use(cors({
  origin: [
    'https://anti5-0-site.onrender.com', 
    'http://localhost:3000', 
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware para logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Parsers
app.use(express.json({ limit: '10mb' }));  // Reducido para mejorar rendimiento
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta de compatibilidad para el cliente que envía a /api/screenshot
app.post('/api/screenshot', (req, res) => {
  // Redirigir a la ruta correcta
  req.url = '/api/screenshots';
  app.handle(req, res);
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/screenshots', require('./routes/screenshots'));
app.use('/api/monitor', require('./routes/monitor')); // Asegúrate de que esta ruta esté correcta
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/alerts', require('./routes/alerts'));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Ruta catch-all para redirigir todas las solicitudes no API al frontend
app.get('*', (req, res, next) => {
  // Excluir peticiones a la API
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  } else {
    next();
  }
});

// Middleware para rutas API no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Ruta API no encontrada' });
});

// Middleware de manejo de errores simplificado
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Iniciar servidor antes de conectar a la base de datos
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  
  // Conectar a MongoDB después de que el servidor esté funcionando
  connectDB()
    .then(() => {
      console.log('MongoDB conectado correctamente');
      
      // Configurar Socket.io solo después de la conexión exitosa a DB
      socketSetup(server);
      
      // Configurar verificación automática de desconexiones
      setupDisconnectionCheck();
      
      console.log('Aplicación lista para recibir solicitudes');
    })
    .catch(err => {
      console.error('Error al conectar a MongoDB:', err.message);
      // No cerramos el servidor, permitimos que siga funcionando
    });
});

// Manejo de señales para cierre limpio
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
  });
});

module.exports = server;
