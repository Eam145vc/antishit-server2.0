require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const socketSetup = require('./utils/socket');
const path = require('path');

// Rutas
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const deviceRoutes = require('./routes/devices');
const screenshotRoutes = require('./routes/screenshots');
const monitorRoutes = require('./routes/monitor');
const tournamentRoutes = require('./routes/tournaments');

// Inicializar app
const app = express();

// Conectar a la base de datos
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Definir rutas
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/screenshots', screenshotRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/tournaments', tournamentRoutes);

// Ruta de estado para Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
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
