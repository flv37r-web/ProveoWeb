const { z } = require('zod');

const registroSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  email: z.string().email('Ingresa un correo electrónico válido').max(150),
  telefono: z.string().regex(/^(?:\+?52[\s().-]*)?(?:[0-9][\s().-]*){10}$/, 'Teléfono inválido'),
  password: z.string().min(10, 'La contraseña debe tener entre 10 y 18 caracteres').max(18),
  rol: z.enum(['cliente', 'proveedor'])
});

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  rol: z.enum(['cliente', 'proveedor']).optional()
});

module.exports = { registroSchema, loginSchema };