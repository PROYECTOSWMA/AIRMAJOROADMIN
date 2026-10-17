// src/features/auth/hooks/use-auth.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { iniciarSesionApi, cerrarSesionApi } from "../services/auth.service";
import { LoginFormValues } from "../schemas/auth.schema";

/**
 * Hook para manejar la mutación de inicio de sesión.
 */
export function useLogin() {
    return useMutation({
        mutationFn: (credenciales: LoginFormValues) => iniciarSesionApi(credenciales),
    });
}

/**
 * Hook para manejar el Logout.
 */
export function useLogout() {
    return useMutation({
        mutationFn: async () => {
            try {
                await cerrarSesionApi();
            } catch {
                // Si falla, continuamos con la limpieza local
            }
        },
        onSuccess: () => {
            localStorage.removeItem("auth-storage");
            window.location.href = "/login";
        },
        onError: () => {
            localStorage.removeItem("auth-storage");
            window.location.href = "/login";
        },
    });
}
