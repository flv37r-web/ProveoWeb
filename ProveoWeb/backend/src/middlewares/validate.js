const validarEsquema = (schema) => (req, res, next) => {
  // Si por alguna razón el esquema no existe, dejamos pasar al controlador
  if (!schema || typeof schema.safeParse !== 'function') {
    return next();
  }

  const resultado = schema.safeParse(req.body);

  if (!resultado.success) {
    // Compatible con cualquier versión de Zod (issues o errors)
    const listaErrores = resultado.error?.issues || resultado.error?.errors || [];
    const mensajeError = listaErrores[0]?.message || 'Los datos enviados no son válidos.';
    return res.status(400).json({ error: mensajeError });
  }

  req.body = resultado.data;
  next();
};

module.exports = validarEsquema;