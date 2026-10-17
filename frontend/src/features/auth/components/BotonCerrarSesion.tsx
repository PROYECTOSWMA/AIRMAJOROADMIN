// src/features/auth/components/BotonCerrarSesion.tsx
"use client";

import { LogOut } from "lucide-react";

interface PropsBoton {
    onClick?: () => void;
    disabled?: boolean;
}

export default function BotonCerrarSesion({ onClick, disabled }: PropsBoton) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
        </button>
    );
}