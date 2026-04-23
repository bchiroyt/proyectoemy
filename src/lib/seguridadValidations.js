import { z } from "zod";

const idRolSchema = z.coerce.number().int().positive();

export const asignarRolesUsuarioSchema = z.object({
  idUsuario: z.coerce.number().int().positive(),
  idRoles: z.array(idRolSchema).max(50),
});

export const copiarRolSchema = z.object({
  idRolOrigen: idRolSchema,
  codigo: z
    .string()
    .trim()
    .min(1, "El código es obligatorio")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[A-Za-z0-9_\-]+$/, "Solo letras, números, guiones y guión bajo"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().trim().max(250, "Máximo 250 caracteres").optional(),
});

export const crearRolSchema = z.object({
  codigo: copiarRolSchema.shape.codigo,
  nombre: copiarRolSchema.shape.nombre,
  descripcion: z.string().trim().max(250, "Máximo 250 caracteres").optional(),
});

export const permisoItemSchema = z.object({
  idModulo: z.coerce.number().int().positive(),
  idSubmodulo: z.union([z.null(), z.coerce.number().int().positive()]),
  idAccion: z.coerce.number().int().positive(),
  permitido: z.boolean(),
});

export const actualizarPermisosRolSchema = z.object({
  idRol: idRolSchema,
  permisos: z.array(permisoItemSchema).max(5000),
});

export function validateAsignarRoles(input) {
  return asignarRolesUsuarioSchema.safeParse(input);
}

export function validateCopiarRol(input) {
  return copiarRolSchema.safeParse(input);
}

export function validateCrearRol(input) {
  return crearRolSchema.safeParse(input);
}

export function validateActualizarPermisosRol(input) {
  return actualizarPermisosRolSchema.safeParse(input);
}

/** Permisos excepcionales de usuario: una fila por módulo + acción (sin submódulo en API). */
export const permisoExcepcionUsuarioItemSchema = z.object({
  idModulo: z.coerce.number().int().positive(),
  idAccion: z.coerce.number().int().positive(),
  permitido: z.boolean(),
});

export const actualizarPermisosUsuarioSchema = z.object({
  idUsuario: z.coerce.number().int().positive(),
  permisosExcepcionales: z.array(permisoExcepcionUsuarioItemSchema).min(0).max(5000),
});

export const patchUsuarioSchema = z.object({
  idTipoUsuario: z.coerce.number().int().positive().optional(),
  username: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(180).optional(),
  nombres: z.string().trim().min(1).max(120).optional(),
  apellidos: z.union([z.string().trim().max(120), z.literal("")]).optional(),
  telefono: z.union([z.string().trim().max(30), z.literal("")]).optional(),
  requiereCambioPassword: z.boolean().optional(),
  activo: z.boolean().optional(),
  password: z.union([z.string().min(8).max(128), z.literal("")]).optional(),
});

export function validateActualizarPermisosUsuario(input) {
  return actualizarPermisosUsuarioSchema.safeParse(input);
}

export function validatePatchUsuario(input) {
  return patchUsuarioSchema.safeParse(input);
}

/** Formulario completo de edición (se envía como PATCH con todos los campos escalares). */
export const usuarioEditFormSchema = z.object({
  idTipoUsuario: z.coerce.number().int().positive("El tipo de usuario es obligatorio"),
  username: z.string().trim().min(1, "Usuario obligatorio").max(80),
  email: z.string().trim().email("Correo inválido").max(180),
  nombres: z.string().trim().min(1, "Nombres obligatorios").max(120),
  apellidos: z.string().trim().max(120),
  telefono: z.string().trim().max(30),
  requiereCambioPassword: z.boolean(),
  activo: z.boolean(),
  password: z
    .string()
    .max(128)
    .refine((s) => s === "" || s.length >= 8, { message: "La contraseña debe tener al menos 8 caracteres o dejarse vacía" }),
});

export function validateUsuarioEditForm(input) {
  return usuarioEditFormSchema.safeParse(input);
}

export const crearUsuarioSchema = z.object({
  idTipoUsuario: z.coerce.number().int().positive("El tipo de usuario es obligatorio"),
  username: z.string().trim().min(1, "Usuario obligatorio").max(80),
  email: z.string().trim().email("Correo inválido").max(180),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(128),
  nombres: z.string().trim().min(1, "Nombres obligatorios").max(120),
  apellidos: z.string().trim().max(120).optional(),
  telefono: z.string().trim().max(30).optional(),
  requiereCambioPassword: z.boolean(),
  activo: z.boolean(),
  idRoles: z.array(z.coerce.number().int().positive()).max(50),
});

export function validateCrearUsuario(input) {
  return crearUsuarioSchema.safeParse(input);
}
