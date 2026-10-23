const db = require('../db');
const proveedorRepo = require('../repositories/proveedorRepository');
const { normalizeMexicanPhone } = require('../utils/mexicanPhone');

const parseFotos = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
};

// 1. Catálogo público (HU 05 y HU 06)
const obtenerProveedores = async (req, res, next) => {
  try {
    const servicio = typeof req.query.cat === 'string' ? req.query.cat.trim() : '';
    const zona = typeof req.query.zona === 'string' ? req.query.zona.trim() : '';
    const proveedores = await proveedorRepo.buscarProveedores(servicio, zona);
    return res.status(200).json({ exito: true, datos: proveedores });
  } catch (error) { next(error); }
};

// 2. Zonas disponibles para el selector de búsqueda (HU 05)
const obtenerZonas = async (req, res, next) => {
  try {
    const zonas = await proveedorRepo.listarZonasDisponibles();
    return res.status(200).json({ exito: true, datos: zonas });
  } catch (error) { next(error); }
};

// 3. Obtener perfil del proveedor autenticado (HU 03 y HU 08)
const obtenerPerfil = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const result = await db.query(
      `SELECT u.nombre, u.email, p.*
       FROM usuarios u
       LEFT JOIN perfiles_proveedor p ON p.usuario_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [userId]
    );

    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Perfil no encontrado.' });

    const servicios = await proveedorRepo.listarServiciosPorProveedor(userId);

    return res.status(200).json({
      ...row,
      servicio_domicilio: row.servicio_domicilio === null ? null : Boolean(row.servicio_domicilio),
      solo_cotizacion: Boolean(row.solo_cotizacion),
      fotos_trabajo: parseFotos(row.fotos_trabajo),
      servicios,
    });
  } catch (error) { next(error); }
};

// 4. Obtener detalle de perfil público por ID con servicios y reseñas (HU 07 y HU 08)
const obtenerDetallePerfil = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT u.nombre, p.*
       FROM usuarios u
       JOIN perfiles_proveedor p ON p.usuario_id = u.id
       WHERE u.id = ? AND u.estatus = 'activo' LIMIT 1`,
      [id]
    );

    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Proveedor no encontrado.' });

    const [servicios, resenas] = await Promise.all([
      proveedorRepo.listarServiciosPorProveedor(id),
      proveedorRepo.listarResenasPorProveedor(id),
    ]);

    return res.status(200).json({
      exito: true,
      datos: {
        ...row,
        promedio_calificacion: Number(row.promedio_calificacion || 0),
        total_resenas: Number(row.total_resenas || 0),
        servicio_domicilio: row.servicio_domicilio === null ? null : Boolean(row.servicio_domicilio),
        solo_cotizacion: Boolean(row.solo_cotizacion),
        fotos_trabajo: parseFotos(row.fotos_trabajo),
        servicios,
        resenas,
      },
    });
  } catch (error) { next(error); }
};

// 5. Actualizar datos del perfil del proveedor devolviendo el perfil actualizado (HU 03)
const actualizarPerfil = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const {
      nombre,
      nombre_negocio,
      tipo_servicio,
      formacion,
      descripcion,
      servicio_domicilio,
      colonia,
      codigo_postal,
      telefono,
      solo_cotizacion,
      costo_aproximado,
      direccion_maps,
      foto_perfil_url,
      fotos_trabajo,
    } = req.body;

    const telefonoNormalizado = telefono ? normalizeMexicanPhone(telefono) : null;
    if (telefono && !telefonoNormalizado) {
      return res.status(400).json({ error: 'Teléfono mexicano inválido (debe tener 10 dígitos).' });
    }

    await db.transaction(async (tx) => {
      if (nombre) {
        await tx.query(`UPDATE usuarios SET nombre = ? WHERE id = ?`, [String(nombre).trim(), userId]);
      }
      if (telefonoNormalizado) {
        await tx.query(`UPDATE usuarios SET telefono = ? WHERE id = ?`, [telefonoNormalizado, userId]);
      }

      await tx.query(
        `UPDATE perfiles_proveedor
         SET nombre_negocio = ?, tipo_servicio = ?, formacion = ?, descripcion = ?,
             servicio_domicilio = ?, colonia = ?, codigo_postal = ?,
             telefono = COALESCE(?, telefono), solo_cotizacion = ?, costo_aproximado = ?,
             direccion_maps = ?,
             foto_perfil_url = COALESCE(?, foto_perfil_url),
             fotos_trabajo = COALESCE(?, fotos_trabajo)
         WHERE usuario_id = ?`,
        [
          nombre_negocio ? String(nombre_negocio).trim() : null,
          tipo_servicio ? String(tipo_servicio).trim() : null,
          formacion ? String(formacion).trim() : null,
          descripcion ? String(descripcion).trim() : null,
          typeof servicio_domicilio === 'boolean' ? (servicio_domicilio ? 1 : 0) : null,
          colonia ? String(colonia).trim() : null,
          codigo_postal ? String(codigo_postal).trim() : null,
          telefonoNormalizado,
          solo_cotizacion ? 1 : 0,
          solo_cotizacion ? null : Number(costo_aproximado) || 0,
          direccion_maps ? String(direccion_maps).trim() : null,
          foto_perfil_url || null,
          Array.isArray(fotos_trabajo) ? JSON.stringify(fotos_trabajo) : null,
          userId,
        ]
      );
    });

    // Devolvemos el perfil actualizado para que ProfileEdit.jsx actualice su estado correctamente
    const updated = await db.query(
      `SELECT u.nombre, u.email, p.*
       FROM usuarios u
       LEFT JOIN perfiles_proveedor p ON p.usuario_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [userId]
    );
    const row = updated.rows[0];
    const servicios = await proveedorRepo.listarServiciosPorProveedor(userId);

    return res.status(200).json({
      ...row,
      servicio_domicilio: row.servicio_domicilio === null ? null : Boolean(row.servicio_domicilio),
      solo_cotizacion: Boolean(row.solo_cotizacion),
      fotos_trabajo: parseFotos(row.fotos_trabajo),
      servicios,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese teléfono ya está asociado a otra cuenta.' });
    }
    next(error);
  }
};

// 6. Subir fotos de perfil y portafolio devolviendo las URLs generadas (HU 03)
const subirImagenesPerfil = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const fotoPerfil = req.files?.foto_perfil?.[0]?.publicUrl || null;
    const fotosTrabajo = req.files?.fotos_trabajo?.map((f) => f.publicUrl) || [];

    if (fotoPerfil) {
      await db.query(`UPDATE perfiles_proveedor SET foto_perfil_url = ? WHERE usuario_id = ?`, [fotoPerfil, userId]);
    }

    return res.status(200).json({
      mensaje: 'Imágenes subidas correctamente.',
      foto_perfil_url: fotoPerfil,
      fotos_trabajo: fotosTrabajo,
    });
  } catch (error) { next(error); }
};

// 7. CRUD de Catálogo de Servicios del Proveedor (HU 08)
const listarMisServicios = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const servicios = await proveedorRepo.listarServiciosPorProveedor(userId);
    return res.status(200).json({ exito: true, datos: servicios });
  } catch (error) { next(error); }
};

const agregarServicio = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { titulo, descripcion, es_cotizable, precio_referencia } = req.body;
    const precioFinal = es_cotizable ? null : (precio_referencia ?? null);

    const nuevo = await proveedorRepo.crearServicio(userId, {
      titulo,
      descripcion,
      precio_referencia: precioFinal,
    });
    return res.status(201).json({ exito: true, datos: nuevo });
  } catch (error) { next(error); }
};

const editarServicio = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { servicioId } = req.params;
    const { titulo, descripcion, es_cotizable, precio_referencia } = req.body;
    const precioFinal = es_cotizable ? null : (precio_referencia ?? null);

    const actualizado = await proveedorRepo.actualizarServicio(userId, servicioId, {
      titulo,
      descripcion,
      precio_referencia: precioFinal,
    });

    if (!actualizado) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }
    return res.status(200).json({ exito: true, datos: actualizado });
  } catch (error) { next(error); }
};

const borrarServicio = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { servicioId } = req.params;
    const eliminado = await proveedorRepo.eliminarServicio(userId, servicioId);
    if (!eliminado) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }
    return res.status(200).json({ exito: true, mensaje: 'Servicio eliminado correctamente.' });
  } catch (error) { next(error); }
};

module.exports = {
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
};