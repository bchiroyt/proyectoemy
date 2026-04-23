import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            /** ISO 8601 del backend (AuthLoginResponse.expiraEn), si está disponible */
            tokenExpiraEn: null,
            isAuthenticated: false,

            setLogin: (userData, token, opts = {}) =>
                set({
                    user: userData,
                    token,
                    tokenExpiraEn: opts.tokenExpiraEn ?? null,
                    isAuthenticated: true,
                }),

            logout: () => {
                set({ user: null, token: null, tokenExpiraEn: null, isAuthenticated: false });
                // Opcional: limpiar el storage manualmente
                localStorage.removeItem('auth-storage');
            },
        }),
        {
            name: 'auth-storage', // Nombre único para la "llave" en el navegador
            storage: createJSONStorage(() => localStorage), // Guardar en el disco del navegador
        }
    )
);