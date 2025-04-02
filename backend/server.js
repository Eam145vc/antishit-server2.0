require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const socketSetup = require('./utils/socket');

// Inicializar app
const app = express();

// Configuración de CORS simplificada
app.use(cors());

// Middleware para logging de solicitudes - solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

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
  res.status(404).json({ 
    message: 'Ruta no encontrada', 
    path: req.path,
    method: req.method
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({
    message: 'Algo salió mal en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
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
  
  // Importante: indicar que la aplicación está lista
  if (process.env.NODE_ENV === 'production') {
    console.log('Aplicación lista para recibir solicitudes');
  }
});

// Configurar Socket.io
socketSetup(server);

// Conectar a la base de datos después de iniciar el servidor
connectDB().catch(err => {
  console.error('Error inicial al conectar a MongoDB:', err);
  // No llamamos a process.exit aquí para permitir que el servidor siga funcionando
});

module.exports = server;
