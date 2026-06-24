import { z } from "zod";

const fechaValida = (valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

export const obtenerFechaGuatemala = () => {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const porTipo = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${porTipo.year}-${porTipo.month}-${porTipo.day}`;
};

export const deudaAbonoCrearSchema = z.object({
  idDeuda: z.coerce.number().int().positive("Debe seleccionar una deuda"),
  idMetodoPago: z.coerce.number().int().positive("Debe seleccionar un metodo de pago"),
  fechaAbono: z
    .string()
    .trim()
    .min(1, "La fecha del abono es obligatoria")
    .refine((valor) => valor === "" || fechaValida(valor), "La fecha no es valida")
    .refine((valor) => valor === "" || valor <= obtenerFechaGuatemala(), "La fecha del abono no puede ser futura"),
  monto: z.coerce
    .number()
    .positive("El monto debe ser mayor que cero")
    .max(9_999_999_999.99, "El monto esta fuera del rango permitido")
    .refine(
      (valor) => Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-8,
      "El monto admite como maximo dos decimales"
    ),
  observaciones: z.string().trim().max(500, "Maximo 500 caracteres").optional(),
});

export function validateCrearDeudaAbono(input) {
  return deudaAbonoCrearSchema.safeParse(input);
}
