const express = require('express');
const router = express.Router();
const {
  registrar,
  iniciarSesion,
  obtenerMiCuenta,
  eliminarMiCuenta,
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const validarEsquema = require('../middlewares/validate');
const { registroSchema, loginSchema } = require('../validaciones/auth.schema');

// Rutas públicas
router.post('/registro', validarEsquema(registroSchema), registrar);
router.post('/login', validarEsquema(loginSchema), iniciarSesion);

// Rutas protegidas para ver y eliminar el perfil (Clientes y Proveedores)
router.get('/mi-cuenta', verifyToken, obtenerMiCuenta);
router.delete('/mi-cuenta', verifyToken, eliminarMiCuenta);

module.exports = router;