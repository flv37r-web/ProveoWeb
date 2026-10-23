const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Aseguramos que la carpeta física exista en el servidor
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configuramos cómo se guardan las fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Inventa un nombre único para que las fotos no se encimen
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 3. Filtro de seguridad (Solo admite imágenes)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, WEBP).'), false);
  }
};

// Instancia de Multer con los límites requeridos (1 foto de perfil y hasta 5 de trabajo)
const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo por foto
  fileFilter 
}).fields([
  { name: 'foto_perfil', maxCount: 1 },
  { name: 'fotos_trabajo', maxCount: 5 }
]);

// 4. El Middleware real (La FUNCIÓN que Express está pidiendo)
const uploadProfile = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'Error al procesar imágenes: ' + err.message });
    }
    
    // Inyectamos la URL pública que tu Controlador está esperando guardar en MySQL
    if (req.files) {
      if (req.files.foto_perfil) {
        req.files.foto_perfil[0].publicUrl = '/uploads/' + req.files.foto_perfil[0].filename;
      }
      if (req.files.fotos_trabajo) {
        req.files.fotos_trabajo.forEach(file => {
          file.publicUrl = '/uploads/' + file.filename;
        });
      }
    }
    next();
  });
};

module.exports = uploadProfile;