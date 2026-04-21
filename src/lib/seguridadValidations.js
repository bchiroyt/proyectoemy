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
