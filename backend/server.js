require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');
const socketSetup = require('./utils/socket');

// Conectar a la base de datos
connectDB();

// Inicializar app
const app = express();

// Middleware CORS mejorado
app.use(cors({
  origin: ['https://anti5-0-site.onrender.com', 'http://localhost:3000'], // Dominios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// PRIMERO: Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/screenshots', require('./routes/screenshots'));
app.use('/api/monitor', require('./routes/monitor'));
app.use('/api/tournaments', require('./routes/tournaments'));

// SEGUNDO: Manejador específico para 404 en rutas de API
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// TERCERO: Ruta de estado para Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// CUARTO: Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  // Cambiar esta línea para usar una ruta absoluta o verificar primero si existe
  const staticPath = path.resolve(__dirname, '../frontend/dist');
  
  // Verificar si la ruta existe y loggear mensajes útiles
  try {
    if (fs.existsSync(staticPath)) {
      console.log('✅ Ruta de archivos estáticos encontrada:', staticPath);
      app.use(express.static(staticPath));
      
      // Cualquier ruta que no sea /api redirige al index.html
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(staticPath, 'index.html'));
        }
      });
    } else {
      console.error('❌ No se encontró la ruta de archivos estáticos:', staticPath);
      console.log('🔍 Intentando servir solo la API');
      
      // Si no hay archivos estáticos, al menos responde con un mensaje
      app.get('/', (req, res) => {
        res.send('API Anti-Cheat funcionando. La interfaz de usuario no está disponible.');
      });
    }
  } catch (error) {
    console.error('❌ Error al verificar ruta de archivos estáticos:', error);
  }
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
