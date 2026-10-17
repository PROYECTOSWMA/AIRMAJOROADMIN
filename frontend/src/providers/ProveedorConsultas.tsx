"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Interfaz para definir las propiedades que recibe el proveedor
interface PropiedadesProveedor {
    children: React.ReactNode;
}

// Componente para proveer el contexto de React Query a toda la aplicación
export default function ProveedorConsultas({ children }: PropiedadesProveedor) {
    // Variable de estado para inicializar el cliente de consultas una sola vez por sesión
    const [clienteConsulta] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Variable para definir cuánto tiempo la data se considera fresca.
                        // Lo bajamos a 0. Esto asegura que SIEMPRE que cambies de pantalla
                        // y vuelvas, se pida la información más reciente al servidor.
                        staleTime: 0,
                        // Si el usuario minimiza el navegador y vuelve, recarga los datos por debajo
                        refetchOnWindowFocus: true,
                        // Evita reintentos automáticos infinitos si la API falla
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={clienteConsulta}>
            {children}
        </QueryClientProvider>
    );
}