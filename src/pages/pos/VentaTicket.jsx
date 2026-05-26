import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { usePosVentaStore } from "@/context/usePosVentaStore";
import { VentaTicketPanel } from "@/pages/pos/components/VentaTicketPanel";

const VentaTicket = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const navigate = useNavigate();
  const ultimaVenta = usePosVentaStore((s) => s.ultimaVenta);
  const clearParaNuevaVenta = usePosVentaStore((s) => s.clearParaNuevaVenta);

  useEffect(() => {
    setTitulo("POS · Ticket");
  }, [setTitulo]);

  useEffect(() => {
    if (!ultimaVenta) {
      navigate("/pos/ventas", { replace: true });
    }
  }, [ultimaVenta, navigate]);

  const handleNuevaVenta = () => {
    clearParaNuevaVenta();
    navigate("/pos/ventas", { replace: true });
  };

  if (!ultimaVenta) {
    return null;
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-(--color-pos-fondo)">
      <VentaTicketPanel onNuevaVenta={handleNuevaVenta} />
    </div>
  );
};

export default VentaTicket;
