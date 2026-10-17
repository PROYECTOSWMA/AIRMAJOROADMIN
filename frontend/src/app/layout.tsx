// IMPORTAR EL PROVEEDOR
import ProveedorConsultas from "@/providers/ProveedorConsultas";

// src/app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    style: ["normal", "italic"],
});

export const metadata: Metadata = {
    title: "Air Majoro",
    description: "Sistema de Gestión Air Majoro",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className="notranslate" translate="no">
            <body className={poppins.className}>
                <ProveedorConsultas>
                    {children}
                    <Toaster richColors position="bottom-right" />
                </ProveedorConsultas>
            </body>
        </html>
    );
}