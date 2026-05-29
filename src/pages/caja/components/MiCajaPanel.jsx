import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  useMiCajaActivaQuery,
  useCajaResumenCierreQuery,
} from "@/hooks/queries/useCajaQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Banknote, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { fmtQ } from "@/lib/cajaMappers";
import { ArqueoParcialDialog } from "@/pages/caja/components/ArqueoParcialDialog";
import { Badge } from "@/components/ui/badge";

export function MiCajaPanel() {
  const { data: cajaRes, isLoading } = useMiCajaActivaQuery();
  const navigate = useNavigate();
  const [arqueoOpen, setArqueoOpen] = useState(false);

  const caja = cajaRes?.data;
  const resumenQ = useCajaResumenCierreQuery(caja?.idCaja, { enabled: !!caja?.idCaja });
  const resumen = resumenQ.data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 max-w-4xl mx-auto">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!caja) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <Banknote className="size-16 text-(--color-gris-claro-2) mb-4" />
        <h3 className="text-xl font-bold text-(--color-negro)">No tienes una caja activa</h3>
        <p className="text-sm text-(--color-gris-letra) mb-6 text-center max-w-sm">
          Abra su turno con un arqueo inicial para operar en el POS.
        </p>
        <Button
          onClick={() => navigate("/pos/apertura")}
          className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button) px-8 py-6 rounded-xl font-bold text-lg"
        >
          <Lock className="mr-2 size-5" />
          Abrir caja
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="bg-(--color-blanco) rounded-2xl border border-(--color-gris-claro-2) p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--color-gris-claro-2) pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-(--color-negro)">Caja #{caja.idCaja}</h2>
              {caja.esActiva && (
                <Badge className="bg-(--color-pagina-2) text-(--color-blanco)">Activa</Badge>
              )}
            </div>
            <p className="text-sm text-(--color-gris-letra) mt-1">
              Responsable: {caja.usuarioAperturaNombre} · Abierta{" "}
              {new Date(caja.fechaApertura).toLocaleString("es-GT")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-(--color-gris-claro-2) text-(--color-gris-letra)"
              onClick={() => setArqueoOpen(true)}
            >
              Arqueo parcial
            </Button>
            <Button
              className="bg-(--color-rojo) hover:bg-(--color-rojo-obscuro) text-(--color-blanco)"
              onClick={() => navigate("/pos/cierre")}
            >
              Cerrar caja
            </Button>
            <Button
              className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
              onClick={() => navigate("/pos/ventas")}
            >
              Ir a ventas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-3)/50 p-4">
            <p className="text-xs font-bold text-(--color-gris-letra) uppercase">Apertura</p>
            <p className="text-xl font-black text-(--color-pagina) mt-1">{fmtQ(caja.montoApertura)}</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold text-green-700 uppercase flex items-center gap-1">
              <ArrowDownCircle className="size-3.5" /> Entradas
            </p>
            <p className="text-xl font-black text-green-800 mt-1">
              {fmtQ(resumen?.totalEntradasManual ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold text-(--color-rojo) uppercase flex items-center gap-1">
              <ArrowUpCircle className="size-3.5" /> Salidas
            </p>
            <p className="text-xl font-black text-(--color-rojo-obscuro) mt-1">
              {fmtQ(resumen?.totalSalidasManual ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-(--color-pagina-2)/30 bg-(--color-pagina-2)/10 p-4">
            <p className="text-xs font-bold text-(--color-pagina-2) uppercase">Esperado en caja</p>
            <p className="text-xl font-black text-(--color-pagina-2) mt-1">
              {resumenQ.isLoading ? "…" : fmtQ(resumen?.montoEsperado ?? caja.montoApertura)}
            </p>
          </div>
        </div>
      </div>

      <ArqueoParcialDialog
        open={arqueoOpen}
        onOpenChange={setArqueoOpen}
        idCaja={caja.idCaja}
      />
    </div>
  );
}
