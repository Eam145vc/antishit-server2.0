const mongoose = require('mongoose');

const connectDB = async () => {
  // Opciones básicas de conexión
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    console.log(`Base de datos: ${conn.connection.db.databaseName}`);
    return conn;
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error.message}`);
    // No llamamos a process.exit() para permitir que el servidor siga funcionando
    throw error;
  }
};

module.exports = { connectDB };
