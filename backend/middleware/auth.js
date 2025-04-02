const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rutas
const protect = async (req, res, next) => {
  console.log('[DEBUG] Authorization Header:', req.headers.authorization);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      console.log('[DEBUG] Token recibido:', token);

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[DEBUG] Token decodificado:', decoded);

      // Buscar usuario en la base de datos
      req.user = await User.findById(decoded.id).select('-password');
      console.log('[DEBUG] Usuario autenticado:', req.user ? req.user.email : 'No encontrado');

      if (!req.user) {
        console.log('[ERROR] Usuario no encontrado con el token proporcionado.');
        return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
      }

      next();
    } catch (error) {
      console.error('[ERROR] Problema con la autenticación:', error);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expirado, por favor inicia sesión de nuevo' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token inválido' });
      } else {
        return res.status(401).json({ message: 'No autorizado, error desconocido' });
      }
    }
  } else {
    console.log('[DEBUG] No se encontró token en la petición.');
    return res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};

// Middleware para verificar rol de administrador
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado, usuario no autenticado' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado como administrador' });
  }

  next();
};

module.exports = { protect, admin };
