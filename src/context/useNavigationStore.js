import { create } from 'zustand';

export const useNavigationStore = create((set) => ({
  // Estado inicial
  titulo: "Panel de Control",
  
  // Función para actualizar el título
  setTitulo: (nuevoTitulo) => set({ titulo: nuevoTitulo }),
}));