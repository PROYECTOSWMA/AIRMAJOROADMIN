// src/features/auth/types/auth.types.ts

// Estructura del usuario devuelta por el API de login de Air Majoro.
export interface Usuario {
    id_usuario: number;
    nombre_completo: string;
    rol: string;
    sede: string | null;
    codigo_base?: string | null;          // Código de base aérea (ej: "SPCL")
    licencia_aeronautica?: string | null; // Licencia aeronáutica del usuario
}
