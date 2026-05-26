import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Lock, AlertTriangle, Banknote, CreditCard, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import {
  useCerrarCajaMutation,
  useCajaResumenCierreQuery,
  useCajaMovimientosQuery,
  useMiCajaActivaQuery,
} from "@/hooks/queries/useCajaQueries";
import { NipDialog } from "@/components/caja/NipDialog";
import { fmtQ } from "@/lib/cajaMappers";
import { agruparMovimientosCierre, parseMontoMonedas } from "@/lib/cajaUtils";
import { getApiErrorMessage } from "@/lib/apiClient";
import Toast from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Seccion({ numero, titulo, children, className }) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-sm font-bold text-(--color-negro)">
        <span className="text-(--color-pagina)">{numero}.</span> {titulo}
      </h3>
      {children}
    </section>
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
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-(--color-pagina-4) p-2 sm:p-3">
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-lg max-w-4xl mx-auto w-full">
        <header className="shrink-0 border-b border-(--color-gris-claro-2) px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-(--color-negro)">Cierre de Caja</h2>
              <p className="text-sm text-(--color-gris-letra) mt-1">
                Resumen de operaciones y balance final del turno actual
                {idCaja ? ` · Caja #${idCaja}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/pos/ventas")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-gris-claro-2) bg-(--color-pagina-3) px-2.5 py-1.5 text-sm font-semibold"
            >
              <ArrowLeft className="size-4" />
              Volver
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : (
            <>
              <Seccion numero={1} titulo="Resumen de Ventas">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-pink-100 bg-pink-50/80 p-4 flex items-center gap-3">
                    <Banknote className="size-8 text-(--color-pagina-2) shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-(--color-gris-letra) uppercase">
                        Ventas en efectivo
                      </p>
                      <p className="text-xl font-bold text-(--color-negro) tabular-nums">
                        {fmtQ(ventasEfectivo)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-3)/40 p-4 flex items-center gap-3">
                    <CreditCard className="size-8 text-(--color-gris-letra) shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-(--color-gris-letra) uppercase">
                        Ventas por banco
                      </p>
                      <p className="text-xl font-bold text-(--color-negro) tabular-nums">{fmtQ(0)}</p>
                      <p className="text-[10px] text-(--color-gris-letra) mt-0.5">
                        Tarjeta/transferencia no afectan el arqueo de efectivo
                      </p>
                    </div>
                  </div>
                </div>
              </Seccion>

              <Seccion numero={2} titulo="Gastos del Día">
                <div className="rounded-xl border border-(--color-gris-claro-2) overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-(--color-pagina-3)/60 text-left">
                      <tr>
                        <th className="px-3 py-2 font-semibold text-(--color-pagina)">Descripción</th>
                        <th className="px-3 py-2 font-semibold text-(--color-pagina) text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-3 py-4 text-center text-(--color-gris-letra)">
                            Sin gastos registrados en este turno
                          </td>
                        </tr>
                      ) : (
                        gastos.map((g) => (
                          <tr key={g.idMovimientoCaja} className="border-t border-(--color-gris-claro-2)">
                            <td className="px-3 py-2 text-(--color-negro)">
                              {g.motivo || g.tipoMovimientoNombre || "Gasto"}
                              {g.observacion ? (
                                <span className="block text-xs text-(--color-gris-letra)">
                                  {g.observacion}
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">
                              {fmtQ(g.monto)}
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="border-t-2 border-pink-200 bg-pink-50/50">
                        <td className="px-3 py-2 font-bold text-(--color-negro)">
                          Total Gastos (Efectivo)
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-(--color-rojo) tabular-nums">
                          {fmtQ(totalGastos)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Seccion>

              <Seccion numero={3} titulo="Fondo de Caja">
                <div className="rounded-xl border-2 border-dashed border-(--color-gris-claro-2) bg-(--color-pagina-3)/30 px-4 py-5 text-center">
                  <Wallet className="size-8 mx-auto text-(--color-pagina-2) mb-2" />
                  <p className="text-xs font-semibold text-(--color-gris-letra) uppercase">
                    Efectivo fijo (base inicial) · Monto de apertura
                  </p>
                  <p className="text-2xl font-bold text-(--color-negro) tabular-nums mt-1">
                    {fmtQ(montoApertura)}
                  </p>
                </div>
              </Seccion>

              <Seccion numero={4} titulo="Balance Final (esperado en caja)">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-emerald-900">(+) Base de caja</span>
                    <span className="font-semibold tabular-nums text-emerald-950">
                      {fmtQ(montoApertura)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-emerald-900">(+) Ventas efectivo</span>
                    <span className="font-semibold tabular-nums text-emerald-950">
                      {fmtQ(ventasEfectivo)}
                    </span>
                  </div>
                  {otrasEntradas > 0 ? (
                    <div className="flex justify-between gap-2">
                      <span className="text-emerald-900">(+) Otras entradas</span>
                      <span className="font-semibold tabular-nums text-emerald-950">
                        {fmtQ(otrasEntradas)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-2">
                    <span className="text-emerald-900">(-) Gastos efectivo</span>
                    <span className="font-semibold tabular-nums text-emerald-950">
                      {fmtQ(totalGastos)}
                    </span>
                  </div>
                  <div className="border-t border-emerald-300/60 pt-3 mt-2 flex justify-between items-end gap-2">
                    <span className="font-bold text-emerald-950">Efectivo total esperado</span>
                    <span className="text-2xl font-bold tabular-nums text-emerald-800">
                      {fmtQ(montoEsperado)}
                    </span>
                  </div>
                </div>
              </Seccion>

              <Seccion numero={5} titulo="Arqueo físico · Monto contado">
                <div className="rounded-xl border-2 border-(--color-pagina)/30 bg-(--color-pagina-4)/30 p-4 space-y-3">
                  <p className="text-sm text-(--color-gris-letra)">
                    Cuente todo el efectivo en caja e ingrese el total (billetes y monedas juntos).
                  </p>
                  <div>
                    <label
                      htmlFor="monto-contado"
                      className="text-xs font-bold uppercase text-(--color-pagina)"
                    >
                      Monto contado
                    </label>
                    <input
                      id="monto-contado"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      value={montoContado}
                      onChange={(e) => setMontoContado(e.target.value.replace(/[^\d.,]/g, ""))}
                      className="mt-1 w-full rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-4 py-3 text-right text-2xl font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40"
                    />
                  </div>
                  {diferencia != null ? (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
                        diferencia === 0
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-950"
                      )}
                    >
                      {diferencia !== 0 ? <AlertTriangle className="size-4 shrink-0" /> : null}
                      <span>
                        Diferencia (contado − esperado):{" "}
                        <span className="tabular-nums">{fmtQ(diferencia)}</span>
                      </span>
                    </div>
                  ) : null}
                </div>
              </Seccion>

              <Seccion numero={6} titulo="Observaciones">
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Escriba aquí cualquier novedad o discrepancia detectada durante el cierre…"
                  rows={4}
                  className={cn(
                    "w-full resize-none rounded-lg border bg-(--color-blanco) p-3 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40",
                    requiereObservacion && !observaciones.trim()
                      ? "border-(--color-rojo)"
                      : "border-(--color-gris-claro-2)"
                  )}
                />
                {requiereObservacion && !observaciones.trim() ? (
                  <p className="text-xs text-(--color-rojo)">Obligatoria por diferencia de caja.</p>
                ) : null}
              </Seccion>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={cerrarM.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-rojo) px-6 py-4 text-base font-bold text-(--color-blanco) hover:bg-(--color-rojo-obscuro) disabled:opacity-50 shadow-md"
                >
                  <Lock className="size-5" />
                  Confirmar cierre de caja
                </button>
                <p className="text-center text-[11px] text-(--color-gris-letra) px-2">
                  Al confirmar, no podrá registrar más movimientos en este turno.
                </p>
              </div>
            </>
          )}
        </div>
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
