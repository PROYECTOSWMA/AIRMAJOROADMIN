// src/components/layout/Encabezado.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Home, User, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUiStore } from "@/store/useUiStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useLogout } from "@/features/auth/hooks/use-auth";
import BotonCerrarSesion from "@/features/auth/components/BotonCerrarSesion";
import ModalCerrandoSesion from "@/features/auth/components/ModalCerrandoSesion";
import { obtenerConfiguracionApp } from "@/lib/tenants.config";

function ajustarHex(hex: string, porcentaje: number) {
  const limpio = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return hex;

  const num = parseInt(limpio, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  const ajustar = (c: number) => {
    const v = Math.round(c + (porcentaje / 100) * 255);
    return Math.min(255, Math.max(0, v));
  };

  const rr = ajustar(r).toString(16).padStart(2, "0");
  const gg = ajustar(g).toString(16).padStart(2, "0");
  const bb = ajustar(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

export default function Encabezado() {
  const [mostrarMenuUsuario, setMostrarMenuUsuario] = useState(false);
  const [mostrandoModalLogout, setMostrandoModalLogout] = useState(false);
  const { toggleSidebar } = useUiStore();
  const { usuario } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const config = obtenerConfiguracionApp();
  const nombreEmpresa = config.nombreEmpresa || "Air Majoro";
  const colorPrimario = config.colorPrimario || "#1a56db";
  const colorGradienteFinal = config.colorGradiente || ajustarHex(colorPrimario, 18);

  const { mutate: logout, isPending } = useLogout();

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const manejarClicFuera = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMostrarMenuUsuario(false);
      }
    };

    if (mostrarMenuUsuario) {
      document.addEventListener("mousedown", manejarClicFuera);
    }

    return () => {
      document.removeEventListener("mousedown", manejarClicFuera);
    };
  }, [mostrarMenuUsuario]);

  // Maneja toda la lógica de cierre de sesión
  const manejarCerrarSesion = () => {
    setMostrarMenuUsuario(false);
    setMostrandoModalLogout(true);
    setTimeout(() => {
      logout();
    }, 1000);
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b text-white shadow-md"
        style={{
          backgroundImage: `linear-gradient(to right, ${colorPrimario}, ${colorGradienteFinal})`,
        }}
      >
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* LADO IZQUIERDO: Nombre de la empresa */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-white/20 p-2">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-tight">{nombreEmpresa}</span>
              {usuario?.sede && (
                <span className="text-xs text-white/70 leading-tight">{usuario.sede}</span>
              )}
            </div>
          </div>

          {/* LADO DERECHO: Botones de Módulos y Usuario */}
          <div className="flex items-center gap-3">

            {/* BOTÓN MÓDULOS: Toggle del sidebar */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSidebar}
              className="flex cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 lg:h-[34px] lg:w-auto lg:rounded-md lg:px-3 lg:py-1 lg:text-sm h-10 w-10"
            >
              <LayoutGrid className="h-5 w-5 lg:h-4 lg:w-4" />
              <span className="hidden lg:ml-2 lg:inline">Módulos</span>
            </motion.button>

            {/* MENÚ DE USUARIO */}
            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMostrarMenuUsuario(!mostrarMenuUsuario)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/20"
              >
                <User size={20} />
              </motion.button>

              <AnimatePresence>
                {mostrarMenuUsuario && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-12 z-40 w-64 rounded-lg border bg-white p-2 shadow-lg"
                  >
                    <div className="border-b px-2 py-2 mb-1">
                      <p className="text-xs font-semibold uppercase text-gray-500">Mi cuenta</p>
                      {usuario && (
                        <>
                          <p className="text-sm font-medium text-gray-800 mt-1 truncate">
                            {usuario.nombre_completo}
                          </p>
                          <p className="text-xs text-gray-400">{usuario.rol}</p>
                          {usuario.codigo_base && (
                            <p className="text-xs text-gray-400">Base: {usuario.codigo_base}</p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-1">
                      <BotonCerrarSesion
                        onClick={manejarCerrarSesion}
                        disabled={isPending || mostrandoModalLogout}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* MODAL DE LOGOUT: Renderizado FUERA del menú para que no se desmonte */}
      <ModalCerrandoSesion mostrar={mostrandoModalLogout} />
    </>
  );
}