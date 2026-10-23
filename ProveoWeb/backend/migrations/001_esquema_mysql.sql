CREATE DATABASE IF NOT EXISTS proveo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE proveo;

-- 1. Tabla de Usuarios (UUID generado desde Node.js o MySQL)
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'proveedor', 'administrador') NOT NULL,
    estatus VARCHAR(20) DEFAULT 'activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY usuarios_email_unique_idx (email),
    UNIQUE KEY usuarios_telefono_unique_idx (telefono)
);

-- 2. Tabla de Perfiles de Proveedor (con todas las columnas de tus 3 migraciones)
-- Nota: fotos_trabajo cambia de TEXT[] (Postgres) a JSON (MySQL)
CREATE TABLE IF NOT EXISTS perfiles_proveedor (
    usuario_id VARCHAR(36) PRIMARY KEY,
    nombre_negocio VARCHAR(150) NULL,
    tipo_servicio VARCHAR(150) NULL,
    formacion VARCHAR(500) NULL,
    servicio_domicilio BOOLEAN NULL,
    colonia VARCHAR(150) NULL,
    codigo_postal VARCHAR(5) NULL,
    titulo_profesional VARCHAR(150) NULL,
    descripcion TEXT NULL,
    telefono VARCHAR(20) NULL,
    foto_url VARCHAR(255) NULL,
    foto_perfil_url VARCHAR(500) NULL,
    fotos_trabajo JSON NOT NULL,
    solo_cotizacion BOOLEAN NULL,
    costo_aproximado DECIMAL(10, 2) NULL,
    direccion_maps TEXT NULL,
    promedio_calificacion DECIMAL(3, 2) DEFAULT 0.00,
    total_resenas INT DEFAULT 0,
    latitud DOUBLE NULL,
    longitud DOUBLE NULL,
    CONSTRAINT fk_perfil_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Tablas de Catálogo, Solicitudes, Chat y Reseñas (listas para siguientes fases)
CREATE TABLE IF NOT EXISTS categorias (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS proveedor_categorias (
    proveedor_id VARCHAR(36) NOT NULL,
    categoria_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (proveedor_id, categoria_id),
    CONSTRAINT fk_pc_proveedor FOREIGN KEY (proveedor_id) REFERENCES perfiles_proveedor(usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_pc_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS servicios (
    id VARCHAR(36) PRIMARY KEY,
    proveedor_id VARCHAR(36) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    precio_referencia DECIMAL(10, 2) NULL,
    CONSTRAINT fk_servicio_proveedor FOREIGN KEY (proveedor_id) REFERENCES perfiles_proveedor(usuario_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS solicitudes (
    id VARCHAR(36) PRIMARY KEY,
    cliente_id VARCHAR(36) NOT NULL,
    proveedor_id VARCHAR(36) NOT NULL,
    servicio_id VARCHAR(36) NULL,
    descripcion TEXT NOT NULL,
    fecha_servicio DATE NULL,
    costo_acordado DECIMAL(10, 2) NULL,
    estado ENUM('pendiente', 'aceptada', 'rechazada', 'en_proceso', 'finalizada', 'cancelada') DEFAULT 'pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_solicitud_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    CONSTRAINT fk_solicitud_proveedor FOREIGN KEY (proveedor_id) REFERENCES perfiles_proveedor(usuario_id),
    CONSTRAINT fk_solicitud_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id),
    CONSTRAINT chk_no_autocontratacion CHECK (cliente_id <> proveedor_id),
    INDEX idx_solic_participantes (cliente_id, proveedor_id, estado)
);

CREATE TABLE IF NOT EXISTS mensajes_chat (
    id VARCHAR(36) PRIMARY KEY,
    solicitud_id VARCHAR(36) NOT NULL,
    emisor_id VARCHAR(36) NOT NULL,
    contenido TEXT NOT NULL,
    creado_en TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    leido_en TIMESTAMP NULL,
    CONSTRAINT fk_chat_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_emisor FOREIGN KEY (emisor_id) REFERENCES usuarios(id),
    INDEX idx_mensajes_solic (solicitud_id, creado_en)
);

CREATE TABLE IF NOT EXISTS resenas (
    id VARCHAR(36) PRIMARY KEY,
    solicitud_id VARCHAR(36) UNIQUE NOT NULL,
    calificacion SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT NULL,
    visible BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resena_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE
);