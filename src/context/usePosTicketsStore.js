import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Máximo de tickets/ventas en espera simultáneos por sesión de cajero. */
export const LIMITE_TICKETS_ESPERA = 8;

let secuencia = 0;
const nuevoId = () => {
  secuencia += 1;
  return `ticket-${Date.now()}-${secuencia}`;
};

const crearTicketVacio = () => ({ id: nuevoId(), carrito: [] });

const ticketInicial = crearTicketVacio();

/**
 * Tickets de venta en espera (multi-pestaña) dentro de la misma caja activa.
 * Cada ticket es un carrito independiente; se persiste en localStorage para sobrevivir recargas.
 * Solo se convierte en Venta al cobrar.
 */
export const usePosTicketsStore = create(
  persist(
    (set, get) => ({
      tickets: [ticketInicial],
      activeId: ticketInicial.id,

      ticketActivo: () => {
        const { tickets, activeId } = get();
        return tickets.find((t) => t.id === activeId) ?? tickets[0] ?? null;
      },

      setActivo: (id) => set({ activeId: id }),

      /** Crea un ticket nuevo y lo activa. Devuelve false si se alcanzó el límite. */
      nuevoTicket: () => {
        const { tickets } = get();
        if (tickets.length >= LIMITE_TICKETS_ESPERA) return false;
        const ticket = crearTicketVacio();
        set({ tickets: [...tickets, ticket], activeId: ticket.id });
        return true;
      },

      /** Cierra un ticket. Si era el activo, activa un vecino; si no queda ninguno, crea uno vacío. */
      cerrarTicket: (id) =>
        set((state) => {
          const idx = state.tickets.findIndex((t) => t.id === id);
          const restantes = state.tickets.filter((t) => t.id !== id);

          if (restantes.length === 0) {
            const ticket = crearTicketVacio();
            return { tickets: [ticket], activeId: ticket.id };
          }

          let activeId = state.activeId;
          if (activeId === id) {
            const vecino = restantes[Math.min(idx, restantes.length - 1)];
            activeId = vecino.id;
          }
          return { tickets: restantes, activeId };
        }),

      /** Actualiza el carrito del ticket activo. Acepta un valor o una función updater. */
      setCarritoActivo: (carritoOrFn) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === state.activeId
              ? {
                  ...t,
                  carrito:
                    typeof carritoOrFn === "function"
                      ? carritoOrFn(t.carrito)
                      : carritoOrFn,
                }
              : t
          ),
        })),

      /** Vacía el carrito del ticket activo (tras cobrar) sin cerrar la pestaña. */
      limpiarTicketActivo: () =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === state.activeId ? { ...t, carrito: [] } : t
          ),
        })),
    }),
    {
      name: "pos-tickets",
      partialize: (state) => ({ tickets: state.tickets, activeId: state.activeId }),
      merge: (persisted, current) => {
        const restaurado = { ...current, ...(persisted ?? {}) };
        if (!Array.isArray(restaurado.tickets) || restaurado.tickets.length === 0) {
          const ticket = crearTicketVacio();
          restaurado.tickets = [ticket];
          restaurado.activeId = ticket.id;
        } else if (!restaurado.tickets.some((t) => t.id === restaurado.activeId)) {
          restaurado.activeId = restaurado.tickets[0].id;
        }
        return restaurado;
      },
    }
  )
);
