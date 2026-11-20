// Actualizaciuon Google Auth.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');
const googleAuthService = require('../services/googleAuthService');

const parseFotos = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// 1. Registrar o iniciar sesión con Google
const autenticarConGoogle = async (req, res, next) => {
  try {
    const { idToken, rol } = req.body;

    let googleUser;
    try {
      googleUser = await googleAuthService.verifyGoogleIdToken(idToken);
    } catch {
      return res.status(401).json({ error: 'Token de Google inválido o expirado.' });
    }

    if (!googleUser.emailVerified) {
      return res.status(401).json({
        error: 'Tu cuenta de Google debe tener el correo electrónico verificado.',
      });
    }

    const result = await db.query(
      `SELECT id, nombre, email, telefono, google_id, rol, estatus
       FROM usuarios
       WHERE google_id = ? OR LOWER(TRIM(email)) = ?
       LIMIT 1`,
      [googleUser.googleId, googleUser.email]
    );

    let usuario = result.rows[0];
    let statusCode = 200;

    if (usuario) {
      if (usuario.estatus !== 'activo') {
        return res.status(403).json({ error: 'Esta cuenta no está activa.' });
      }

      if (rol && usuario.rol !== rol) {
        return res.status(403).json({
          error: `Esta cuenta está registrada como ${usuario.rol}. Cambia la pestaña de acceso.`,
        });
      }

      if (!usuario.google_id) {
        await db.query(
          `UPDATE usuarios SET google_id = ? WHERE id = ?`,
          [googleUser.googleId, usuario.id]
        );
      }
    } else {
      const nuevoId = crypto.randomUUID();
      const rolLimpio = rol === 'proveedor' ? 'proveedor' : 'cliente';

      await db.transaction(async (tx) => {
        await tx.query(
          `INSERT INTO usuarios (id, nombre, email, google_id, telefono, password_hash, rol, estatus)
           VALUES (?, ?, ?, ?, NULL, NULL, ?, 'activo')`,
          [nuevoId, googleUser.nombre, googleUser.email, googleUser.googleId, rolLimpio]
        );

        if (rolLimpio === 'proveedor') {
          await tx.query(
            `INSERT INTO perfiles_proveedor (usuario_id, telefono, fotos_trabajo)
             VALUES (?, NULL, ?)`,
            [nuevoId, '[]']
          );
        }
      });

      usuario = {
        id: nuevoId,
        nombre: googleUser.nombre,
        email: googleUser.email,
        telefono: null,
        rol: rolLimpio,
      };
      statusCode = 201;
    }

    const token = jwt.sign(
      { sub: usuario.id, id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(statusCode).json({
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
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'Esta cuenta de Google o correo ya está registrada.',
      });
    }
    next(error);
  }
};

// 2. Obtener toda la información del perfil (Cliente o Proveedor)
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

// 3. Eliminar por completo la cuenta (Cliente o Proveedor)
const eliminarMiCuenta = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;

    await db.transaction(async (tx) => {
      await tx.query(`DELETE FROM perfiles_proveedor WHERE usuario_id = ?`, [userId]);
      await tx.query(`DELETE FROM usuarios WHERE id = ?`, [userId]);
    });

    return res.status(200).json({
      mensaje: 'Tu cuenta y perfil han sido eliminados permanentemente.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  autenticarConGoogle,
  obtenerMiCuenta,
  eliminarMiCuenta,
};