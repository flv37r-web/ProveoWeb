const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const rateLimit = require('express-rate-limit'); // Escudo protector

// Importación de rutas
const authRoutes = require('./src/routes/authRoutes');
const proveedorRoutes = require('./src/routes/proveedorRoutes');

if (!process.env.JWT_SECRET) {
    throw new Error('Configura JWT_SECRET en backend/.env.local o en las variables de entorno.');
}

const app = express();

// Crear carpeta de subidas si no existe
const uploadsPath = path.resolve(__dirname, 'uploads');
fs.mkdirSync(uploadsPath, { recursive: true });

// Middlewares base
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsPath));

// ==========================================
// FASE 2: SEGURIDAD (RATE LIMITING)
// ==========================================

// Escudo 1: Límite General (Anti-Spam de navegación general)
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones
  message: { error: 'Demasiadas peticiones desde esta IP. Por favor, intenta más tarde.' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Escudo 2: Límite Estricto (Anti-Fuerza Bruta para contraseñas)
const limiterEstrictoAuth = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora de bloqueo
  max: 10, // Límite de 10 intentos
  message: { error: 'Demasiados intentos de acceso. Por seguridad, tu cuenta ha sido bloqueada temporalmente durante 1 hora.' },
});

// Aplicar Escudo General a TODA la API
app.use('/api/v1', limiterGeneral);

// Rutas de la aplicación
app.get('/api/v1/ping', (req, res) => {
    res.status(200).json({ mensaje: 'Backend de Proveo conectado' });
});

app.use('/api/v1/auth', limiterEstrictoAuth, authRoutes); // <-- Escudo 2 aplicado aquí
app.use('/api/v1/proveedores', proveedorRoutes);

// ==========================================
// FASE 1: RED DE SEGURIDAD (Manejador Global de Errores)
// ==========================================
app.use((err, req, res, next) => {
  console.error('🔥 Error atrapado por el servidor:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const mensajeSeguro = statusCode === 500 
    ? 'Lo sentimos, ocurrió un problema interno en nuestros servidores. Intenta de nuevo más tarde.' 
    : err.message;

  res.status(statusCode).json({
    exito: false,
    error: mensajeSeguro
  });
});

// Levantar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});