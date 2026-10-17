// src/features/auth/schemas/auth.schema.ts
import { z } from "zod";

// Define las reglas para el formulario de login.
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "El usuario es requerido."),
    password: z
        .string()
        .min(1, "La contraseña es requerida."),
});

// Infiere el tipo de TypeScript directamente desde el schema.
export type LoginFormValues = z.infer<typeof loginSchema>;