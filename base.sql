-- Table: public.usuarios

-- DROP TABLE IF EXISTS public.usuarios;

CREATE TABLE IF NOT EXISTS public.usuarios
(
    id_usuario bigint NOT NULL DEFAULT nextval('usuarios_id_usuario_seq'::regclass),
    id_tipo_usuario bigint NOT NULL,
    username character varying(80) COLLATE pg_catalog."default" NOT NULL,
    email character varying(180) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    nombres character varying(120) COLLATE pg_catalog."default" NOT NULL,
    apellidos character varying(120) COLLATE pg_catalog."default",
    telefono character varying(30) COLLATE pg_catalog."default",
    requiere_cambio_password boolean NOT NULL DEFAULT false,
    ultimo_acceso timestamp with time zone,
    activo boolean NOT NULL DEFAULT true,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    creado_por bigint,
    actualizado_por bigint,
    CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_username UNIQUE (username),
    CONSTRAINT fk_usuarios_actualizado_por FOREIGN KEY (actualizado_por)
        REFERENCES public.usuarios (id_usuario) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_usuarios_creado_por FOREIGN KEY (creado_por)
        REFERENCES public.usuarios (id_usuario) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_usuarios_tipo_usuario FOREIGN KEY (id_tipo_usuario)
        REFERENCES public.tipos_usuario (id_tipo_usuario) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT ck_usuarios_username_no_vacio CHECK (btrim(username::text) <> ''::text),
    CONSTRAINT ck_usuarios_email_formato CHECK (email::text ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'::text),
    CONSTRAINT ck_usuarios_password_hash_no_vacio CHECK (btrim(password_hash::text) <> ''::text),
    CONSTRAINT ck_usuarios_nombres_no_vacio CHECK (btrim(nombres::text) <> ''::text)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.usuarios
    OWNER to postgres;



    --Roles 
    -- Table: public.roles

-- DROP TABLE IF EXISTS public.roles;

CREATE TABLE IF NOT EXISTS public.roles
(
    id_rol bigint NOT NULL DEFAULT nextval('roles_id_rol_seq'::regclass),
    codigo character varying(50) COLLATE pg_catalog."default" NOT NULL,
    nombre character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descripcion character varying(250) COLLATE pg_catalog."default",
    activo boolean NOT NULL DEFAULT true,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    creado_por bigint,
    actualizado_por bigint,
    CONSTRAINT roles_pkey PRIMARY KEY (id_rol),
    CONSTRAINT uq_roles_codigo UNIQUE (codigo),
    CONSTRAINT uq_roles_nombre UNIQUE (nombre),
    CONSTRAINT fk_roles_actualizado_por FOREIGN KEY (actualizado_por)
        REFERENCES public.usuarios (id_usuario) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_roles_creado_por FOREIGN KEY (creado_por)
        REFERENCES public.usuarios (id_usuario) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT ck_roles_codigo_no_vacio CHECK (btrim(codigo::text) <> ''::text),
    CONSTRAINT ck_roles_nombre_no_vacio CHECK (btrim(nombre::text) <> ''::text)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.roles
    OWNER to postgres;


    --permisos

    -- Table: public.roles_permisos

-- DROP TABLE IF EXISTS public.roles_permisos;

CREATE TABLE IF NOT EXISTS public.roles_permisos
(
    id_rol_permiso bigint NOT NULL DEFAULT nextval('roles_permisos_id_rol_permiso_seq'::regclass),
    id_rol bigint NOT NULL,
    id_modulo bigint NOT NULL,
    id_submodulo bigint,
    id_accion bigint NOT NULL,
    permitido boolean NOT NULL DEFAULT true,
    activo boolean NOT NULL DEFAULT true,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    creado_por bigint,
    actualizado_por bigint,
    CONSTRAINT roles_permisos_pkey PRIMARY KEY (id_rol_permiso),
    CONSTRAINT uq_roles_permisos_unico UNIQUE (id_rol, id_modulo, id_submodulo, id_accion),
    CONSTRAINT fk_roles_permisos_accion FOREIGN KEY (id_accion)
        REFERENCES public.acciones (id_accion) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_roles_permisos_actualizado_por FOREIGN KEY (actualizado_por)
        REFERENCES public.usuarios (id_usuario) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_roles_permisos_creado_por FOREIGN KEY (creado_por)
        REFERENCES public.usuarios (id_usuario) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_roles_permisos_modulo FOREIGN KEY (id_modulo)
        REFERENCES public.modulos (id_modulo) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_roles_permisos_rol FOREIGN KEY (id_rol)
        REFERENCES public.roles (id_rol) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_roles_permisos_submodulo FOREIGN KEY (id_submodulo)
        REFERENCES public.submodulos (id_submodulo) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.roles_permisos
    OWNER to postgres;
-- Index: idx_roles_permisos_id_submodulo

-- DROP INDEX IF EXISTS public.idx_roles_permisos_id_submodulo;

CREATE INDEX IF NOT EXISTS idx_roles_permisos_id_submodulo
    ON public.roles_permisos USING btree
    (id_submodulo ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: ux_roles_permisos_modulo_sin_submodulo

-- DROP INDEX IF EXISTS public.ux_roles_permisos_modulo_sin_submodulo;

CREATE UNIQUE INDEX IF NOT EXISTS ux_roles_permisos_modulo_sin_submodulo
    ON public.roles_permisos USING btree
    (id_rol ASC NULLS LAST, id_modulo ASC NULLS LAST, id_accion ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE id_submodulo IS NULL;

    --Modulos 
    -- Table: public.modulos

-- DROP TABLE IF EXISTS public.modulos;

CREATE TABLE IF NOT EXISTS public.modulos
(
    id_modulo bigint NOT NULL DEFAULT nextval('modulos_id_modulo_seq'::regclass),
    codigo character varying(80) COLLATE pg_catalog."default" NOT NULL,
    nombre character varying(120) COLLATE pg_catalog."default" NOT NULL,
    descripcion character varying(250) COLLATE pg_catalog."default",
    ruta character varying(250) COLLATE pg_catalog."default",
    icono character varying(80) COLLATE pg_catalog."default",
    orden integer NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    creado_por bigint,
    actualizado_por bigint,
    CONSTRAINT modulos_pkey PRIMARY KEY (id_modulo),
    CONSTRAINT uq_modulos_codigo UNIQUE (codigo),
    CONSTRAINT uq_modulos_nombre UNIQUE (nombre),
    CONSTRAINT fk_modulos_actualizado_por FOREIGN KEY (actualizado_por)
        REFERENCES public.usuarios (id_usuario) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_modulos_creado_por FOREIGN KEY (creado_por)
        REFERENCES public.usuarios (id_usuario) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT ck_modulos_codigo_no_vacio CHECK (btrim(codigo::text) <> ''::text),
    CONSTRAINT ck_modulos_nombre_no_vacio CHECK (btrim(nombre::text) <> ''::text),
    CONSTRAINT ck_modulos_orden_no_negativo CHECK (orden >= 0)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.modulos
    OWNER to postgres;

    --Acciones 
    -- Table: public.acciones

-- DROP TABLE IF EXISTS public.acciones;

CREATE TABLE IF NOT EXISTS public.acciones
(
    id_accion bigint NOT NULL DEFAULT nextval('acciones_id_accion_seq'::regclass),
    codigo character varying(20) COLLATE pg_catalog."default" NOT NULL,
    nombre character varying(80) COLLATE pg_catalog."default" NOT NULL,
    descripcion character varying(250) COLLATE pg_catalog."default",
    activo boolean NOT NULL DEFAULT true,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    CONSTRAINT acciones_pkey PRIMARY KEY (id_accion),
    CONSTRAINT uq_acciones_codigo UNIQUE (codigo),
    CONSTRAINT uq_acciones_nombre UNIQUE (nombre),
    CONSTRAINT ck_acciones_codigo_valido CHECK (codigo::text = ANY (ARRAY['CREATE'::character varying, 'READ'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying]::text[])),
    CONSTRAINT ck_acciones_nombre_no_vacio CHECK (btrim(nombre::text) <> ''::text)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.acciones
    OWNER to postgres;

    --Tipo de usuarios

    -- Table: public.tipos_usuario

-- DROP TABLE IF EXISTS public.tipos_usuario;

CREATE TABLE IF NOT EXISTS public.tipos_usuario
(
    id_tipo_usuario bigint NOT NULL DEFAULT nextval('tipos_usuario_id_tipo_usuario_seq'::regclass),
    codigo character varying(50) COLLATE pg_catalog."default" NOT NULL,
    nombre character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descripcion character varying(250) COLLATE pg_catalog."default",
    activo boolean NOT NULL DEFAULT true,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    CONSTRAINT tipos_usuario_pkey PRIMARY KEY (id_tipo_usuario),
    CONSTRAINT uq_tipos_usuario_codigo UNIQUE (codigo),
    CONSTRAINT uq_tipos_usuario_nombre UNIQUE (nombre),
    CONSTRAINT ck_tipos_usuario_codigo_no_vacio CHECK (btrim(codigo::text) <> ''::text),
    CONSTRAINT ck_tipos_usuario_nombre_no_vacio CHECK (btrim(nombre::text) <> ''::text)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tipos_usuario
    OWNER to postgres;