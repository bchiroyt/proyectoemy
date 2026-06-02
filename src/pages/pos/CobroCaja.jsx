import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, Banknote, Building2, Pencil, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { usePosVentaStore } from "@/context/usePosVentaStore";
import { usePosTicketsStore } from "@/context/usePosTicketsStore";
import { useMontoTeclado } from "@/hooks/useMontoTeclado";
import { useCrearVentaMutation } from "@/hooks/queries/useVentaQueries";
import {
  useAplicarReembolsoMutation,
  usePrevisualizarReembolsoMutation,
} from "@/hooks/queries/useReembolsoQueries";
import { useMiCajaActivaQuery } from "@/hooks/queries/useCajaQueries";
import { getMetodosPagoConfig } from "@/constants/metodosPago";
import { montoBaseLineaReembolso } from "@/lib/reembolsoMappers";
import { buildVentaCrearBody, roundVenta, subtotalLinea } from "@/lib/ventaMappers";
import {
  calcularVistaCobro,
  construirPagosFinales,
  crearLineaPago,
} from "@/lib/posCobroUtils";
import { fmtQ } from "@/lib/cajaMappers";
import { getApiErrorMessage } from "@/lib/apiClient";
import Toast from "@/components/ui/Toast";
import { VentaTicketPanel } from "@/pages/pos/components/VentaTicketPanel";
import { cn } from "@/lib/utils";

function SeccionTitulo({ children }) {
  return (
    <div className="bg-(--color-gris-claro-2) px-3 py-2 rounded-t-lg border border-b-0 border-(--color-pos-borde-suave)">
      <p className="text-xs font-bold tracking-wide text-(--color-negro)">{children}</p>
    </div>
  );
}

const CobroCaja = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const navigate = useNavigate();
  const carrito = usePosVentaStore((s) => s.carrito);
  const totalStore = usePosVentaStore((s) => s.total);
  const operacion = usePosVentaStore((s) => s.operacion);
  const pendienteKey = usePosVentaStore((s) => s.pendienteKey);
  const ultimaVenta = usePosVentaStore((s) => s.ultimaVenta);
  const setUltimaVenta = usePosVentaStore((s) => s.setUltimaVenta);
  const clearPendiente = usePosVentaStore((s) => s.clearPendiente);
  const clearParaNuevaVenta = usePosVentaStore((s) => s.clearParaNuevaVenta);
  const notificarReembolsoFinalizado = usePosVentaStore(
    (s) => s.notificarReembolsoFinalizado
  );
  const limpiarTicketActivo = usePosTicketsStore((s) => s.limpiarTicketActivo);

  const [mostrarTicket, setMostrarTicket] = useState(false);

  const metodos = useMemo(() => getMetodosPagoConfig(), []);
  const metodoEfectivo = metodos.find((m) => m.clave === "efectivo");
  const metodoBanco = metodos.find((m) => m.clave === "banco");

  const [metodoActivo, setMetodoActivo] = useState(
    () => metodoEfectivo?.clave ?? metodos[0]?.clave ?? null
  );
  const [pagos, setPagos] = useState([]);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const crearM = useCrearVentaMutation();
  const reembolsoM = useAplicarReembolsoMutation();
  const previsualizarReembolsoM = usePrevisualizarReembolsoMutation();
  const miCajaQ = useMiCajaActivaQuery();
  const idCaja = miCajaQ.data?.data?.idCaja ?? null;
  const validarRef = useRef(null);

  const lineas = useMemo(
    () => (carrito ?? []).filter((l) => l.cantidad > 0),
    [carrito]
  );
  const esReembolso = operacion?.tipo === "reembolso";

  const deudaTotal = useMemo(
    () =>
      roundVenta(
        lineas.reduce((acc, l) => acc + subtotalLinea(l), 0) || totalStore || 0
      ),
    [lineas, totalStore]
  );
  const montoObjetivo = useMemo(
    () => (esReembolso ? Math.abs(deudaTotal) : deudaTotal),
    [esReembolso, deudaTotal]
  );

  const metodoSeleccionado = metodos.find((m) => m.clave === metodoActivo);

  const deudaRestanteConfirmada = useMemo(
    () =>
      roundVenta(
        Math.max(
          0,
          montoObjetivo - pagos.reduce((acc, p) => acc + p.montoAplicado, 0)
        )
      ),
    [montoObjetivo, pagos]
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
    allowNegative: esReembolso,
  });

  const vista = useMemo(
    () =>
      calcularVistaCobro({
        deudaTotal: montoObjetivo,
        pagos,
        metodo: metodoSeleccionado,
        montoDigitando: esReembolso ? Math.abs(montoDigitando) : montoDigitando,
      }),
    [montoObjetivo, pagos, metodoSeleccionado, montoDigitando, esReembolso]
  );

  const confirmarPagoParcial = useCallback(
    (montoRecibido, claveMetodo = metodoActivo) => {
      const metodo = metodos.find((m) => m.clave === claveMetodo);
      if (!metodo || montoRecibido <= 0) return false;

      const aplicadoPrevio = roundVenta(
        pagos.reduce((acc, p) => acc + p.montoAplicado, 0)
      );
      const deudaRest = roundVenta(Math.max(0, montoObjetivo - aplicadoPrevio));
      if (deudaRest <= 0.005) return false;

      const linea = crearLineaPago(metodo, montoRecibido, deudaRest);
      setPagos((prev) => [...prev, linea]);
      resetMonto();
      activarOverwrite();
      return true;
    },
    [metodoActivo, metodos, pagos, montoObjetivo, resetMonto, activarOverwrite]
  );

  const seleccionarMetodo = useCallback(
    (clave) => {
      const montoActual = esReembolso ? Math.abs(montoDigitando) : montoDigitando;
      if (
        clave !== metodoActivo &&
        montoActual > 0 &&
        deudaRestanteConfirmada > 0.005
      ) {
        confirmarPagoParcial(montoActual, metodoActivo);
      } else if (clave !== metodoActivo) {
        resetMonto();
        activarOverwrite();
      }
      setMetodoActivo(clave);
      if (clave === metodoActivo) {
        activarOverwrite();
      }
    },
    [
      metodoActivo,
      montoDigitando,
      esReembolso,
      deudaRestanteConfirmada,
      confirmarPagoParcial,
      resetMonto,
      activarOverwrite,
    ]
  );

  const eliminarPago = useCallback((idx) => {
    setPagos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const editarPago = useCallback(
    (idx) => {
      const objetivo = pagos[idx];
      if (!objetivo) return;
      setPagos((prev) => prev.filter((_, i) => i !== idx));
      setMetodoActivo(objetivo.clave);
      setMonto(objetivo.montoRecibido);
    },
    [pagos, setMonto]
  );

  const cubreSoloPagos =
    pagos.length > 0 && deudaRestanteConfirmada <= 0.005 && montoDigitando <= 0;
  const montoPantallaValido = esReembolso ? montoDigitando < 0 : montoDigitando > 0;
  const cubreConPantalla =
    montoPantallaValido && vista.cubreDeuda && metodoActivo != null;
  const puedeValidar = metodos.length > 0 && (cubreSoloPagos || cubreConPantalla);

  const setReembolsoSesion = usePosVentaStore((s) => s.setReembolsoSesion);

  const volverAVentas = useCallback(() => {
    if (esReembolso) {
      const ref = operacion?.reembolso;
      setReembolsoSesion({
        activo: true,
        idVenta: ref?.idVenta ?? null,
        motivo: ref?.motivo ?? "",
        observacion: ref?.observacion ?? "",
      });
    }
    clearPendiente();
    navigate("/pos/ventas");
  }, [clearPendiente, navigate, esReembolso, operacion, setReembolsoSesion]);

  const handleValidar = useCallback(async () => {
    if (crearM.isPending || reembolsoM.isPending || previsualizarReembolsoM.isPending) {
      return;
    }

    if (!puedeValidar) {
      if (montoDigitando <= 0 && pagos.length === 0) {
        setToast({
          open: true,
          message: esReembolso
            ? "Ingrese el monto a devolver con signo negativo (ej. -25)."
            : "Ingrese el monto recibido.",
          type: "warning",
        });
      } else if (esReembolso && montoDigitando > 0) {
        setToast({
          open: true,
          message: "Para reembolso debe ingresar el monto con signo negativo.",
          type: "warning",
        });
      } else if (!vista.cubreDeuda) {
        setToast({
          open: true,
          message: `Falta ${fmtQ(vista.falta)} para cubrir la venta. Use otro método o ajuste el monto.`,
          type: "warning",
        });
      }
      return;
    }

    const montoDigitandoAbs = esReembolso ? Math.abs(montoDigitando) : montoDigitando;
    const pagosFinales =
      montoDigitandoAbs > 0
        ? construirPagosFinales(
            pagos,
            metodoActivo,
            montoDigitandoAbs,
            metodos,
            montoObjetivo
          )
        : pagos;

    const suma = roundVenta(pagosFinales.reduce((acc, p) => acc + p.montoAplicado, 0));
    if (Math.abs(suma - montoObjetivo) > 0.01) {
      setToast({
        open: true,
        message: "Los pagos no coinciden con el total de la operación.",
        type: "error",
      });
      return;
    }

    try {
      if (esReembolso) {
        const motivo = operacion?.reembolso?.motivo?.trim?.() ?? "";
        if (!motivo) {
          setToast({
            open: true,
            message: "El motivo del reembolso es obligatorio.",
            type: "warning",
          });
          return;
        }
        const body = {
          idVenta: Number(operacion?.reembolso?.idVenta),
          idCaja,
          motivo,
          observacion: operacion?.reembolso?.observacion ?? null,
          lineas: lineas.map((l) => {
            const base = montoBaseLineaReembolso(l);
            const penalizacion = roundVenta(Number(l.montoPenalizacion) || 0);
            const montoLinea = roundVenta(Math.max(0, base - penalizacion));
            return {
              idVentaDetalle: l.idVentaDetalle,
              cantidadDevuelta: l.cantidad,
              productoRecibido: Boolean(l.productoRecibido ?? true),
              regresaInventario: Boolean(l.regresaInventario ?? false),
              idUbicacion: l.regresaInventario ? l.idUbicacion ?? null : null,
              montoPenalizacion: penalizacion,
              montoBaseDevolucion: base,
              montoReembolsado: montoLinea,
              motivoPenalizacion: l.motivoPenalizacion?.trim() || null,
              observacionDetalle: l.observacionDetalle?.trim() || null,
            };
          }),
          pagos: pagosFinales.map((p) => ({
            idMetodoPago: p.idMetodoPago,
            monto: roundVenta(p.montoAplicado),
            referencia: null,
          })),
        };
        const pre = await previsualizarReembolsoM.mutateAsync(body);
        if (!pre?.data?.esValido) {
          const errores = [
            ...(pre?.data?.errores ?? []),
            ...(pre?.data?.erroresLineas ?? []),
            ...(pre?.data?.erroresPagos ?? []),
          ];
          const detalle =
            errores.length > 0
              ? errores.slice(0, 4).join(" · ")
              : pre?.mensaje || "La prevalidación de reembolso encontró errores.";
          setToast({
            open: true,
            message: detalle,
            type: "error",
          });
          return;
        }
        await reembolsoM.mutateAsync(body);
        limpiarTicketActivo();
        clearParaNuevaVenta();
        setPagos([]);
        resetMonto();
        notificarReembolsoFinalizado();
        navigate("/pos/ventas", { replace: true });
        setToast({
          open: true,
          message: "Reembolso aplicado correctamente.",
          type: "success",
        });
        return;
      }

      const body = buildVentaCrearBody(lineas, pagosFinales, { idCaja });
      const res = await crearM.mutateAsync(body);
      setUltimaVenta({
        idVenta: res.data?.idVenta,
        numeroTicket: res.data?.numeroTicket ?? "",
        total: res.data?.total ?? deudaTotal,
        cambio: res.data?.cambio ?? vista.cambioVista,
        lineas,
        pagos: pagosFinales.map((p) => ({
          nombre: p.nombre,
          montoAplicado: p.montoAplicado,
          montoRecibido: p.montoRecibido,
        })),
      });
      limpiarTicketActivo();
      setTitulo("POS · Ticket");
      setMostrarTicket(true);
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(
          err,
          esReembolso ? "No se pudo aplicar el reembolso." : "No se pudo registrar la venta."
        ),
        type: "error",
      });
    }
  }, [
    puedeValidar,
    esReembolso,
    montoDigitando,
    vista,
    pagos,
    metodoActivo,
    metodos,
    deudaTotal,
    montoObjetivo,
    lineas,
    crearM,
    previsualizarReembolsoM,
    reembolsoM,
    operacion,
    idCaja,
    setUltimaVenta,
    limpiarTicketActivo,
    clearParaNuevaVenta,
    clearPendiente,
    notificarReembolsoFinalizado,
    navigate,
    setTitulo,
    resetMonto,
  ]);

  useEffect(() => {
    setPagos([]);
    resetMonto();
    if (metodoEfectivo?.clave) {
      setMetodoActivo(metodoEfectivo.clave);
    }
  }, [pendienteKey, metodoEfectivo?.clave, resetMonto]);

  useEffect(() => {
    validarRef.current = () => {
      const montoActual = esReembolso ? Math.abs(montoDigitando) : montoDigitando;
      const validoSigno = esReembolso ? montoDigitando < 0 : montoDigitando > 0;
      if (validoSigno && montoActual > 0 && deudaRestanteConfirmada > 0.005 && !vista.cubreDeuda) {
        confirmarPagoParcial(montoActual);
      }
    };
  }, [esReembolso, montoDigitando, deudaRestanteConfirmada, vista.cubreDeuda, confirmarPagoParcial]);

  useEffect(() => {
    setTitulo(esReembolso ? "POS · Reembolso" : "POS · Cobro");
  }, [setTitulo, esReembolso]);

  useEffect(() => {
    if (mostrarTicket) return;
    if (!carrito?.length || lineas.length === 0) {
      navigate("/pos/ventas", { replace: true });
    }
  }, [carrito, lineas.length, navigate, mostrarTicket]);

  const handleNuevaVenta = () => {
    clearParaNuevaVenta();
    setMostrarTicket(false);
    navigate("/pos/ventas", { replace: true });
  };

  const mensajeEstado = useMemo(() => {
    if (!metodoActivo) return "Seleccione método de pago";
    if (esReembolso && montoDigitando >= 0) {
      return "Para reembolso escriba monto negativo (ej. -25)";
    }
    if (!esReembolso && montoDigitando <= 0) return "Introduzca la cantidad recibida";
    if (esReembolso && montoDigitando < 0 && vista.cubreDeuda) {
      return "Cubre el reembolso · Pulse VALIDAR";
    }
    if (vista.cubreDeuda && vista.cambioVista > 0) {
      return `Cubre la venta · Cambio ${fmtQ(vista.cambioVista)}`;
    }
    if (vista.cubreDeuda) return "Cubre la venta · Pulse VALIDAR";
    return `Falta ${fmtQ(vista.falta)} · Puede combinar EFECTIVO y BANCO`;
  }, [metodoActivo, montoDigitando, vista, esReembolso]);

  if (mostrarTicket && ultimaVenta) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-(--color-pos-fondo)">
        <div className="shrink-0 px-4 py-3 border-b border-(--color-pos-borde-suave) bg-(--color-pos-panel)">
          <h1 className="text-center text-xl sm:text-2xl font-black tracking-wide text-(--color-negro)">
            TICKET DE VENTA
          </h1>
        </div>
        <VentaTicketPanel onNuevaVenta={handleNuevaVenta} className="flex-1 min-h-0" />
      </div>
    );
  }

  if (!carrito?.length || lineas.length === 0) {
    return null;
  }

  if (!metodos.length) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <p className="text-sm font-medium text-(--color-rojo-obscuro)">
          Configure <code className="text-xs">VITE_METODOS_PAGO</code> en el archivo .env con los
          IDs de su tabla <strong>metodo_pago</strong> (EFECTIVO y BANCO).
        </p>
        <button
          type="button"
          onClick={volverAVentas}
          className="text-sm font-semibold text-(--color-pagina) hover:underline"
        >
          Volver a ventas
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-(--color-pos-fondo)">
      <div className="shrink-0 px-4 py-3 border-b border-(--color-pos-borde-suave) bg-(--color-pos-panel) flex items-center gap-4">
        <button
          type="button"
          onClick={volverAVentas}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-(--color-pagina) text-(--color-pagina) text-sm font-bold hover:bg-(--color-pos-accent-suave)"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
        <h1 className="flex-1 text-center text-xl sm:text-2xl font-black tracking-wide text-(--color-negro)">
          {esReembolso ? "REEMBOLSO" : "COBRO"}
        </h1>
        <span className="w-20 hidden sm:block" aria-hidden />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <SeccionTitulo>MÉTODO DE PAGO</SeccionTitulo>
              <div className="grid grid-cols-2 gap-0 border border-(--color-pos-borde-suave) rounded-b-lg overflow-hidden bg-(--color-pos-panel)">
                {metodoEfectivo && (
                  <button
                    type="button"
                    onClick={() => seleccionarMetodo("efectivo")}
                    className={cn(
                      "py-8 sm:py-10 text-lg font-black border-r border-(--color-pos-borde-suave) transition-colors",
                      metodoActivo === "efectivo"
                        ? "bg-(--color-pos-accent-suave) text-(--color-pagina)"
                        : "text-(--color-gris-letra) hover:bg-(--color-pagina-3)"
                    )}
                  >
                    <Banknote className="size-6 mx-auto mb-2 opacity-70" />
                    EFECTIVO
                  </button>
                )}
                {metodoBanco && (
                  <button
                    type="button"
                    onClick={() => seleccionarMetodo("banco")}
                    className={cn(
                      "py-8 sm:py-10 text-lg font-black transition-colors",
                      metodoActivo === "banco"
                        ? "bg-(--color-pos-accent-suave) text-(--color-pagina)"
                        : "text-(--color-gris-letra) hover:bg-(--color-pagina-3)"
                    )}
                  >
                    <Building2 className="size-6 mx-auto mb-2 opacity-70" />
                    BANCO
                  </button>
                )}
              </div>
            </div>

            <div>
              <SeccionTitulo>RESUMEN</SeccionTitulo>
              <div className="min-h-[8rem] border border-t-0 border-(--color-pos-borde-suave) rounded-b-lg bg-(--color-pos-panel) p-3 space-y-2">
                {pagos.length === 0 ? (
                  <p className="text-sm text-(--color-pos-texto-muted) py-4 text-center leading-relaxed">
                    {esReembolso
                      ? "Puede dividir la devolución por método; al cambiar se guarda aquí."
                      : "Si divide el pago, al cambiar de método se guarda el monto anterior aquí."}
                  </p>
                ) : (
                  pagos.map((p, idx) => (
                    <div
                      key={`${p.clave}-${idx}`}
                      className="flex items-center gap-2 text-sm font-semibold border-b border-(--color-pos-borde-suave)/60 pb-2 last:border-0"
                    >
                      <button
                        type="button"
                        onClick={() => editarPago(idx)}
                        title="Editar este pago"
                        className="flex flex-1 items-center gap-1.5 text-left rounded px-1 py-0.5 hover:bg-(--color-pos-accent-suave) hover:text-(--color-pagina) transition-colors"
                      >
                        <Pencil className="size-3.5 opacity-60 shrink-0" />
                        <span>{p.nombre}</span>
                      </button>
                      <span className="tabular-nums">
                        {fmtQ(esReembolso ? -p.montoAplicado : p.montoAplicado)}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarPago(idx)}
                        aria-label={`Quitar pago ${p.nombre}`}
                        title="Quitar este pago"
                        className="rounded p-1 text-(--color-pos-texto-muted) hover:bg-(--color-rojo)/10 hover:text-(--color-rojo-obscuro) transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))
                )}
                {pagos.length > 0 && (
                  <p className="text-[11px] text-(--color-pos-texto-muted) pt-1 leading-snug">
                    Toca un pago para editar su monto o usa la X para quitarlo.
                  </p>
                )}
                {pagos.length > 0 && deudaRestanteConfirmada > 0.005 && (
                  <p className="text-xs text-(--color-pos-texto-muted) pt-1">
                    Pendiente en pantalla para completar{" "}
                    {fmtQ(esReembolso ? -deudaRestanteConfirmada : deudaRestanteConfirmada)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <div
              className={cn(
                "flex-1 min-h-[12rem] border-2 rounded-xl bg-(--color-pos-panel) flex flex-col items-center justify-center p-6 transition-colors",
                edicionActiva && "border-(--color-pagina) ring-2 ring-(--color-pagina)/20",
                !edicionActiva && "border-(--color-pos-borde-suave)",
                vista.cubreDeuda && montoDigitando > 0 && "border-(--color-esmeralda-hover)/60"
              )}
            >
              <p className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-(--color-pagina)">
                {textoMonto()}
              </p>
              <p
                className={cn(
                  "text-sm mt-3 text-center font-medium",
                  vista.cubreDeuda && montoDigitando > 0
                    ? "text-(--color-esmeralda-hover)"
                    : montoDigitando > 0
                      ? "text-(--color-rojo-obscuro)"
                      : "text-(--color-pos-texto-muted)"
                )}
              >
                {mensajeEstado}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-3 py-3">
                <p className="text-xs font-bold text-(--color-pos-texto-muted)">Deuda restante</p>
                <p
                  className={cn(
                    "text-xl font-black tabular-nums mt-1",
                    vista.deudaRestanteVista <= 0.005
                      ? "text-(--color-esmeralda-hover)"
                      : "text-(--color-pagina)"
                  )}
                >
                  {fmtQ(vista.deudaRestanteVista)}
                </p>
              </div>
              <div className="rounded-lg border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-3 py-3">
                <p className="text-xs font-bold text-(--color-pos-texto-muted)">Deuda total</p>
                <p className="text-xl font-black tabular-nums mt-1">
                  {fmtQ(esReembolso ? -montoObjetivo : deudaTotal)}
                </p>
              </div>
              <div className="rounded-lg border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-3 py-3">
                <p className="text-xs font-bold text-(--color-pos-texto-muted)">Cambio</p>
                <p className="text-xl font-black text-(--color-pagina) tabular-nums mt-1">
                  {fmtQ(vista.cambioVista)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-(--color-pos-borde-suave) bg-(--color-pos-panel)">
        <button
          type="button"
          disabled={
            !puedeValidar ||
            crearM.isPending ||
            reembolsoM.isPending ||
            previsualizarReembolsoM.isPending
          }
          onClick={() => void handleValidar()}
          className={cn(
            "w-full max-w-5xl mx-auto flex flex-col items-center justify-center gap-2 py-5 rounded-xl font-black text-(--color-blanco) transition-colors",
            puedeValidar
              ? "bg-(--color-pagina) hover:opacity-90"
              : "bg-(--color-gris-claro) cursor-not-allowed"
          )}
        >
          <BadgeCheck className="size-10" strokeWidth={2} />
          <span className="text-lg tracking-widest">
            {crearM.isPending || reembolsoM.isPending || previsualizarReembolsoM.isPending
              ? "PROCESANDO…"
              : esReembolso
                ? "REEMBOLSAR"
                : "VALIDAR"}
          </span>
        </button>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
};

export default CobroCaja;
