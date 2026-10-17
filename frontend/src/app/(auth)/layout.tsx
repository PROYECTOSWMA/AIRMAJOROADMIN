// src/app/(auth)/layout.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

// Ruta única del sistema tras iniciar sesión
const RUTA_INICIO = "/dashboard";

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
    const { estaAutenticado, cerrarSesion } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const motivo = searchParams.get("motivo");
        
        if (motivo === "sesion-expirada") {
            // El backend/middleware detectó que no hay cookie válida
            cerrarSesion();
            // Limpiamos la URL (opcional pero recomendado)
            router.replace("/login");
        } else if (estaAutenticado) {
            router.replace(RUTA_INICIO);
        }
    }, [estaAutenticado, router, searchParams, cerrarSesion]);

    // Si ya hay sesión y no se está limpiando por expiración, mostramos el indicador
    if (estaAutenticado && searchParams.get("motivo") !== "sesion-expirada") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1a56db] border-t-transparent" />
                    <p className="text-sm text-gray-500">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

// ESTE LAYOUT SE APLICA A TODAS LAS RUTAS DENTRO DE LA CARPETA (AUTH).
// Si el usuario ya tiene sesión, lo redirige al tablero.
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1a56db] border-t-transparent" />
                    <p className="text-sm text-gray-500">Cargando...</p>
                </div>
            </div>
        }>
            <AuthLayoutContent>{children}</AuthLayoutContent>
        </Suspense>
    );
}
