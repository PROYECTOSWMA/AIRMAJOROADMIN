// src/lib/axios.ts
import axios, { AxiosInstance } from "axios";
import { obtenerConfiguracionApp } from "./tenants.config";

// Variable para detectar si estamos en el servidor (SSR) o en el navegador (CSR)
const ES_SERVIDOR = typeof window === "undefined";

/**
 * Crea un cliente Axios configurado con la URL base de la API de Air Majoro.
 */
export function crearClienteApi(): AxiosInstance {
    const urlBase = obtenerConfiguracionApp().apiUrl;

    const clienteAxios = axios.create({
        baseURL: urlBase,
        headers: {
            "Content-Type": "application/json",
        },
        // En el cliente, el navegador adjunta las cookies automáticamente.
        withCredentials: true,
    });

    // ─── Interceptor de PETICIONES (Request) ───
    // Si estamos en el servidor (SSR), reenviamos la cookie de sesión del usuario
    // para que el backend acepte la petición como autenticada.
    clienteAxios.interceptors.request.use(async (config) => {
        if (ES_SERVIDOR) {
            try {
                // Importación dinámica: "next/headers" solo existe en el servidor.
                const { cookies } = await import("next/headers");
                const cookieStore = await cookies();
                const token = cookieStore.get("wma-session-token")?.value;

                if (token) {
                    // Inyectamos la cookie manualmente en el header de la petición.
                    config.headers["Cookie"] = `wma-session-token=${token}`;
                }
            } catch {
                // Si cookies() falla (ej: durante el build estático), lo ignoramos.
            }
        }
        return config;
    });

    // ─── Interceptor de RESPUESTAS (Response) ───
    // Solo ejecutamos la lógica de cierre de sesión en el CLIENTE (navegador).
    clienteAxios.interceptors.response.use(
        // Si la respuesta es exitosa, la dejamos pasar.
        (response) => response,

        // Si hay un error, lo manejamos aquí.
        (error) => {
            if (!ES_SERVIDOR && error.response?.status === 401) {
                // Importación dinámica del store para evitar errores en SSR.
                import("@/store/useAuthStore").then(({ useAuthStore }) => {
                    const estaAutenticado = useAuthStore.getState().estaAutenticado;

                    if (estaAutenticado) {
                        // Si el store creía que estábamos logueados, forzamos el logout.
                        useAuthStore.getState().cerrarSesion();
                        // Redirigimos al login con una recarga completa.
                        window.location.href = "/login";
                    }
                });
            }
            // Devolvemos el error para que React Query lo pueda manejar.
            return Promise.reject(error);
        }
    );

    return clienteAxios;
}
