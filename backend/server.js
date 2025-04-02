require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const socketSetup = require('./utils/socket');
const { setupDisconnectionCheck } = require('./controllers/monitorController');

// Inicializar app
const app = express();

// Ruta de health check (debe ir antes de cualquier otro middleware)
app.get('/', (req, res) => {
  res.status(200).send('API Anti-Cheat funcionando correctamente');
});

// Configuración de CORS básica
app.use(cors());

// Middleware para logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Parsers
app.use(express.json({ limit: '10mb' }));  // Reducido para mejorar rendimiento
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/screenshots', require('./routes/screenshots'));
app.use('/api/monitor', require('./routes/monitor'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/alerts', require('./routes/alerts'));

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de manejo de errores simplificado
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Error del servidor' });
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
