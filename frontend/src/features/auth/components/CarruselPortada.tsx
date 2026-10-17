"use client";

import { useEffect, useState } from "react";

interface CarruselPortadaProps {
  imagenes: string[];
}

/**
 * Componente que muestra un carrusel de imágenes con transición de opacidad (fade).
 * Solo se activa si hay más de una imagen.
 */
export default function CarruselPortada({ imagenes }: CarruselPortadaProps) {
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    // Si hay 0 o 1 imagen, no necesitamos el intervalo
    if (imagenes.length <= 1) return;

    const intervalo = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % imagenes.length);
    }, 5000); // Cambio cada 5 segundos

    return () => clearInterval(intervalo);
  }, [imagenes]);

  if (!imagenes || imagenes.length === 0) {
    return (
      <div className="h-full w-full bg-gray-100 animate-pulse" />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {imagenes.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className={`absolute inset-0 bg-cover bg-center ${
            index === indiceActual ? "z-10" : "z-0"
          }`}
          style={{
            backgroundImage: `url('${url}')`,
            opacity: index === indiceActual ? 1 : 0,
            transition: "opacity 1.2s ease-in-out",
            willChange: "opacity",
          }}
        />
      ))}
      
      {/* Overlay opcional para consistencia con el diseño si se requiere */}
      <div className="absolute inset-0 bg-black/5 z-20 pointer-events-none" />
    </div>
  );
}
