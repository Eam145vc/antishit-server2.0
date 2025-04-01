const User = require('../models/User');
const { generateToken } = require('../config/auth');

// Validaciones adicionales en los controladores
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones más robustas
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validaciones más robustas
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Usuario ya existe' });
    }

    // Crear nuevo usuario
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'judge'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: error.message });
  }
};

// Resto de los controladores permanecen igual
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Otros controladores (updateUserProfile, changePassword, getUsers, deleteUser) 
// permanecen igual, con un mejor manejo de errores y validaciones

module.exports = {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUsers,
  deleteUser
};
