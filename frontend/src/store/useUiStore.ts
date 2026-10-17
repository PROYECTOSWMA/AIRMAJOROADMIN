// src/store/useUiStore.ts
import { create } from 'zustand';

// Define el estado y las acciones para la UI
interface UiState {
    sidebarAbierto: boolean;
    abrirSidebar: () => void;
    cerrarSidebar: () => void;
    toggleSidebar: () => void;
}

// Detecta si estamos en un viewport de escritorio (breakpoint 'lg' de Tailwind = 1024px)
const estaEnEscritorio = () =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

// Crea el hook para gestionar el estado del sidebar
export const useUiStore = create<UiState>((set) => ({
    // En escritorio arranca abierto; en móvil, cerrado (oculto tras el overlay)
    sidebarAbierto: estaEnEscritorio(),

    abrirSidebar: () => set({ sidebarAbierto: true }),
    cerrarSidebar: () => set({ sidebarAbierto: false }),
    toggleSidebar: () => set((state) => ({ sidebarAbierto: !state.sidebarAbierto })),
}));