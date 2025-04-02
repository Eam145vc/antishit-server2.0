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

// Ruta de registro sin autenticación para el primer usuario
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas protegidas
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, changePassword);

// Rutas de administración
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;
