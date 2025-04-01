require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./config/db');
const socketSetup = require('./utils/socket');

// Conectar a la base de datos
connectDB();

// Inicializar app
const app = express();

// Middleware
app.use(cors());
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

// Ruta de estado para Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(staticPath));
  
  // Cualquier ruta que no sea /api redirige al index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(staticPath, 'index.html'));
    }
  });
}

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
const PORT = process.env.PORT || 5000;
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
