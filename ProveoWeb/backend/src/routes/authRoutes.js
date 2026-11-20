const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/auth');
const validarEsquema = require('../middlewares/validate');
const { googleAuthSchema } = require('../validaciones/auth.schema');
const {
  autenticarConGoogle,
  obtenerMiCuenta,
  eliminarMiCuenta,
} = require('../controllers/authController');

// Ruta pública de autenticación con Google
router.post('/google', validarEsquema(googleAuthSchema), autenticarConGoogle);

// Rutas protegidas para ver y eliminar el perfil (Clientes y Proveedores)
router.get('/mi-cuenta', verifyToken, obtenerMiCuenta);
router.delete('/mi-cuenta', verifyToken, eliminarMiCuenta);

module.exports = router;

// Actualizacion Google Auth.