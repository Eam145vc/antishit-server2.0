const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  registerUser, 
  getUserProfile, 
  getUsers 
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

// Asegúrate de que cada ruta tenga un callback definido
router.post('/login', (req, res) => loginUser(req, res));
router.post('/register', protect, admin, (req, res) => registerUser(req, res));
router.get('/profile', protect, (req, res) => getUserProfile(req, res));
router.get('/users', protect, admin, (req, res) => getUsers(req, res));

module.exports = router;
