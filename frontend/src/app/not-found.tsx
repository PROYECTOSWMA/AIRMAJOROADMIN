// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
            {/* Contenedor Central */}
            <div className="text-center">
                {/* Número 404 con gradiente */}
                <h1 className="text-[100px] font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#174681] to-[#2563EB] sm:text-[160px]">
                    404
                </h1>

                {/* Mensaje Principal */}
                <h2 className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
                    Página no encontrada
                </h2>

                {/* Descripción */}
                <p className="mx-auto mt-4 max-w-md text-base text-gray-500">
                    La ruta que buscas no existe en nuestro sistema.
                    Verifica la URL e intentalo de nuevo.
                </p>

                {/* Botón de regreso */}
                <div className="mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#174681] to-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}
