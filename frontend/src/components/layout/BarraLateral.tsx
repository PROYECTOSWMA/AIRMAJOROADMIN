// src/components/layout/BarraLateral.tsx
"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plane } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/useUiStore";
import { cn } from "@/lib/utils";
import { obtenerConfiguracionApp } from "@/lib/tenants.config";

// Única opción del sistema: el tablero embebido.
const MODULOS = [
  { href: "/dashboard", label: "Dashboard", Icono: LayoutDashboard },
];

// Cierra la barra lateral solo en móvil; en escritorio respeta el estado colapsado/abierto
function cerrarSidebarEnMovil(cerrarSidebar: () => void) {
  if (typeof window !== "undefined" && window.innerWidth < 1024) {
    cerrarSidebar();
  }
}

// COMPONENTE PRINCIPAL DE LA BARRA LATERAL
export default function BarraLateral() {
  const rutaActual = usePathname();
  const { usuario, estaAutenticado } = useAuthStore();
  const { sidebarAbierto, cerrarSidebar } = useUiStore();

  const config = obtenerConfiguracionApp();
  const nombreEmpresa = config.nombreEmpresa || "Air Majoro";
  const colorPrimario = config.colorPrimario || "#1a56db";
  const colorTituloSidebar = config.colorTituloSidebar || "#1e3a5f";

  if (!estaAutenticado) return null;

  return (
    <>
      {/* OVERLAY: Fondo oscuro que aparece en móvil cuando el menú está abierto */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={cerrarSidebar}
        />
      )}

      {/* ASIDE: La barra lateral en sí */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col bg-white p-4 shadow-md transition-transform duration-300 ease-in-out",
          "transform",
          sidebarAbierto ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          "--tenant-primary": colorPrimario,
          "--tenant-title-sidebar": colorTituloSidebar,
        } as CSSProperties}
      >
        {/* Logo / Nombre de la empresa */}
        <div className="flex flex-col items-center text-center mb-6">
          {config.logoUrl ? (
            <div className="h-20 w-20 overflow-hidden rounded-2xl p-1 mb-2">
              <img
                src={config.logoUrl}
                alt={nombreEmpresa}
                className="h-full w-full object-contain filter drop-shadow-md"
              />
            </div>
          ) : (
            <div
              className="rounded-xl p-3 shadow-md mb-2"
              style={{ backgroundColor: colorPrimario }}
            >
              <Plane className="h-9 w-9 text-white" />
            </div>
          )}
          <h2
            className="text-sm font-bold mt-1"
            style={{ color: colorTituloSidebar }}
          >
            {nombreEmpresa}
          </h2>
          {usuario?.sede && (
            <p className="text-xs text-gray-400 mt-0.5">{usuario.sede}</p>
          )}
        </div>

        <nav
          className="flex-1 overflow-y-auto pr-1"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0.12) transparent",
          }}
        >
          <ul className="space-y-1">
            {MODULOS.map(({ href, label, Icono }) => {
              const estaActivo = rutaActual === href;

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => cerrarSidebarEnMovil(cerrarSidebar)}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-[11px] text-sm font-normal transition-all",
                      "text-black hover:bg-[var(--tenant-primary)] hover:text-white",
                      estaActivo && "bg-[var(--tenant-primary)] text-white"
                    )}
                  >
                    <div className="flex items-center gap-3 transition-transform duration-200 group-hover:translate-x-1">
                      <Icono className="h-5 w-5" />
                      <span>{label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
