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

// Rutas simplificadas sin wrappers adicionales
router.post('/login', loginUser);
router.post('/register', protect, admin, registerUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, changePassword);
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;
