import { z } from "zod";

const nipDigitsSchema = z
  .string()
  .trim()
  .min(4, "El NIP debe tener entre 4 y 10 dígitos")
  .max(10, "El NIP debe tener entre 4 y 10 dígitos")
  .regex(/^[0-9]+$/, "El NIP solo puede contener dígitos");

export const credencialCajaCrearSchema = z
  .object({
    nip: nipDigitsSchema,
    confirmacionNip: z.string().trim(),
    activo: z.boolean(),
  })
  .refine((d) => d.nip === d.confirmacionNip, {
    message: "Los NIP no coinciden",
    path: ["confirmacionNip"],
  });

/** Admin: asignar nuevo NIP sin conocer el actual (PUT /nip) */
export const credencialCajaAsignarNipSchema = z.object({
  nuevoNip: nipDigitsSchema,
});

/** Usuario: cambio con NIP actual (PATCH /{idUsuario}) */
export const credencialCajaPatchSchema = z
  .object({
    nipActual: nipDigitsSchema,
    nuevoNip: nipDigitsSchema,
  })
  .refine((d) => d.nipActual !== d.nuevoNip, {
    message: "El nuevo NIP debe ser diferente al actual",
    path: ["nuevoNip"],
  });

export function validateCredencialCajaCrear(input) {
  return credencialCajaCrearSchema.safeParse(input);
}

/** Crear con un solo campo en UI: confirma en cliente duplicando el valor */
export function validateCredencialCajaCrearSimple(nuevoNip) {
  return credencialCajaAsignarNipSchema.safeParse({ nuevoNip });
}

export function validateCredencialCajaAsignarNip(input) {
  return credencialCajaAsignarNipSchema.safeParse(input);
}

export function validateCredencialCajaPatch(input) {
  return credencialCajaPatchSchema.safeParse(input);
}
