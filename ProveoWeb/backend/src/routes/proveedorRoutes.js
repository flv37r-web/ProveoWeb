const express = require('express');
const router = express.Router();
const {
  obtenerProveedores,
  obtenerZonas,
  obtenerPerfil,
  obtenerDetallePerfil,
  actualizarPerfil,
  subirImagenesPerfil,
  listarMisServicios,
  agregarServicio,
  editarServicio,
  borrarServicio,
} = require('../controllers/proveedorController');

const { verifyToken, checkRole } = require('../middlewares/auth');
const uploadProfile = require('../middlewares/profileImageUpload');
const validarEsquema = require('../middlewares/validate');
const { perfilProveedorSchema, servicioSchema } = require('../validaciones/proveedor.schema');

// Rutas públicas (HU 05, HU 06)
router.get('/buscar', obtenerProveedores);
router.get('/zonas', obtenerZonas);

// Rutas protegidas del proveedor (HU 03 y HU 08)
router.get('/perfil', verifyToken, checkRole(['proveedor']), obtenerPerfil);
router.put('/perfil', verifyToken, checkRole(['proveedor']), validarEsquema(perfilProveedorSchema), actualizarPerfil);
router.post('/perfil/imagenes', verifyToken, checkRole(['proveedor']), uploadProfile, subirImagenesPerfil);

// CRUD del catálogo de servicios (HU 08)
router.get('/servicios/mios', verifyToken, checkRole(['proveedor']), listarMisServicios);
router.post('/servicios', verifyToken, checkRole(['proveedor']), validarEsquema(servicioSchema), agregarServicio);
router.put('/servicios/:servicioId', verifyToken, checkRole(['proveedor']), validarEsquema(servicioSchema), editarServicio);
router.delete('/servicios/:servicioId', verifyToken, checkRole(['proveedor']), borrarServicio);

// Detalle público por ID (HU 07) - Siempre al final para no interceptar rutas fijas
router.get('/:id', obtenerDetallePerfil);

module.exports = router;