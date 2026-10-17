// src/features/auth/components/ModalCerrandoSesion.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { obtenerConfiguracionApp } from '@/lib/tenants.config';

interface PropsModal {
    mostrar: boolean;
}

export default function ModalCerrandoSesion({ mostrar }: PropsModal) {
    const config = obtenerConfiguracionApp();

    return (
        <AnimatePresence>
            {mostrar && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="relative w-full max-w-xs overflow-hidden rounded-xl border bg-white p-6 shadow-2xl"
                    >
                        {/* Icono */}
                        <div className="mb-4 flex justify-center">
                            <div
                                className="flex h-16 w-16 items-center justify-center rounded-full"
                                style={{ backgroundColor: config.colorPrimario || "#174681" }}
                            >
                                <LogOut className="h-10 w-10 text-white" />
                            </div>
                        </div>

                        {/* Título */}
                        <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
                            Cerrando Sesión...
                        </h2>

                        {/* Mensaje */}
                        <p className="text-center text-sm text-gray-500">
                            ¡Hasta pronto!
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
