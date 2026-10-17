// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Usuario } from '@/features/auth/types/auth.types';

// Define la estructura del estado y las acciones disponibles.
interface AuthState {
    usuario: Usuario | null;      // El usuario puede ser nulo si no ha iniciado sesión
    estaAutenticado: boolean;     // Booleano para comprobaciones rápidas
    hidratado: boolean;

    // Acciones
    iniciarSesion: (datosUsuario: Usuario) => void;
    cerrarSesion: () => void;
    setHidratado: (valor: boolean) => void;
}

// Hook 'useAuthStore' que usaremos en nuestros componentes.
export const useAuthStore = create<AuthState>()(
    // 'persist' guarda el estado en el localStorage
    persist(
        (set) => ({
            usuario: null,
            estaAutenticado: false,
            hidratado: false,

            setHidratado: (valor) => set({ hidratado: valor }),

            // Guarda los datos del usuario al iniciar sesión
            iniciarSesion: (datosUsuario) =>
                set({
                    usuario: datosUsuario,
                    estaAutenticado: true,
                }),

            // Limpia los datos al cerrar sesión
            cerrarSesion: () =>
                set({
                    usuario: null,
                    estaAutenticado: false,
                }),
        }),
        {
            name: 'auth-storage', // Nombre de la clave en el localStorage
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHidratado(true);
            },
        }
    )
);
