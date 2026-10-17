// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Nombre de la cookie de autenticación establecida por el backend
const COOKIE_AUTH = "wma-session-token";

// Rutas que NO requieren autenticación
const RUTAS_PUBLICAS = ["/login"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const esRutaPublica = RUTAS_PUBLICAS.includes(pathname);
    const tieneCookie = request.cookies.has(COOKIE_AUTH);

    // Si está en login y ya tiene cookie → redirigir al tablero
    if (esRutaPublica && tieneCookie) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Si NO es ruta pública y NO tiene cookie → redirigir al login indicando motivo
    if (!esRutaPublica && !tieneCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("motivo", "sesion-expirada");
        return NextResponse.redirect(loginUrl);
    }

    // Todo está bien, dejar pasar
    return NextResponse.next();
}

// Aplicar el middleware a todas las rutas excepto archivos estáticos
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
