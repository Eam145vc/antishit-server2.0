const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rutas
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token sin la contraseña
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
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
