const jwt = require('jsonwebtoken');

// 1. Guardia que verifica que el gafete (Token) sea válido
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('La variable JWT_SECRET no está configurada.');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.sub, rol: decoded.rol }; // Guardamos los datos del usuario en la petición
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// 2. Guardia que verifica si tienes el tipo de cuenta correcta (Ej. 'proveedor')
const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para acceder a esta ruta.' });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };