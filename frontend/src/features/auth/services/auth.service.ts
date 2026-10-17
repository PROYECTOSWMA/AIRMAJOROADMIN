// src/features/auth/services/auth.service.ts
import { crearClienteApi } from "@/lib/axios";
import { LoginFormValues } from "../schemas/auth.schema";
import { Usuario } from "../types/auth.types";

// Estructura esperada de la respuesta del API de login.
interface LoginApiResponse {
    status: string;
    message: string;
    user: Usuario;
}

/**
 * Llama al endpoint de login de la API de Air Majoro.
 * @param credenciales - El email y password del usuario.
 * @returns La respuesta de la API con los datos del usuario.
 */
export async function iniciarSesionApi(
    credenciales: LoginFormValues
): Promise<LoginApiResponse> {
    const clienteApi = crearClienteApi();
    const respuesta = await clienteApi.post<LoginApiResponse>("/usuarios/login", credenciales);
    return respuesta.data;
}

/**
 * Llama al endpoint de logout de la API para invalidar la sesión en el servidor.
 */
export async function cerrarSesionApi() {
    const clienteApi = crearClienteApi();
    const respuesta = await clienteApi.post("/usuarios/logout");
    return respuesta.data;
}
