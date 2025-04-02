const User = require('../models/User');
const { generateToken } = require('../config/auth');

// Registro de usuario con lógica para primer usuario
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const userCount = await User.countDocuments();
    const userRole = userCount === 0 ? 'admin' : (role || 'judge');

    const user = await User.create({
      name,
      email,
      password,
      role: userRole
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

// Login de usuario
const loginUser = async (req, res) => {
  try {
    console.log('[DEBUG] Login request received');
    console.log('[DEBUG] Request body:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[DEBUG] Missing email or password');
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const user = await User.findOne({ email });
    console.log('[DEBUG] User found:', !!user);

    if (!user) {
      console.log(`[DEBUG] No user found with email: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await user.matchPassword(password);
    console.log('[DEBUG] Password match:', isMatch);

    if (!isMatch) {
      console.log(`[DEBUG] Invalid password for email: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = generateToken(user._id);
    console.log('[DEBUG] Token generated successfully');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token
    });
  } catch (error) {
    console.error('[ERROR] Login error:', error);
    res.status(500).json({ 
      message: 'Error en el inicio de sesión',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener perfil de usuario
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar perfil de usuario
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.name = req.body.name || user.name;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener usuarios (solo admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar usuario (solo admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUsers,
  deleteUser
};
