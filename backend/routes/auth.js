const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getUserProfile, getUsers } = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

router.post('/login', loginUser);
router.post('/register', protect, admin, registerUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, admin, getUsers);

module.exports = router;