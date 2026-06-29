import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Lock, AlertTriangle, Banknote, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import {
  useCerrarCajaMutation,
  useCajaResumenCierreQuery,
  useCajaMovimientosQuery,
  useMiCajaActivaQuery,
} from "@/hooks/queries/useCajaQueries";
import { NipDialog } from "@/pages/caja/components/NipDialog";
import { usePosTicketsStore } from "@/context/usePosTicketsStore";
import { fmtQ } from "@/lib/cajaMappers";
import { agruparMovimientosCierre, parseMontoMonedas } from "@/lib/cajaUtils";
import { getApiErrorMessage } from "@/lib/apiClient";
import Toast from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Kpi({ label, value, icon: Icon, className }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-(--color-gris-claro-2) bg-(--color-pagina-3)/30 px-2.5 py-2 flex items-center gap-2 min-w-0",
        className
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0 text-(--color-pagina)" /> : null}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase text-(--color-gris-letra) truncate">
          {label}
        </p>
        <p className="text-base font-bold tabular-nums text-(--color-negro) leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function FilaBalance({ label, value, negativo }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-emerald-900">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums shrink-0",
          negativo ? "text-(--color-rojo)" : "text-emerald-950"
        )}
      >
        {value}
      </span>
    </div>
  );
}

const CierreCaja = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();
  const miCajaQ = useMiCajaActivaQuery();
  const idCaja = miCajaQ.data?.data?.idCaja;
  const resumenQ = useCajaResumenCierreQuery(idCaja, { enabled: !!idCaja });
  const movQ = useCajaMovimientosQuery(idCaja, { enabled: !!idCaja });
  const cerrarM = useCerrarCajaMutation();

  const resumen = resumenQ.data?.data;
  const movimientos = movQ.data?.data ?? [];

  const ticketsEnEspera = usePosTicketsStore((s) => s.tickets);
  const ticketsPendientes = useMemo(
    () => ticketsEnEspera.filter((t) => t.carrito.some((p) => p.cantidad > 0)).length,
    [ticketsEnEspera]
  );

  const [montoContado, setMontoContado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [nipOpen, setNipOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  useEffect(() => {
    setTitulo("POS · Cierre de caja");
  }, [setTitulo]);

  useEffect(() => {
    if (!miCajaQ.isLoading && !miCajaQ.data?.data) {
      navigate("/pos/apertura", { replace: true });
    }
  }, [miCajaQ.isLoading, miCajaQ.data, navigate]);

  const { gastos, ventasEfectivo, otrasEntradas, totalGastos } = useMemo(
    () => agruparMovimientosCierre(movimientos),
    [movimientos]
  );

  const montoApertura = resumen?.montoApertura ?? 0;
  const montoEsperado = resumen?.montoEsperado ?? 0;
  const montoContadoNum = useMemo(() => parseMontoMonedas(montoContado), [montoContado]);
  const diferencia = useMemo(() => {
    if (Number.isNaN(montoContadoNum) || montoContado === "") return null;
    return Math.round((montoContadoNum - montoEsperado) * 100) / 100;
  }, [montoContado, montoContadoNum, montoEsperado]);

  const requiereObservacion = diferencia != null && diferencia !== 0;
  const loading = resumenQ.isLoading || movQ.isLoading;

  const handleConfirmar = () => {
    if (ticketsPendientes > 0) {
      setToast({
        open: true,
        message: `Tiene ${ticketsPendientes} venta(s) en espera sin cobrar. Cóbrelas o ciérrelas en Ventas antes de cerrar el turno.`,
        type: "warning",
      });
      return;
    }
    if (Number.isNaN(montoContadoNum) || montoContadoNum <= 0) {
      setToast({
        open: true,
        message: "Ingrese el monto total contado en efectivo.",
        type: "warning",
      });
      return;
    }
    if (requiereObservacion && !observaciones.trim()) {
      setToast({
        open: true,
        message: "Debe ingresar una observación cuando existe diferencia de caja.",
        type: "warning",
      });
      return;
    }
    setNipOpen(true);
  };

  const handleNipConfirm = async (nip) => {
    try {
      await cerrarM.mutateAsync({
        idCaja,
        body: {
          nip,
          observacion: observaciones.trim() || null,
          cantidadTotalCierre: montoContadoNum,
        },
      });
      setNipOpen(false);
      setToast({ open: true, message: "Caja cerrada correctamente.", type: "success" });
      setTimeout(() => navigate("/pos"), 800);
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err, "No se pudo cerrar la caja."),
        type: "error",
      });
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-(--color-pagina-4) p-2">
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-md max-w-3xl mx-auto w-full">
        <header className="shrink-0 border-b border-(--color-gris-claro-2) px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-(--color-negro) truncate">Cierre de caja</h2>
            <p className="text-[11px] text-(--color-gris-letra) truncate">
              Turno actual{idCaja ? ` · #${idCaja}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/pos/ventas")}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-(--color-gris-claro-2) px-2 py-1 text-xs font-semibold hover:bg-(--color-pagina-3)"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <>
              {ticketsPendientes > 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs text-amber-950">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                  <p className="flex-1 font-semibold">
                    {ticketsPendientes} venta(s) en espera — ciérrelas antes de cerrar.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/pos/ventas")}
                    className="shrink-0 rounded bg-amber-600 px-2 py-1 text-[10px] font-bold text-(--color-blanco)"
                  >
                    Ventas
                  </button>
                </div>
              ) : null}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Kpi label="Ventas efectivo" value={fmtQ(ventasEfectivo)} icon={Banknote} />
                <Kpi
                  label="Ventas banco"
                  value={fmtQ(0)}
                  icon={CreditCard}
                  className="opacity-90"
                />
                <Kpi label="Base apertura" value={fmtQ(montoApertura)} />
                <Kpi
                  label="Efectivo esperado"
                  value={fmtQ(montoEsperado)}
                  className="border-emerald-200 bg-emerald-50/80"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-emerald-800 mb-1">
                      Balance en caja
                    </p>
                    <FilaBalance label="(+) Base" value={fmtQ(montoApertura)} />
                    <FilaBalance label="(+) Ventas efectivo" value={fmtQ(ventasEfectivo)} />
                    {otrasEntradas > 0 ? (
                      <FilaBalance label="(+) Otras entradas" value={fmtQ(otrasEntradas)} />
                    ) : null}
                    <FilaBalance
                      label="(-) Gastos"
                      value={fmtQ(totalGastos)}
                      negativo
                    />
                    <div className="border-t border-emerald-300/60 pt-1.5 mt-1 flex justify-between items-baseline">
                      <span className="text-xs font-bold text-emerald-950">Total esperado</span>
                      <span className="text-lg font-bold tabular-nums text-emerald-800">
                        {fmtQ(montoEsperado)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-(--color-pagina)/25 bg-(--color-pagina-4)/40 px-3 py-2.5 space-y-2">
                    <p className="text-[10px] font-bold uppercase text-(--color-pagina)">
                      Arqueo · monto contado
                    </p>
                    <input
                      id="monto-contado"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      value={montoContado}
                      onChange={(e) =>
                        setMontoContado(e.target.value.replace(/[^\d.,]/g, ""))
                      }
                      className="w-full rounded-md border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-right text-xl font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40"
                    />
                    {diferencia != null ? (
                      <p
                        className={cn(
                          "text-xs font-semibold rounded px-2 py-1 flex items-center gap-1.5",
                          diferencia === 0
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-amber-100 text-amber-950"
                        )}
                      >
                        {diferencia !== 0 ? (
                          <AlertTriangle className="size-3.5 shrink-0" />
                        ) : null}
                        Diferencia: <span className="tabular-nums">{fmtQ(diferencia)}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3 flex flex-col min-h-0">
                  <div className="rounded-lg border border-(--color-gris-claro-2) overflow-hidden flex flex-col min-h-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-(--color-pagina) px-2.5 py-1.5 bg-(--color-pagina-3)/50 border-b border-(--color-gris-claro-2)">
                      Gastos del turno
                    </p>
                    <div className="max-h-36 overflow-y-auto">
                      <table className="w-full text-xs">
                        <tbody>
                          {gastos.length === 0 ? (
                            <tr>
                              <td
                                colSpan={2}
                                className="px-2 py-3 text-center text-(--color-gris-letra)"
                              >
                                Sin gastos
                              </td>
                            </tr>
                          ) : (
                            gastos.map((g) => (
                              <tr
                                key={g.idMovimientoCaja}
                                className="border-t border-(--color-gris-claro-2)/80"
                              >
                                <td className="px-2 py-1.5 text-(--color-negro) leading-snug">
                                  {g.motivo || g.tipoMovimientoNombre || "Gasto"}
                                </td>
                                <td className="px-2 py-1.5 text-right font-semibold tabular-nums whitespace-nowrap">
                                  {fmtQ(g.monto)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-pink-200 bg-pink-50/60">
                            <td className="px-2 py-1.5 font-bold">Total gastos</td>
                            <td className="px-2 py-1.5 text-right font-bold text-(--color-rojo) tabular-nums">
                              {fmtQ(totalGastos)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="obs-cierre"
                      className="text-[10px] font-bold uppercase text-(--color-pagina)"
                    >
                      Observaciones
                      {requiereObservacion ? (
                        <span className="text-(--color-rojo) normal-case font-semibold">
                          {" "}
                          · obligatorias si hay diferencia
                        </span>
                      ) : null}
                    </label>
                    <textarea
                      id="obs-cierre"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Novedades o discrepancias…"
                      rows={2}
                      className={cn(
                        "w-full resize-none rounded-md border bg-(--color-blanco) p-2 text-xs focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40",
                        requiereObservacion && !observaciones.trim()
                          ? "border-(--color-rojo)"
                          : "border-(--color-gris-claro-2)"
                      )}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-(--color-gris-claro-2) px-3 py-2.5 bg-(--color-pagina-3)/20">
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={cerrarM.isPending || ticketsPendientes > 0 || loading || !miCajaQ.data?.data?.puedeCerrar}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-(--color-rojo) px-4 py-2.5 text-sm font-bold text-(--color-blanco) hover:bg-(--color-rojo-obscuro) disabled:opacity-50"
          >
            <Lock className="size-4" />
            {cerrarM.isPending ? "Cerrando…" : "Confirmar cierre de caja"}
          </button>
          {!miCajaQ.data?.data?.puedeCerrar ? (
            <p className="text-center text-[10px] text-(--color-rojo) mt-1 font-bold">
              No tienes permisos para cerrar esta caja.
            </p>
          ) : (
            <p className="text-center text-[10px] text-(--color-gris-letra) mt-1">
              Requiere NIP · No podrá registrar más movimientos en este turno
            </p>
          )}
        </footer>
      </div>

      <NipDialog
        open={nipOpen}
        onOpenChange={setNipOpen}
        title="Cerrar caja"
        description="Ingrese su NIP de caja para confirmar el cierre."
        confirmLabel="Cerrar caja"
        isLoading={cerrarM.isPending}
        onConfirm={handleNipConfirm}
      />
    </div>
  );
};

export default CierreCaja;
