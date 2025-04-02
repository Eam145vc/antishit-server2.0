const User = require('../models/User');
const { generateToken } = require('../config/auth');

// Registro de usuario con lógica para el primer usuario
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('[DEBUG] Register request received', { name, email });

    if (!name || !email || !password) {
      console.log('[DEBUG] Faltan campos obligatorios en el registro');
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`[DEBUG] Usuario ya registrado con email: ${email}`);
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    // Verificar si es el primer usuario (se convierte en admin)
    const userCount = await User.countDocuments();
    const userRole = userCount === 0 ? 'admin' : (role || 'judge');

    // Crear nuevo usuario
    const user = await User.create({
      name,
      email,
      password,
      role: userRole
    });

    if (user) {
      console.log('[DEBUG] Usuario registrado exitosamente:', user._id);
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } 

    console.log('[DEBUG] Fallo al crear el usuario');
    return res.status(400).json({ message: 'Datos de usuario inválidos' });

  } catch (error) {
    console.error('[ERROR] Error en registro:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Login de usuario
const loginUser = async (req, res) => {
  try {
    console.log('[DEBUG] Login request received');
    console.log('[DEBUG] Request body:', req.body);

    const { email, password } = req.body;
    if (!email || !password) {
      console.log('[DEBUG] Faltan email o password en la petición de login');
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    console.log('[DEBUG] Usuario encontrado:', !!user);

    if (!user) {
      console.log(`[DEBUG] No se encontró usuario con email: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isMatch = await user.matchPassword(password);
    console.log('[DEBUG] Coincidencia de contraseña:', isMatch);

    if (!isMatch) {
      console.log(`[DEBUG] Contraseña inválida para email: ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generateToken(user._id);
    console.log('[DEBUG] Token generado correctamente');

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token
    });
  } catch (error) {
    console.error('[ERROR] Error en login:', error);
    return res.status(500).json({ 
      message: 'Error en el inicio de sesión',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener perfil de usuario
const getUserProfile = async (req, res) => {
  try {
    // req.user ya está disponible desde el middleware auth
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    return res.json(user);
  } catch (error) {
    console.error('[ERROR] Error al obtener perfil:', error);
    return res.status(500).json({ message: 'Error al obtener perfil de usuario' });
  }
};

// Actualizar perfil de usuario
const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Verificar que se proporcionaron datos para actualizar
    if (!name && !email) {
      return res.status(400).json({ message: 'No hay datos para actualizar' });
    }
    
    // Buscar y actualizar usuario
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Actualizar campos si se proporcionaron
    if (name) user.name = name;
    if (email) {
      // Verificar si el nuevo email ya está registrado
      const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
      }
      user.email = email;
    }
    
    // Guardar cambios
    await user.save();
    
    // Retornar usuario actualizado sin contraseña
    const updatedUser = await User.findById(req.user._id).select('-password');
    
    return res.json(updatedUser);
  } catch (error) {
    console.error('[ERROR] Error al actualizar perfil:', error);
    return res.status(500).json({ message: 'Error al actualizar perfil de usuario' });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verificar que se proporcionaron ambas contraseñas
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Se requieren ambas contraseñas' });
    }
    
    // Buscar usuario
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña actual
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }
    
    // Establecer nueva contraseña
    user.password = newPassword;
    await user.save();
    
    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('[ERROR] Error al cambiar contraseña:', error);
    return res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};

const getUsers = async (req, res) => {
  return res.status(501).json({ message: 'Not Implemented' });
};

const deleteUser = async (req, res) => {
  return res.status(501).json({ message: 'Not Implemented' });
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
