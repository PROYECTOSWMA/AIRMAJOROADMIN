// src/app/(main)/dashboard/page.tsx
"use client";

import { useState } from "react";

/**
 * URL del tablero de Business Intelligence (Evidence.dev).
 *
 * Se incrusta por <iframe> el tablero publicado. OJO: el iframe lo carga el
 * NAVEGADOR del usuario, por eso la URL debe ser pública (no "localhost").
 *
 * Al ser una variable NEXT_PUBLIC_*, se incrusta en tiempo de BUILD. En Docker
 * se pasa como build arg desde docker-compose.yml, por ejemplo:
 *    NEXT_PUBLIC_BI_DASHBOARD_URL=https://dashboardaim.wmasystems.com
 *
 * El fallback "http://localhost:8081" es solo para desarrollo local.
 */
const URL_TABLERO_BI =
    process.env.NEXT_PUBLIC_BI_DASHBOARD_URL || "http://localhost:8081";

export default function DashboardPage() {
    const [cargando, setCargando] = useState(true);

    return (
        /*
         * Márgenes negativos para cancelar el padding del <main> padre
         * y que el tablero ocupe toda el área disponible sin scroll.
         * h-[calc(100vh-4rem)] = pantalla completa menos los 64px del Encabezado.
         */
        <div className="relative -mx-4 -my-4 sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8 h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">

            {/* ── Estado de carga (overlay mientras el iframe termina de cargar) ── */}
            {cargando && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-gray-50">
                    <div
                        className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200"
                        style={{ borderTopColor: "hsla(24, 71%, 40%, 1.00)" }}
                    />
                    <p className="text-sm text-gray-500 font-medium">
                        Cargando tablero de Business Intelligence
                    </p>
                </div>
            )}

            {/* ── Tablero de Business Intelligence (Evidence.dev) ── */}
            <iframe
                src={URL_TABLERO_BI}
                title="Tablero de Business Intelligence"
                className="h-full w-full border-0"
                onLoad={() => setCargando(false)}
                allowFullScreen
            />
        </div>
    );
}
