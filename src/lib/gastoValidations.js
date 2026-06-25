import { z } from "zod";

const fechaValida = (valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

export const gastoCrearSchema = z.object({
  idTipoGasto: z.coerce.number().int().positive("Debe seleccionar un tipo de gasto"),
  idMetodoPago: z.preprocess(
    (valor) => (valor === "" || valor == null ? null : Number(valor)),
    z.number().int().positive("El método de pago no es válido").nullable()
  ),
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(255, "La descripción no puede superar 255 caracteres"),
  monto: z.coerce
    .number()
    .positive("El monto debe ser mayor que cero")
    .max(9_999_999_999.99, "El monto está fuera del rango permitido")
    .refine(
      (valor) => Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-8,
      "El monto admite como máximo dos decimales"
    ),
  fecha: z
    .string()
    .trim()
    .min(1, "La fecha es obligatoria")
    .refine((valor) => valor === "" || fechaValida(valor), "La fecha no es válida"),
});

export function validateCrearGasto(input) {
  return gastoCrearSchema.safeParse(input);
}
