import { z } from "zod";

export const loginSchema = z.object({
    email: z.string()
        .min(1, "El correo es obligatorio")
        .email("Formato de correo invalido"),
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres"),
});