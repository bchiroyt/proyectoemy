import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Info, Plus, RotateCcw, ScanBarcode, ScanLine, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { cn } from "@/lib/utils";
import {
  useBarcodeScanner,
  BARCODE_DEFAULT_MAX_INTER_KEY_MS,
} from "@/hooks/useBarcodeScanner";
import { fetchProductoByCodigo } from "@/services/posProductoService";
import { useMiCajaActivaQuery } from "@/hooks/queries/useCajaQueries";
import {
  useVentaCatalogoQuery,
  useVentaCategoriasQuery,
} from "@/hooks/queries/useVentaQueries";
import { MovimientoCajaDialog } from "@/pages/caja/components/MovimientoCajaDialog";
import { CambiarCajeroDialog } from "@/pages/caja/components/CambiarCajeroDialog";
import { useHeaderUserActionStore } from "@/context/useHeaderUserActionStore";
import { CatalogoProductoCard } from "@/pages/pos/components/CatalogoProductoCard";
import { CarritoPanel } from "@/pages/pos/components/CarritoPanel";
import { useCarritoCantidadTeclado } from "@/hooks/useCarritoCantidadTeclado";
import { usePosVentaStore } from "@/context/usePosVentaStore";
import {
  usePosTicketsStore,
  LIMITE_TICKETS_ESPERA,
} from "@/context/usePosTicketsStore";
import Toast from "@/components/ui/Toast";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 8;
const CATEGORIA_TODO = "todo";

const VentasPOS = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();
  const miCajaQ = useMiCajaActivaQuery();
  const idCaja = miCajaQ.data?.data?.idCaja;
  const flashTimerRef = useRef(0);
  const scanMsgTimerRef = useRef(0);

  const tickets = usePosTicketsStore((s) => s.tickets);
  const activeId = usePosTicketsStore((s) => s.activeId);
  const setActivo = usePosTicketsStore((s) => s.setActivo);
  const nuevoTicket = usePosTicketsStore((s) => s.nuevoTicket);
  const cerrarTicket = usePosTicketsStore((s) => s.cerrarTicket);
  const setCarrito = usePosTicketsStore((s) => s.setCarritoActivo);

  const ticketActivo = tickets.find((t) => t.id === activeId) ?? tickets[0];
  const carrito = ticketActivo?.carrito ?? [];

  const [busqueda, setBusqueda] = useState("");
  const [debouncedCriterio, setDebouncedCriterio] = useState("");
  const [categoriaId, setCategoriaId] = useState(CATEGORIA_TODO);
  const [pagina, setPagina] = useState(1);
  const [flashRowId, setFlashRowId] = useState(null);
  const [scanFeedback, setScanFeedback] = useState(null);
  const [scanModal, setScanModal] = useState(null);
  const [gastosOpen, setGastosOpen] = useState(false);
  const [cambiarCajeroOpen, setCambiarCajeroOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const setPendiente = usePosVentaStore((s) => s.setPendiente);
  const setHeaderAction = useHeaderUserActionStore((s) => s.setAction);
  const clearHeaderAction = useHeaderUserActionStore((s) => s.clearAction);

  const {
    lineaSeleccionadaId,
    seleccionarLinea,
    deseleccionar,
    cantidadVisible,
  } = useCarritoCantidadTeclado(carrito, setCarrito);

  useEffect(() => {
    setTitulo("POS · Ventas");
  }, [setTitulo]);

  useEffect(() => {
    setHeaderAction(() => setCambiarCajeroOpen(true), "Cambiar cajero / operador");
    return () => clearHeaderAction();
  }, [setHeaderAction, clearHeaderAction]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedCriterio(busqueda.trim()), 350);
    return () => window.clearTimeout(t);
  }, [busqueda]);

  const categoriasQ = useVentaCategoriasQuery({ enabled: !!idCaja });

  const categoriaLabel =
    categoriaId === CATEGORIA_TODO
      ? ""
      : categoriasQ.data?.find((c) => c.id === categoriaId)?.label ?? "";

  const criterioApi = debouncedCriterio || categoriaLabel || undefined;

  const catalogoQ = useVentaCatalogoQuery(
    { page: pagina, pageSize: PAGE_SIZE, criterio: criterioApi },
    { enabled: !!idCaja }
  );

  const productosPagina = catalogoQ.data?.items ?? [];
  const totalCount = catalogoQ.data?.totalCount ?? 0;
  const totalPaginas = catalogoQ.data?.totalPages ?? 1;
  const paginaSegura = Math.min(pagina, Math.max(1, totalPaginas));
  const sliceStart = totalCount === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE;

  useEffect(() => {
    setPagina(1);
  }, [debouncedCriterio, categoriaId]);

  useEffect(() => {
    if (!miCajaQ.isLoading && !miCajaQ.data?.data) {
      navigate("/pos", { replace: true });
    }
  }, [miCajaQ.isLoading, miCajaQ.data, navigate]);

  const agregarProducto = useCallback(
    (producto, notaLinea, opts = {}) => {
      const { seleccionar = true } = opts;
      setCarrito((prev) => {
        const existe = prev.find((p) => p.id === producto.id);
        if (existe) {
          return prev.map((p) =>
            p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
          );
        }
        const base = { ...producto, cantidad: 1 };
        if (notaLinea) return [...prev, { ...base, notaLinea }];
        return [...prev, base];
      });
      // El escaneo NO selecciona la línea: si lo hiciera, se activaría la edición
      // de cantidad por teclado y el siguiente escaneo se interpretaría como cantidad.
      if (seleccionar) {
        seleccionarLinea(producto.id);
      }
    },
    [seleccionarLinea, setCarrito]
  );

  const dispararFlash = useCallback((productoId) => {
    setFlashRowId(productoId);
    window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlashRowId(null), 520);
  }, []);

  const handleBarcodeScan = useCallback(
    (codigo) => {
      void (async () => {
        try {
          const producto = await fetchProductoByCodigo(codigo);
          if (producto) {
            agregarProducto(producto, undefined, { seleccionar: false });
            dispararFlash(producto.id);
            setScanModal(null);
            setScanFeedback({ type: "ok", nombre: producto.nombre });
            window.clearTimeout(scanMsgTimerRef.current);
            scanMsgTimerRef.current = window.setTimeout(() => setScanFeedback(null), 2200);
          } else {
            setScanFeedback(null);
            setScanModal({ type: "no-encontrado", codigo });
          }
        } catch {
          setScanFeedback(null);
          setScanModal({ type: "error", codigo });
        }
      })();
    },
    [agregarProducto, dispararFlash]
  );

  useBarcodeScanner(handleBarcodeScan, {
    maxInterKeyMs: BARCODE_DEFAULT_MAX_INTER_KEY_MS,
    minLength: 3,
    // Siempre activo: aunque haya una línea seleccionada para editar cantidad, el
    // editor de cantidad ignora las ráfagas del lector, así que no hay conflicto.
    enabled: true,
  });

  useEffect(
    () => () => {
      window.clearTimeout(flashTimerRef.current);
      window.clearTimeout(scanMsgTimerRef.current);
    },
    []
  );

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  const irACobro = () => {
    const lineas = carrito.filter((p) => p.cantidad > 0);
    if (!lineas.length) {
      setToast({
        open: true,
        message: "Agregue al menos un producto con cantidad mayor a cero.",
        type: "warning",
      });
      return;
    }
    const totalLineas = lineas.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
    if (totalLineas <= 0) {
      setToast({
        open: true,
        message: "El total de la venta debe ser mayor que cero.",
        type: "warning",
      });
      return;
    }
    deseleccionar();
    setPendiente(lineas, totalLineas);
    navigate("/pos/cobro");
  };

  const handleNuevoTicket = () => {
    deseleccionar();
    const creado = nuevoTicket();
    if (!creado) {
      setToast({
        open: true,
        message: `Máximo ${LIMITE_TICKETS_ESPERA} ventas en espera. Cobre o cierre una antes de abrir otra.`,
        type: "warning",
      });
    }
  };

  const handleCambiarTicket = (id) => {
    if (id === activeId) return;
    deseleccionar();
    setActivo(id);
  };

  const handleCerrarTicket = (id) => {
    deseleccionar();
    cerrarTicket(id);
  };

  const ticketsTabs = (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-2 py-1.5">
      {tickets.map((t, idx) => {
        const activo = t.id === activeId;
        const numLineas = t.carrito.filter((p) => p.cantidad > 0).length;
        return (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            onClick={() => handleCambiarTicket(t.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCambiarTicket(t.id);
              }
            }}
            className={cn(
              "group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors",
              activo
                ? "bg-(--color-pagina) text-(--color-blanco)"
                : "bg-(--color-gris-claro-2) text-foreground hover:opacity-90"
            )}
          >
            <span className="whitespace-nowrap">Venta {idx + 1}</span>
            {numLineas > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  activo
                    ? "bg-(--color-blanco)/25 text-(--color-blanco)"
                    : "bg-(--color-pagina)/15 text-(--color-pagina)"
                )}
              >
                {numLineas}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCerrarTicket(t.id);
              }}
              aria-label={`Cerrar venta ${idx + 1}`}
              className={cn(
                "ml-0.5 rounded p-0.5 transition-colors",
                activo
                  ? "text-(--color-blanco) hover:bg-(--color-blanco)/20"
                  : "text-(--color-pos-texto-muted) hover:bg-black/10"
              )}
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={handleNuevoTicket}
        disabled={tickets.length >= LIMITE_TICKETS_ESPERA}
        title={
          tickets.length >= LIMITE_TICKETS_ESPERA
            ? `Máximo ${LIMITE_TICKETS_ESPERA} ventas en espera`
            : "Nueva venta en espera"
        }
        className="shrink-0 rounded-lg p-1.5 text-(--color-pagina) transition-colors hover:bg-(--color-pos-accent-suave) disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );

  const categoriasFiltro = [
    { id: CATEGORIA_TODO, label: "Todo" },
    ...(categoriasQ.data ?? []),
  ];

  if (miCajaQ.isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!miCajaQ.data?.data || !idCaja) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 bg-(--color-pos-fondo) text-foreground">
      <CarritoPanel
        carrito={carrito}
        setCarrito={setCarrito}
        flashRowId={flashRowId}
        total={total}
        lineaSeleccionadaId={lineaSeleccionadaId}
        seleccionarLinea={seleccionarLinea}
        deseleccionar={deseleccionar}
        cantidadVisible={cantidadVisible}
        tabsSlot={ticketsTabs}
      >
          <button
            type="button"
            className="w-full text-sm font-semibold py-2 rounded-lg bg-(--color-pos-accent-suave) text-(--color-pagina) hover:bg-(--color-pos-accent-suave-hover) transition-colors"
          >
            Historial de transacciones
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg bg-(--color-pos-accent-suave) text-(--color-pagina) hover:bg-(--color-pos-accent-suave-hover) transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              Información
            </button>
            <button
              type="button"
              className="text-xs font-semibold py-2 rounded-lg bg-(--color-pos-accent-suave) text-(--color-pagina) hover:bg-(--color-pos-accent-suave-hover) transition-colors"
            >
              % Porcentaje
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg bg-(--color-pos-accent-suave) text-(--color-pagina) hover:bg-(--color-pos-accent-suave-hover) transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rembolso
            </button>
            <button
              type="button"
              className="text-xs font-semibold py-2 rounded-lg bg-(--color-pos-accent-suave) text-(--color-pagina) hover:bg-(--color-pos-accent-suave-hover) transition-colors"
            >
              Monto fijo
            </button>
          </div>

          <button
            type="button"
            onClick={irACobro}
            disabled={carrito.every((p) => p.cantidad <= 0)}
            className="w-full mt-1 flex items-center justify-center gap-2 bg-(--color-pos-boton-primario) text-(--color-blanco) font-bold py-3 rounded-xl hover:bg-(--color-pos-boton-primario-hover) transition-colors disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            Confirmar compra
          </button>
      </CarritoPanel>

      <section className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="shrink-0 p-3 sm:p-4 space-y-3 border-b border-(--color-pos-borde-suave) bg-(--color-pos-panel)/95">
          <div className="flex flex-wrap items-center gap-3">
            <div data-barcode-listener="off" className="flex flex-1 min-w-48 max-w-md">
              <BuscadorPrincipal
                placeholder="Buscar producto por nombre o código..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                className="max-w-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGastosOpen(true)}
                className="px-4 py-2 rounded-xl bg-(--color-pagina) text-(--color-blanco) text-sm font-semibold hover:opacity-90"
              >
                Gastos
              </button>
              <button
                type="button"
                onClick={() => navigate("/pos/cierre")}
                className="px-4 py-2 rounded-xl bg-(--color-pagina) text-(--color-blanco) text-sm font-semibold hover:opacity-90"
              >
                Cerrar turno
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categoriasFiltro.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategoriaId(c.id);
                  setPagina(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                  categoriaId === c.id
                    ? "bg-(--color-pagina) text-(--color-blanco)"
                    : "bg-(--color-gris-claro-2) text-foreground hover:opacity-90"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
          {catalogoQ.isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-w-[1200px]">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Skeleton key={i} className="h-[9.5rem] rounded-xl" />
              ))}
            </div>
          )}

          {catalogoQ.isError && (
            <div className="text-center py-12 px-4 max-w-md mx-auto">
              <p className="text-(--color-rojo-obscuro) text-sm font-medium">
                {catalogoQ.error?.message ?? "No se pudo cargar el catálogo."}
              </p>
              {String(catalogoQ.error?.message ?? "").includes("permiso") && (
                <p className="text-(--color-pos-texto-muted) text-xs mt-2 leading-relaxed">
                  En Usuarios → Roles, asigne al rol del cajero permisos de <strong>CAJAS</strong>:
                  Leer (catálogo y ticket), Actualizar (cobrar) y Crear (abrir caja). Los cambios
                  aplican al siguiente request; no hace falta reiniciar el servidor.
                </p>
              )}
            </div>
          )}

          {!catalogoQ.isLoading && !catalogoQ.isError && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-w-[1200px]">
              {productosPagina.map((p) => (
                <CatalogoProductoCard
                  key={p.idVariante}
                  producto={p}
                  onAgregar={agregarProducto}
                />
              ))}
            </div>
          )}

          {!catalogoQ.isLoading && !catalogoQ.isError && totalCount === 0 && (
            <p className="text-center text-(--color-pos-texto-muted) py-12">Sin resultados.</p>
          )}
          
        </div>
      </section>

      <MovimientoCajaDialog
        open={gastosOpen}
        onOpenChange={setGastosOpen}
        idCaja={idCaja}
        dialogTitle="Registrar gasto de caja"
      />

      <CambiarCajeroDialog
        open={cambiarCajeroOpen}
        onOpenChange={setCambiarCajeroOpen}
        idCaja={idCaja}
        onChanged={(nuevo) => {
          deseleccionar();
          setToast({
            open: true,
            message: `Ahora opera ${nuevo?.nombreMostrar ?? "el nuevo cajero"}. Las ventas se registrarán a su nombre.`,
            type: "success",
          });
        }}
      />

      <Dialog open={!!scanModal} onOpenChange={(v) => !v && setScanModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-(--color-rojo-obscuro)">
              <ScanLine className="size-5" />
              {scanModal?.type === "error"
                ? "No se pudo leer el código"
                : "Código no encontrado"}
            </DialogTitle>
            <DialogDescription className="pt-1">
              {scanModal?.type === "error" ? (
                <>Ocurrió un error al buscar el producto. Verifique su conexión e intente escanear de nuevo.</>
              ) : (
                <>
                  El código{" "}
                  <span className="font-mono font-semibold text-foreground">{scanModal?.codigo}</span>{" "}
                  no está asociado a ningún producto en el sistema.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              autoFocus
              onClick={() => setScanModal(null)}
              className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
            >
              Volver al carrito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
};

export default VentasPOS;
