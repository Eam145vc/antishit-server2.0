const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });
};

module.exports = { generateToken };
console.log('[DEBUG] JWT_SECRET usado:', process.env.JWT_SECRET);
