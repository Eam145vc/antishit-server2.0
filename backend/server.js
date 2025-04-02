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

// Middleware CORS mejorado
app.use(cors({
  origin: [
    'https://anti5-0-site.onrender.com', 
    'http://localhost:3000',
    'https://anti5-0.onrender.com',
    /\.onrender\.com$/  // Permitir subdominios de Render
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/screenshots', require('./routes/screenshots'));
app.use('/api/monitor', require('./routes/monitor'));
app.use('/api/tournaments', require('./routes/tournaments'));

// Manejador específico para 404 en rutas de API
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Ruta de estado para Render con más información
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusMessage = 
      dbStatus === 0 ? 'disconnected' :
      dbStatus === 1 ? 'connected' :
      dbStatus === 2 ? 'connecting' :
      dbStatus === 3 ? 'disconnecting' : 'unknown';

    res.status(200).json({ 
      status: 'ok', 
      database: {
        status: dbStatusMessage,
        host: mongoose.connection.host
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('API Anti-Cheat funcionando correctamente');
});

// Manejo de errores mejorado
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({ 
    error: true, 
    message: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log('Entorno:', process.env.NODE_ENV || 'development');
});

// Configurar Socket.io
socketSetup(server);

// Manejo de errores no controlados
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Cerrando servidor...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server; // Para pruebas
