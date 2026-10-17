// src/app/(auth)/login/page.tsx
import FormularioLogin from "@/features/auth/components/FormularioLogin";
import CarruselPortada from "@/features/auth/components/CarruselPortada";
import { obtenerConfiguracionApp } from "@/lib/tenants.config";

export default function PaginaLogin() {
  const config = obtenerConfiguracionApp();

  // Imágenes del carrusel (necesita al menos 2 para activar el fade)
  const imagenesPortada =
    config.imagenesPortada && config.imagenesPortada.length >= 2
      ? config.imagenesPortada
      : [];

  const disenoLogin = config.disenoLogin || 'centrado';

  // ─────────── DISEÑO CENTRADO: imagen de fondo + formulario superpuesto ───────────
  if (disenoLogin === 'centrado' || imagenesPortada.length === 0) {
    return (
      <main
        className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${config.colorPrimario || "#1a56db"} 0%, ${config.colorGradiente || "#2563eb"} 100%)`,
        }}
      >
        {/* Fondo: carrusel si hay imágenes */}
        {imagenesPortada.length >= 2 && (
          <div className="absolute inset-0 z-0">
            <CarruselPortada imagenes={imagenesPortada} />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Formulario centrado */}
        <div className="relative z-10 w-full max-w-md px-4 py-8">
          <FormularioLogin />
        </div>
      </main>
    );
  }

  // ─────────── DISEÑO SIDEBAR: panel izquierdo + carrusel a la derecha ───────────
  return (
    <main className="flex min-h-screen w-full overflow-hidden">
      {/* Panel Izquierdo: formulario de login */}
      <div
        className="relative z-20 flex w-full lg:max-w-[480px] min-h-screen flex-col items-center justify-center p-8 shadow-2xl"
        style={{ backgroundColor: "white" }}
      >
        {/* Franja de color en la parte superior del panel */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-b-full"
          style={{
            background: `linear-gradient(to right, ${config.colorPrimario}, ${config.colorGradiente || config.colorPrimario})`,
          }}
        />

        <div className="w-full max-w-sm">
          <FormularioLogin />
        </div>

        {/* Footer del panel */}
        <p className="absolute bottom-4 text-[11px] text-gray-300 tracking-wide">
          © {new Date().getFullYear()} Air Majoro — Todos los derechos reservados
        </p>
      </div>

      {/* Panel Derecho: carrusel de imágenes */}
      <div className="hidden lg:block relative flex-1 z-10">
        <CarruselPortada imagenes={imagenesPortada} />
        {/* Overlay sutil */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        {/* Badge de marca sobre el carrusel */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
          <div
            className="px-5 py-2 rounded-full text-white text-sm font-semibold shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: `${config.colorPrimario}cc` }}
          >
            Air Majoro
          </div>
        </div>
      </div>
    </main>
  );
}