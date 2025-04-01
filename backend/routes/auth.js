const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  registerUser, 
  getUserProfile, 
  updateUserProfile,
  changePassword,
  getUsers,
  deleteUser 
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

// Añadir manejo de errores y logging
router.post('/login', (req, res, next) => {
  try {
    console.log('Login route hit', req.body);
    if (typeof loginUser !== 'function') {
      return res.status(500).json({ message: 'Controlador de login no definido' });
    }
    loginUser(req, res, next);
  } catch (error) {
    console.error('Error en ruta de login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/register', protect, admin, (req, res, next) => {
  try {
    console.log('Register route hit', req.body);
    if (typeof registerUser !== 'function') {
      return res.status(500).json({ message: 'Controlador de registro no definido' });
    }
    registerUser(req, res, next);
  } catch (error) {
    console.error('Error en ruta de registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, changePassword);
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;
