import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, Banknote, Building2, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useSalidaSinGuardar } from "@/hooks/useSalidaSinGuardar";
import { ModalConfirmarSalida } from "@/components/shared/ModalConfirmarSalida";
import { useMontoTeclado } from "@/hooks/useMontoTeclado";
import { useMiCajaActivaQuery, useMetodosPagoQuery } from "@/hooks/queries/useCajaQueries";
import {
  useConvertirCotizacionMutation,
  useCotizacionDetalleQuery,
} from "@/hooks/queries/useCotizacionQueries";
import { getMetodosPagoConfig } from "@/constants/metodosPago";
import {
  calcularVistaCobro,
  construirPagosFinales,
  crearLineaPago,
} from "@/lib/posCobroUtils";
import { roundVenta } from "@/lib/ventaMappers";
import { fmtQ } from "@/lib/cajaMappers";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/apiClient";
import Toast from "@/components/ui/Toast";
import { Button } from "@/components/ui/button";
import { EstadoErrorCarga } from "@/components/shared/EstadoErrorCarga";

function SeccionTitulo({ children }) {
  return (
    <div className="bg-(--color-gris-claro-2) px-3 py-2 rounded-t-lg border border-b-0 border-(--color-pos-borde-suave)">
      <p className="text-xs font-bold tracking-wide text-(--color-negro)">{children}</p>
    </div>
  );
}

export default function FinalizarCotizacion() {
  const { idCotizacion } = useParams();
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((s) => s.setTitulo);

  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [pagos, setPagos] = useState([]);
  const validarRef = useRef(null);

  const metodosQ = useMetodosPagoQuery();
  const metodos = useMemo(() => {
    if (metodosQ.data?.data?.length) {
      return metodosQ.data.data;
    }
    return getMetodosPagoConfig();
  }, [metodosQ.data?.data]);
  const metodoEfectivo = metodos.find((m) => m.clave === "efectivo");
  const metodoBanco = metodos.find((m) => m.clave === "banco");
  const [metodoActivo, setMetodoActivo] = useState(
    () => metodoEfectivo?.clave ?? metodos[0]?.clave ?? null
  );

  const cotizacionQ = useCotizacionDetalleQuery(idCotizacion);
  const cajaQ = useMiCajaActivaQuery();
  const convertirM = useConvertirCotizacionMutation();

  const cotizacion = cotizacionQ.data?.data;
  const idCaja = cajaQ.data?.data?.idCaja ?? null;
  const total = roundVenta(cotizacion?.total ?? 0);
  const cotizacionPendiente =
    cotizacion && String(cotizacion.estado).toUpperCase() === "PENDIENTE";

  useEffect(() => {
    setTitulo("Mayoreo · Finalizar venta");
  }, [setTitulo]);

  useEffect(() => {
    if (!metodoActivo && metodos.length > 0) {
      const efectivo = metodos.find((m) => m.clave === "efectivo");
      setMetodoActivo(efectivo?.clave ?? metodos[0]?.clave ?? null);
    }
  }, [metodos, metodoActivo]);

  const deudaRestanteConfirmada = useMemo(
    () =>
      roundVenta(
        Math.max(0, total - pagos.reduce((acc, p) => acc + p.montoAplicado, 0))
      ),
    [total, pagos]
  );

  const tecladoHabilitado =
    metodoActivo != null && (deudaRestanteConfirmada > 0.005 || pagos.length === 0);

  const {
    monto: montoDigitando,
    textoMonto,
    reset: resetMonto,
    setMonto,
    activarOverwrite,
    edicionActiva,
  } = useMontoTeclado({
    enabled: tecladoHabilitado,
    onEnter: () => validarRef.current?.(),
  });

  const formularioTieneDatos = useCallback(
    () => pagos.length > 0 || montoDigitando > 0.005,
    [pagos.length, montoDigitando]
  );

  const {
    confirmExitOpen,
    cancelExit,
    salirSinGuardar,
    intentarNavegar,
    permitirSalida,
  } = useSalidaSinGuardar({
    enabled: Boolean(cotizacionPendiente && metodos.length > 0),
    tieneDatos: formularioTieneDatos,
    rutaFallback: "/mayoreo",
  });

  const intentarIrAMayoreo = () => {
    intentarNavegar("/mayoreo");
  };

  const metodoSeleccionado = metodos.find((m) => m.clave === metodoActivo);

  const vista = useMemo(
    () =>
      calcularVistaCobro({
        deudaTotal: total,
        pagos,
        metodo: metodoSeleccionado,
        montoDigitando,
      }),
    [total, pagos, metodoSeleccionado, montoDigitando]
  );

  const confirmarPagoParcial = useCallback(
    (monto) => {
      if (!metodoSeleccionado || monto <= 0) return;
      const linea = crearLineaPago(metodoSeleccionado, monto, deudaRestanteConfirmada);
      setPagos((prev) => [...prev, linea]);
      resetMonto();
    },
    [metodoSeleccionado, deudaRestanteConfirmada, resetMonto]
  );

  const finalizarVenta = useCallback(async () => {
    if (!idCaja) {
      setToast({ open: true, message: "Debe tener una caja abierta para finalizar.", type: "warning" });
      return;
    }
    if (!cotizacion?.idCotizacion) return;

    const pagosFinales = construirPagosFinales(
      pagos,
      metodoActivo,
      montoDigitando,
      metodos,
      total
    );

    if (pagosFinales.length === 0) {
      setToast({ open: true, message: "Registre al menos un pago.", type: "warning" });
      return;
    }

    const totalPagado = roundVenta(
      pagosFinales.reduce((acc, p) => acc + p.montoAplicado, 0)
    );
    if (Math.abs(totalPagado - total) > 0.01) {
      setToast({
        open: true,
        message: `El total pagado (${fmtQ(totalPagado)}) debe igualar la cotización (${fmtQ(total)}).`,
        type: "warning",
      });
      return;
    }

    try {
      const result = await convertirM.mutateAsync({
        idCotizacion: cotizacion.idCotizacion,
        pagos: pagosFinales,
        idCaja,
      });
      setToast({
        open: true,
        message: `Venta finalizada · Ticket ${result.data?.numeroTicket || ""}`,
        type: "success",
      });
      permitirSalida();
      setTimeout(() => navigate("/mayoreo", { replace: true }), 1200);
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Error al finalizar la cotización."),
        type: "error",
      });
    }
  }, [
    idCaja,
    cotizacion,
    pagos,
    metodoActivo,
    montoDigitando,
    metodos,
    total,
    convertirM,
    navigate,
  ]);

  useEffect(() => {
    validarRef.current = () => {
      if (montoDigitando > 0 && deudaRestanteConfirmada > 0.005 && !vista.cubreDeuda) {
        confirmarPagoParcial(montoDigitando);
      } else if (vista.cubreDeuda) {
        finalizarVenta();
      }
    };
  }, [
    montoDigitando,
    deudaRestanteConfirmada,
    vista.cubreDeuda,
    confirmarPagoParcial,
    finalizarVenta,
  ]);

  if (cotizacionQ.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-(--color-gris-letra)">
        <Loader2 className="size-8 animate-spin mb-3" />
        <p className="text-sm">Cargando cotización…</p>
      </div>
    );
  }

  if (cotizacionQ.isError || !cotizacion) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <EstadoErrorCarga
          error={cotizacionQ.error || "Cotización no encontrada"}
          nombreModulo="Cotizaciones"
          fallbackGenerico="Cotización no encontrada."
          onReintentar={cotizacionQ.isError ? () => cotizacionQ.refetch() : undefined}
          onVolver={intentarIrAMayoreo}
        />
      </div>
    );
  }

  if (String(cotizacion.estado).toUpperCase() !== "PENDIENTE") {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-(--color-gris-letra)">
          Esta cotización ya no está pendiente (estado: {cotizacion.estado}).
        </p>
        <Button variant="outline" onClick={intentarIrAMayoreo}>
          Volver al listado
        </Button>
      </div>
    );
  }

  if (!metodos.length) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <p className="text-sm font-medium text-(--color-rojo-obscuro)">
          Configure <code className="text-xs">VITE_METODOS_PAGO</code> en .env.
        </p>
        <Button variant="outline" onClick={intentarIrAMayoreo}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-(--color-pos-fondo)">
      <ModalConfirmarSalida
        open={confirmExitOpen}
        onConfirm={salirSinGuardar}
        onCancel={cancelExit}
      />

      <div className="shrink-0 px-4 py-3 border-b border-(--color-pos-borde-suave) bg-(--color-pos-panel) flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="border-(--color-pagina) text-(--color-pagina)"
          onClick={intentarIrAMayoreo}
        >
          <ArrowLeft className="size-4 mr-1" />
          Volver
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-black text-(--color-negro)">
            FINALIZAR COTIZACIÓN #{cotizacion.idCotizacion}
          </h1>
          <p className="text-xs text-(--color-gris-letra)">
            Cliente: {cotizacion.nombreCliente} · Cobro y entrega (descuenta inventario)
          </p>
        </div>
        <span className="w-16 hidden sm:block" />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-4">
        <div className="max-w-5xl mx-auto h-full min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 min-h-0 flex flex-col">
            <div className="bg-(--color-blanco) border border-(--color-pos-borde-suave) rounded-lg p-4 flex flex-col min-h-0 flex-1">
              <p className="text-xs font-bold text-(--color-gris-letra) uppercase mb-2 shrink-0">Detalle</p>
              <ul className="space-y-2 text-sm overflow-y-auto flex-1 min-h-0">
                {cotizacion.detalles.map((d) => (
                  <li key={d.idCotizacionDetalle} className="flex justify-between gap-2">
                    <span className="truncate" title={d.nombreVariante || d.nombreProducto || undefined}>
                      {d.nombreVariante || d.nombreProducto || "Producto"} × {d.cantidad}
                    </span>
                    <span className="font-semibold tabular-nums shrink-0">{fmtQ(d.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-(--color-pos-borde-suave) mt-3 pt-3 flex justify-between font-black text-(--color-pagina) shrink-0">
                <span>Total</span>
                <span className="tabular-nums">{fmtQ(total)}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <div
              className={cn(
                "min-h-[10rem] border-2 rounded-xl bg-(--color-pos-panel) flex flex-col items-center justify-center p-6",
                edicionActiva && "border-(--color-pagina)",
                vista.cubreDeuda && "border-(--color-esmeralda-hover)/60"
              )}
              onClick={activarOverwrite}
            >
              <p className="text-4xl font-black tabular-nums text-(--color-pagina)">
                {textoMonto()}
              </p>
              <p className="text-xs text-(--color-gris-letra) mt-2">
                {vista.cubreDeuda
                  ? "Cubre el total · Pulse VALIDAR para finalizar"
                  : `Falta ${fmtQ(vista.falta)}`}
              </p>
            </div>

            <Button
              onClick={() => validarRef.current?.()}
              disabled={convertirM.isPending || !idCaja}
              className="h-14 text-lg font-black bg-(--color-pagina) hover:bg-(--color-pagina-hover) text-(--color-blanco)"
            >
              <BadgeCheck className="size-5 mr-2" />
              {convertirM.isPending ? "PROCESANDO…" : "VALIDAR Y FINALIZAR"}
            </Button>

            {!idCaja && (
              <p className="text-xs text-(--color-rojo) text-center">
                Abra una caja antes de finalizar la venta mayoreo.
              </p>
            )}

            <div>
              <SeccionTitulo>MÉTODO DE PAGO</SeccionTitulo>
              <div className="grid grid-cols-2 border border-(--color-pos-borde-suave) rounded-b-lg overflow-hidden bg-(--color-pos-panel)">
                {metodoEfectivo && (
                  <button
                    type="button"
                    onClick={() => setMetodoActivo("efectivo")}
                    className={cn(
                      "py-6 text-base font-black border-r border-(--color-pos-borde-suave)",
                      metodoActivo === "efectivo"
                        ? "bg-(--color-pos-accent-suave) text-(--color-pagina)"
                        : "text-(--color-gris-letra)"
                    )}
                  >
                    <Banknote className="size-5 mx-auto mb-1" />
                    EFECTIVO
                  </button>
                )}
                {metodoBanco && (
                  <button
                    type="button"
                    onClick={() => setMetodoActivo("banco")}
                    className={cn(
                      "py-6 text-base font-black",
                      metodoActivo === "banco"
                        ? "bg-(--color-pos-accent-suave) text-(--color-pagina)"
                        : "text-(--color-gris-letra)"
                    )}
                  >
                    <Building2 className="size-5 mx-auto mb-1" />
                    BANCO
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
