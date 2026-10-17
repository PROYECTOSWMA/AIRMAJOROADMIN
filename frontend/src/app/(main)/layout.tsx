// src/app/(main)/layout.tsx
"use client";

import { useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/useUiStore";
import { cn } from "@/lib/utils";
import Encabezado from "@/components/layout/Encabezado";
import BarraLateral from "@/components/layout/BarraLateral";
import { obtenerConfiguracionApp } from "@/lib/tenants.config";

// Layout principal para las secciones internas de la aplicación.
// Incluye el guard de autenticación del lado del cliente.
export default function LayoutPrincipal({
  children,
}: {
  children: React.ReactNode;
}) {
  const { estaAutenticado, hidratado } = useAuthStore();
  const { sidebarAbierto } = useUiStore();
  const router = useRouter();

  const config = obtenerConfiguracionApp();
  const colorPrimario = config.colorPrimario || "#1a56db";
  const colorTitulosVistas = config.colorTitulosVistas || "#1a56db";

  // Aplicar variables de tema globalmente
  useEffect(() => {
    document.documentElement.style.setProperty("--tenant-primary", colorPrimario);
    document.documentElement.style.setProperty("--tenant-title-view", colorTitulosVistas);
    document.documentElement.style.setProperty("--primary", colorPrimario);
  }, [colorPrimario, colorTitulosVistas]);

  useEffect(() => {
    if (!hidratado) return;

    // Si no hay sesión activa, redirigir al login
    if (!estaAutenticado) {
      router.replace("/login");
    }
  }, [hidratado, estaAutenticado, router]);

  // Mientras verificamos la sesión, mostramos un indicador de carga
  if (!hidratado || !estaAutenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4"
            style={{ borderColor: colorPrimario, borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        "--tenant-primary": colorPrimario,
        "--tenant-title-view": colorTitulosVistas,
      } as CSSProperties}
    >
      <BarraLateral />
      {/* Contenedor principal: se desplaza a la derecha solo cuando la barra está abierta en escritorio */}
      <div
        className={cn(
          "flex flex-col transition-[padding] duration-300 ease-in-out",
          sidebarAbierto ? "lg:pl-64" : "lg:pl-0"
        )}
      >
        <Encabezado />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
