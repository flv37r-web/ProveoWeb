const { z } = require('zod');

const perfilProveedorSchema = z.object({
  nombre_negocio: z.string().max(150, 'El nombre del negocio es muy largo').optional().nullable(),
  tipo_servicio: z.string().max(100).optional().nullable(),
  formacion: z.string().max(255).optional().nullable(),
  descripcion: z.string().max(1000).optional().nullable(),
  servicio_domicilio: z.boolean().optional().nullable(),
  colonia: z.string().max(100).optional().nullable(),
  codigo_postal: z.string().regex(/^\d{5}$/, 'El código postal debe tener exactamente 5 números').optional().nullable(),
  telefono: z.string().regex(/^(?:\+?52[\s().-]*)?(?:[0-9][\s().-]*){10}$/, 'Teléfono inválido').optional().nullable(),
  solo_cotizacion: z.boolean().optional().nullable(),
  costo_aproximado: z.number().nonnegative('El costo no puede ser negativo').optional().nullable(),
  direccion_maps: z.string().url('Ingresa un enlace válido de Google Maps').or(z.literal('')).optional().nullable()
});

module.exports = { perfilProveedorSchema };