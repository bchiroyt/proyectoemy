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

export const credencialCajaActualizarNipSchema = z
  .object({
    nipNuevo: nipDigitsSchema,
    confirmacionNipNuevo: z.string().trim(),
  })
  .refine((d) => d.nipNuevo === d.confirmacionNipNuevo, {
    message: "Los NIP no coinciden",
    path: ["confirmacionNipNuevo"],
  });

export function validateCredencialCajaCrear(input) {
  return credencialCajaCrearSchema.safeParse(input);
}

export function validateCredencialCajaActualizarNip(input) {
  return credencialCajaActualizarNipSchema.safeParse(input);
}
