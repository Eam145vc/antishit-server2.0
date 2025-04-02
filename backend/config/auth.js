const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });

  console.log('[DEBUG] Token generado:', token); // ✅ Ahora sí está definido

  return token;
};

module.exports = { generateToken };
