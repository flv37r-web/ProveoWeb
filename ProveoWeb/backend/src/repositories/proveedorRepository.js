const crypto = require('crypto');
const db = require('../db');

const parseFotos = (fotos) => {
  if (Array.isArray(fotos)) return fotos;
  if (typeof fotos === 'string') {
    try { return JSON.parse(fotos); } catch { return []; }
  }
  return [];
};

// HU 05 y HU 06: Búsqueda con filtro por categoría y zona/código postal
const buscarProveedores = async (servicio = '', zona = '') => {
  const result = await db.query(
    `SELECT p.usuario_id AS proveedor_id, u.nombre, p.nombre_negocio,
            p.tipo_servicio, p.formacion, p.descripcion, p.servicio_domicilio,
            p.colonia, p.codigo_postal, p.foto_perfil_url, p.fotos_trabajo,
            p.solo_cotizacion, p.costo_aproximado, p.direccion_maps,
            p.telefono, p.promedio_calificacion, p.total_resenas
     FROM perfiles_proveedor p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE u.estatus = 'activo'
       AND p.tipo_servicio IS NOT NULL
       AND p.tipo_servicio <> ''
       AND (? = '' OR p.tipo_servicio LIKE ? OR p.nombre_negocio LIKE ? OR p.descripcion LIKE ?)
       AND (? = '' OR p.colonia LIKE ? OR p.codigo_postal LIKE ?)
     ORDER BY p.promedio_calificacion DESC, p.total_resenas DESC, u.creado_en DESC`,
    [
      servicio, `%${servicio}%`, `%${servicio}%`, `%${servicio}%`,
      zona, `%${zona}%`, `%${zona}%`
    ]
  );

  return result.rows.map((row) => ({
    ...row,
    promedio_calificacion: Number(row.promedio_calificacion || 0),
    total_resenas: Number(row.total_resenas || 0),
    servicio_domicilio: row.servicio_domicilio === null ? null : Boolean(row.servicio_domicilio),
    solo_cotizacion: row.solo_cotizacion === null ? null : Boolean(row.solo_cotizacion),
    fotos_trabajo: parseFotos(row.fotos_trabajo),
  }));
};

// HU 05: Obtener zonas disponibles para el selector
const listarZonasDisponibles = async () => {
  const result = await db.query(
    `SELECT DISTINCT colonia, codigo_postal
     FROM perfiles_proveedor p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE u.estatus = 'activo'
       AND colonia IS NOT NULL AND colonia <> ''
       AND codigo_postal IS NOT NULL AND codigo_postal <> ''
     ORDER BY colonia ASC`
  );
  return result.rows;
};

// HU 08: Listar servicios de un proveedor
const listarServiciosPorProveedor = async (proveedorId) => {
  const result = await db.query(
    `SELECT id, proveedor_id, titulo, descripcion, precio_referencia
     FROM servicios
     WHERE proveedor_id = ?
     ORDER BY titulo ASC`,
    [proveedorId]
  );
  return result.rows.map((s) => ({
    ...s,
    precio_referencia: s.precio_referencia !== null ? Number(s.precio_referencia) : null,
    es_cotizable: s.precio_referencia === null
  }));
};

// HU 08: Crear un servicio en el catálogo del proveedor
const crearServicio = async (proveedorId, { titulo, descripcion, precio_referencia }) => {
  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO servicios (id, proveedor_id, titulo, descripcion, precio_referencia)
     VALUES (?, ?, ?, ?, ?)`,
    [id, proveedorId, titulo.trim(), descripcion ? descripcion.trim() : null, precio_referencia]
  );
  return {
    id,
    proveedor_id: proveedorId,
    titulo: titulo.trim(),
    descripcion: descripcion ? descripcion.trim() : null,
    precio_referencia: precio_referencia !== null ? Number(precio_referencia) : null,
    es_cotizable: precio_referencia === null
  };
};

// HU 08: Actualizar un servicio del proveedor
const actualizarServicio = async (proveedorId, servicioId, { titulo, descripcion, precio_referencia }) => {
  await db.query(
    `UPDATE servicios
     SET titulo = ?, descripcion = ?, precio_referencia = ?
     WHERE id = ? AND proveedor_id = ?`,
    [titulo.trim(), descripcion ? descripcion.trim() : null, precio_referencia, servicioId, proveedorId]
  );
  const result = await db.query(
    `SELECT id, proveedor_id, titulo, descripcion, precio_referencia
     FROM servicios WHERE id = ? AND proveedor_id = ? LIMIT 1`,
    [servicioId, proveedorId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    precio_referencia: row.precio_referencia !== null ? Number(row.precio_referencia) : null,
    es_cotizable: row.precio_referencia === null
  };
};

// HU 08: Eliminar un servicio del proveedor
const eliminarServicio = async (proveedorId, servicioId) => {
  const result = await db.query(
    `SELECT id FROM servicios WHERE id = ? AND proveedor_id = ? LIMIT 1`,
    [servicioId, proveedorId]
  );
  if (!result.rows[0]) return false;
  await db.query(`DELETE FROM servicios WHERE id = ? AND proveedor_id = ?`, [servicioId, proveedorId]);
  return true;
};

// HU 07: Listar reseñas públicas de un proveedor
const listarResenasPorProveedor = async (proveedorId) => {
  const result = await db.query(
    `SELECT r.id, r.calificacion, r.comentario, r.creado_en,
            u.nombre AS cliente_nombre, s.descripcion AS servicio_realizado
     FROM resenas r
     JOIN solicitudes s ON s.id = r.solicitud_id
     JOIN usuarios u ON u.id = s.cliente_id
     WHERE s.proveedor_id = ? AND r.visible = TRUE
     ORDER BY r.creado_en DESC`,
    [proveedorId]
  );
  return result.rows.map((r) => ({
    ...r,
    calificacion: Number(r.calificacion)
  }));
};

module.exports = {
  buscarProveedores,
  listarZonasDisponibles,
  listarServiciosPorProveedor,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
  listarResenasPorProveedor,
};