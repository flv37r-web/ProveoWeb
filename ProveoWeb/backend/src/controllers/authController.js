const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { normalizeMexicanPhone } = require('../utils/mexicanPhone');
const { validatePassword } = require('../utils/passwordPolicy');

const parseFotos = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// 1. Registrar nuevo usuario (Cliente o Proveedor)
const registrar = async (req, res, next) => {
  try {
    const { nombre, email, telefono, password, rol } = req.body;
    const nombreLimpio = String(nombre || '').trim();
    const emailLimpio = String(email || '').trim().toLowerCase();
    const rolLimpio = rol === 'proveedor' ? 'proveedor' : 'cliente';

    const telefonoNormalizado = normalizeMexicanPhone(telefono);
    if (!telefonoNormalizado) {
      return res.status(400).json({ error: 'Ingresa un teléfono mexicano válido de 10 dígitos.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'La contraseña debe tener entre 10 y 18 caracteres, incluir una mayúscula, un número y un símbolo.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const nuevoId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO usuarios (id, nombre, email, telefono, password_hash, rol, estatus)
         VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
        [nuevoId, nombreLimpio, emailLimpio, telefonoNormalizado, passwordHash, rolLimpio]
      );

      if (rolLimpio === 'proveedor') {
        await tx.query(
          `INSERT INTO perfiles_proveedor (usuario_id, telefono, fotos_trabajo)
           VALUES (?, ?, ?)`,
          [nuevoId, telefonoNormalizado, '[]']
        );
      }
    });

    return res.status(201).json({
      mensaje: 'Registro exitoso. Inicia sesión para continuar.',
      user: { id: nuevoId, nombre: nombreLimpio, email: emailLimpio, rol: rolLimpio },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo o el teléfono ya están registrados en otra cuenta.' });
    }
    next(error);
  }
};

// 2. Iniciar sesión
const iniciarSesion = async (req, res, next) => {
  try {
    const { email, password, rol } = req.body;
    const emailLimpio = String(email || '').trim().toLowerCase();

    const result = await db.query(
      `SELECT id, nombre, email, telefono, password_hash, rol, estatus
       FROM usuarios WHERE LOWER(TRIM(email)) = ? LIMIT 1`,
      [emailLimpio]
    );

    const usuario = result.rows[0];
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const passwordValido = await bcrypt.compare(String(password || ''), usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (rol && usuario.rol !== rol) {
      return res.status(403).json({
        error: `Esta cuenta está registrada como ${usuario.rol}. Cambia la pestaña de acceso.`,
      });
    }

    const token = jwt.sign(
      { sub: usuario.id, id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Obtener toda la información del perfil (Cliente o Proveedor)
const obtenerMiCuenta = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const userResult = await db.query(
      `SELECT id, nombre, email, telefono, rol, estatus, creado_en
       FROM usuarios WHERE id = ? LIMIT 1`,
      [userId]
    );

    const usuario = userResult.rows[0];
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    let perfilProveedor = null;
    if (usuario.rol === 'proveedor') {
      const provResult = await db.query(
        `SELECT nombre_negocio, tipo_servicio, formacion, descripcion,
                servicio_domicilio, colonia, codigo_postal, foto_perfil_url,
                fotos_trabajo, solo_cotizacion, costo_aproximado, direccion_maps,
                telefono, promedio_calificacion, total_resenas
         FROM perfiles_proveedor WHERE usuario_id = ? LIMIT 1`,
        [userId]
      );
      if (provResult.rows[0]) {
        const p = provResult.rows[0];
        perfilProveedor = {
          ...p,
          servicio_domicilio: p.servicio_domicilio === null ? null : Boolean(p.servicio_domicilio),
          solo_cotizacion: Boolean(p.solo_cotizacion),
          fotos_trabajo: parseFotos(p.fotos_trabajo),
        };
      }
    }

    return res.status(200).json({
      usuario,
      perfil_proveedor: perfilProveedor,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Eliminar por completo la cuenta (Cliente o Proveedor)
const eliminarMiCuenta = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;

    await db.transaction(async (tx) => {
      await tx.query(`DELETE FROM perfiles_proveedor WHERE usuario_id = ?`, [userId]);
      await tx.query(`DELETE FROM usuarios WHERE id = ?`, [userId]);
    });

    return res.status(200).json({ mensaje: 'Tu cuenta y perfil han sido eliminados permanentemente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registrar,
  iniciarSesion,
  obtenerMiCuenta,
  eliminarMiCuenta,
};