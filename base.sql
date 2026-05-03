BEGIN;

-- ============================================================
-- CATALOGO: TIPOS DE USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_usuario (
    id_tipo_usuario BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(250),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,

    CONSTRAINT uq_tipos_usuario_codigo UNIQUE (codigo),
    CONSTRAINT uq_tipos_usuario_nombre UNIQUE (nombre),
    CONSTRAINT ck_tipos_usuario_codigo_no_vacio CHECK (btrim(codigo) <> ''),
    CONSTRAINT ck_tipos_usuario_nombre_no_vacio CHECK (btrim(nombre) <> '')
);

-- ============================================================
-- CATALOGO: ACCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS acciones (
    id_accion BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    descripcion VARCHAR(250),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,

    CONSTRAINT uq_acciones_codigo UNIQUE (codigo),
    CONSTRAINT uq_acciones_nombre UNIQUE (nombre),
    CONSTRAINT ck_acciones_codigo_valido CHECK (
        codigo IN ('CREATE', 'READ', 'UPDATE', 'DELETE')
    ),
    CONSTRAINT ck_acciones_nombre_no_vacio CHECK (btrim(nombre) <> '')
);

-- ============================================================
-- USUARIOS
-- Nota:
-- Se crea antes que roles/modulos/submodulos para permitir
-- las FK autoreferenciales y futuras auditorias.
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,
    id_tipo_usuario BIGINT NOT NULL,
    username VARCHAR(80) NOT NULL,
    email VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(120) NOT NULL,
    apellidos VARCHAR(120),
    telefono VARCHAR(30),
    requiere_cambio_password BOOLEAN NOT NULL DEFAULT FALSE,
    ultimo_acceso TIMESTAMPTZ,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,
    creado_por BIGINT,
    actualizado_por BIGINT,

    CONSTRAINT fk_usuarios_tipo_usuario
        FOREIGN KEY (id_tipo_usuario)
        REFERENCES tipos_usuario (id_tipo_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_usuarios_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_usuarios_actualizado_por
        FOREIGN KEY (actualizado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_usuarios_username UNIQUE (username),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT ck_usuarios_username_no_vacio CHECK (btrim(username) <> ''),
    CONSTRAINT ck_usuarios_email_formato CHECK (
        email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
    ),
    CONSTRAINT ck_usuarios_password_hash_no_vacio CHECK (btrim(password_hash) <> ''),
    CONSTRAINT ck_usuarios_nombres_no_vacio CHECK (btrim(nombres) <> '')
);

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id_rol BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(250),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,
    creado_por BIGINT,
    actualizado_por BIGINT,

    CONSTRAINT fk_roles_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_roles_actualizado_por
        FOREIGN KEY (actualizado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_roles_codigo UNIQUE (codigo),
    CONSTRAINT uq_roles_nombre UNIQUE (nombre),
    CONSTRAINT ck_roles_codigo_no_vacio CHECK (btrim(codigo) <> ''),
    CONSTRAINT ck_roles_nombre_no_vacio CHECK (btrim(nombre) <> '')
);

-- ============================================================
-- MODULOS
-- ============================================================
CREATE TABLE IF NOT EXISTS modulos (
    id_modulo BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(80) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(250),
    ruta VARCHAR(250),
    icono VARCHAR(80),
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,
    creado_por BIGINT,
    actualizado_por BIGINT,

    CONSTRAINT fk_modulos_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_modulos_actualizado_por
        FOREIGN KEY (actualizado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_modulos_codigo UNIQUE (codigo),
    CONSTRAINT uq_modulos_nombre UNIQUE (nombre),
    CONSTRAINT ck_modulos_codigo_no_vacio CHECK (btrim(codigo) <> ''),
    CONSTRAINT ck_modulos_nombre_no_vacio CHECK (btrim(nombre) <> ''),
    CONSTRAINT ck_modulos_orden_no_negativo CHECK (orden >= 0)
);

-- ============================================================
-- SUBMODULOS
-- ============================================================
CREATE TABLE IF NOT EXISTS submodulos (
    id_submodulo BIGSERIAL PRIMARY KEY,
    id_modulo BIGINT NOT NULL,
    codigo VARCHAR(80) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(250),
    ruta VARCHAR(250),
    icono VARCHAR(80),
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,
    creado_por BIGINT,
    actualizado_por BIGINT,

    CONSTRAINT fk_submodulos_modulo
        FOREIGN KEY (id_modulo)
        REFERENCES modulos (id_modulo)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_submodulos_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_submodulos_actualizado_por
        FOREIGN KEY (actualizado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_submodulos_modulo_codigo UNIQUE (id_modulo, codigo),
    CONSTRAINT uq_submodulos_modulo_nombre UNIQUE (id_modulo, nombre),
    CONSTRAINT ck_submodulos_codigo_no_vacio CHECK (btrim(codigo) <> ''),
    CONSTRAINT ck_submodulos_nombre_no_vacio CHECK (btrim(nombre) <> ''),
    CONSTRAINT ck_submodulos_orden_no_negativo CHECK (orden >= 0)
);

-- ============================================================
-- RELACION USUARIOS - ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios_roles (
    id_usuario_rol BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    id_rol BIGINT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,
    creado_por BIGINT,
    actualizado_por BIGINT,

    CONSTRAINT fk_usuarios_roles_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_usuarios_roles_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles (id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_usuarios_roles_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_usuarios_roles_actualizado_por
        FOREIGN KEY (actualizado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_usuarios_roles_usuario_rol UNIQUE (id_usuario, id_rol)
);

-- ============================================================
-- PERMISOS POR ROL
-- ============================================================
CREATE TABLE IF NOT EXISTS roles_permisos (
    id_rol_permiso BIGSERIAL PRIMARY KEY,
    id_rol BIGINT NOT NULL,
    id_modulo BIGINT NOT NULL,
    id_submodulo BIGINT,
    id_accion BIGINT NOT NULL,
    permitido BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ,
    creado_por BIGINT,
    actualizado_por BIGINT,

    CONSTRAINT fk_roles_permisos_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles (id_rol)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_roles_permisos_modulo
        FOREIGN KEY (id_modulo)
        REFERENCES modulos (id_modulo)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_roles_permisos_submodulo
        FOREIGN KEY (id_submodulo)
        REFERENCES submodulos (id_submodulo)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_roles_permisos_accion
        FOREIGN KEY (id_accion)
        REFERENCES acciones (id_accion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_roles_permisos_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_roles_permisos_actualizado_por
        FOREIGN KEY (actualizado_por)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_roles_permisos_unico
        UNIQUE (id_rol, id_modulo, id_submodulo, id_accion)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_roles_permisos_modulo_sin_submodulo
    ON roles_permisos (id_rol, id_modulo, id_accion)
    WHERE id_submodulo IS NULL;


COMMIT;