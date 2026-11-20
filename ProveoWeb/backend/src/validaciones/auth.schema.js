const { z } = require('zod');

const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'El token de Google es obligatorio'),
  rol: z.enum(['cliente', 'proveedor']).optional(),
});

module.exports = {
  googleAuthSchema,
};


// Actualizacion Google Auth.