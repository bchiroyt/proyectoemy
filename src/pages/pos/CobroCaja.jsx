import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, Banknote, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { usePosVentaStore } from "@/context/usePosVentaStore";
import { usePosTicketsStore } from "@/context/usePosTicketsStore";
import { useMontoTeclado } from "@/hooks/useMontoTeclado";
import { useCrearVentaMutation } from "@/hooks/queries/useVentaQueries";
import { useMiCajaActivaQuery } from "@/hooks/queries/useCajaQueries";
import { getMetodosPagoConfig } from "@/constants/metodosPago";
import { buildVentaCrearBody, roundVenta } from "@/lib/ventaMappers";
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
  const ultimaVenta = usePosVentaStore((s) => s.ultimaVenta);
  const setUltimaVenta = usePosVentaStore((s) => s.setUltimaVenta);
  const clearParaNuevaVenta = usePosVentaStore((s) => s.clearParaNuevaVenta);
  const limpiarTicketActivo = usePosTicketsStore((s) => s.limpiarTicketActivo);

  const [mostrarTicket, setMostrarTicket] = useState(false);

  const metodos = useMemo(() => getMetodosPagoConfig(), []);
  const metodoEfectivo = metodos.find((m) => m.clave === "efectivo");
  const metodoBanco = metodos.find((m) => m.clave === "banco");

  const [metodoActivo, setMetodoActivo] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const crearM = useCrearVentaMutation();
  const miCajaQ = useMiCajaActivaQuery();
  const idCaja = miCajaQ.data?.data?.idCaja ?? null;
  const validarRef = useRef(null);

  const lineas = useMemo(
    () => (carrito ?? []).filter((l) => l.cantidad > 0),
    [carrito]
  );

  const deudaTotal = useMemo(
    () =>
      roundVenta(
        lineas.reduce((acc, l) => acc + l.precio * l.cantidad, 0) || totalStore || 0
      ),
    [lineas, totalStore]
  );

  const metodoSeleccionado = metodos.find((m) => m.clave === metodoActivo);

  const deudaRestanteConfirmada = useMemo(
    () =>
      roundVenta(
        Math.max(
          0,
          deudaTotal - pagos.reduce((acc, p) => acc + p.montoAplicado, 0)
        )
      ),
    [deudaTotal, pagos]
  );

  const tecladoHabilitado =
    metodoActivo != null && (deudaRestanteConfirmada > 0.005 || pagos.length === 0);

  const {
    monto: montoDigitando,
    textoMonto,
    reset: resetMonto,
    activarOverwrite,
    edicionActiva,
  } = useMontoTeclado({
    enabled: tecladoHabilitado,
    onEnter: () => validarRef.current?.(),
  });

  const vista = useMemo(
    () =>
      calcularVistaCobro({
        deudaTotal,
        pagos,
        metodo: metodoSeleccionado,
        montoDigitando,
      }),
    [deudaTotal, pagos, metodoSeleccionado, montoDigitando]
  );

  const confirmarPagoParcial = useCallback(
    (montoRecibido, claveMetodo = metodoActivo) => {
      const metodo = metodos.find((m) => m.clave === claveMetodo);
      if (!metodo || montoRecibido <= 0) return false;

      const aplicadoPrevio = roundVenta(
        pagos.reduce((acc, p) => acc + p.montoAplicado, 0)
      );
      const deudaRest = roundVenta(Math.max(0, deudaTotal - aplicadoPrevio));
      if (deudaRest <= 0.005) return false;

      const linea = crearLineaPago(metodo, montoRecibido, deudaRest);
      setPagos((prev) => [...prev, linea]);
      resetMonto();
      activarOverwrite();
      return true;
    },
    [metodoActivo, metodos, pagos, deudaTotal, resetMonto, activarOverwrite]
  );

  const seleccionarMetodo = useCallback(
    (clave) => {
      if (
        clave !== metodoActivo &&
        montoDigitando > 0 &&
        deudaRestanteConfirmada > 0.005
      ) {
        confirmarPagoParcial(montoDigitando, metodoActivo);
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
      deudaRestanteConfirmada,
      confirmarPagoParcial,
      resetMonto,
      activarOverwrite,
    ]
  );

  const cubreSoloPagos =
    pagos.length > 0 && deudaRestanteConfirmada <= 0.005 && montoDigitando <= 0;
  const cubreConPantalla =
    montoDigitando > 0 && vista.cubreDeuda && metodoActivo != null;
  const puedeValidar = metodos.length > 0 && (cubreSoloPagos || cubreConPantalla);

  const handleValidar = useCallback(async () => {
    if (crearM.isPending) return;

    if (!puedeValidar) {
      if (montoDigitando <= 0 && pagos.length === 0) {
        setToast({
          open: true,
          message: "Ingrese el monto recibido.",
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

    const pagosFinales =
      montoDigitando > 0
        ? construirPagosFinales(
            pagos,
            metodoActivo,
            montoDigitando,
            metodos,
            deudaTotal
          )
        : pagos;

    const suma = roundVenta(pagosFinales.reduce((acc, p) => acc + p.montoAplicado, 0));
    if (Math.abs(suma - deudaTotal) > 0.01) {
      setToast({
        open: true,
        message: "Los pagos no coinciden con el total de la venta.",
        type: "error",
      });
      return;
    }

    try {
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
          "No se pudo registrar la venta."
        ),
        type: "error",
      });
    }
  }, [
    crearM.isPending,
    puedeValidar,
    cubreSoloPagos,
    montoDigitando,
    vista,
    pagos,
    metodoActivo,
    metodos,
    deudaTotal,
    lineas,
    crearM,
    idCaja,
    setUltimaVenta,
    limpiarTicketActivo,
    setTitulo,
  ]);

  validarRef.current = () => {
    if (montoDigitando > 0 && deudaRestanteConfirmada > 0.005 && !vista.cubreDeuda) {
      confirmarPagoParcial(montoDigitando);
    }
  };

  useEffect(() => {
    setTitulo("POS · Cobro");
  }, [setTitulo]);

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

  useEffect(() => {
    if (metodos.length && !metodoActivo) {
      setMetodoActivo(metodoEfectivo?.clave ?? metodos[0].clave);
      activarOverwrite();
    }
  }, [metodos.length, metodoEfectivo, metodoActivo, activarOverwrite]);

  const mensajeEstado = useMemo(() => {
    if (!metodoActivo) return "Seleccione método de pago";
    if (montoDigitando <= 0) return "Introduzca la cantidad recibida";
    if (vista.cubreDeuda && vista.cambioVista > 0) {
      return `Cubre la venta · Cambio ${fmtQ(vista.cambioVista)}`;
    }
    if (vista.cubreDeuda) return "Cubre la venta · Pulse VALIDAR";
    return `Falta ${fmtQ(vista.falta)} · Puede combinar EFECTIVO y BANCO`;
  }, [metodoActivo, montoDigitando, vista]);

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
          onClick={() => navigate("/pos/ventas")}
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
          onClick={() => navigate("/pos/ventas")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-(--color-pagina) text-(--color-pagina) text-sm font-bold hover:bg-(--color-pos-accent-suave)"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
        <h1 className="flex-1 text-center text-xl sm:text-2xl font-black tracking-wide text-(--color-negro)">
          COBRO
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
                    Si divide el pago, al cambiar de método se guarda el monto anterior aquí.
                  </p>
                ) : (
                  pagos.map((p, idx) => (
                    <div
                      key={`${p.clave}-${idx}`}
                      className="flex justify-between text-sm font-semibold border-b border-(--color-pos-borde-suave)/60 pb-2 last:border-0"
                    >
                      <span>{p.nombre}</span>
                      <span className="tabular-nums">{fmtQ(p.montoAplicado)}</span>
                    </div>
                  ))
                )}
                {pagos.length > 0 && deudaRestanteConfirmada > 0.005 && (
                  <p className="text-xs text-(--color-pos-texto-muted) pt-1">
                    Pendiente en pantalla para completar {fmtQ(deudaRestanteConfirmada)}
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
                <p className="text-xl font-black tabular-nums mt-1">{fmtQ(deudaTotal)}</p>
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
          disabled={!puedeValidar || crearM.isPending}
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
            {crearM.isPending ? "PROCESANDO…" : "VALIDAR"}
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
