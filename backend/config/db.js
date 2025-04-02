const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Configurar más opciones para mejorar la conexión
    mongoose.set('debug', process.env.NODE_ENV === 'development');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Timeout de 10 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
    });
    
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    console.log(`Base de datos: ${conn.connection.db.databaseName}`);
    
    // Manejar eventos de conexión
    mongoose.connection.on('connected', () => {
      console.log('Mongoose conectado exitosamente');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`Error de conexión de Mongoose: ${err.message}`);
      // Intentar reconectar automáticamente
      setTimeout(connectDB, 5000);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Conexión de Mongoose perdida');
      // Intentar reconectar automáticamente
      setTimeout(connectDB, 5000);
    });

    return conn;
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    console.error('Detalles del error:', error);
    
    // Intentar reconectar
    setTimeout(connectDB, 5000);
    
    process.exit(1);
  }
};

module.exports = { connectDB };
