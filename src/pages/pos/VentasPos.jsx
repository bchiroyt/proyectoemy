import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Info, RotateCcw, ScanBarcode } from "lucide-react";
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
import { MovimientoCajaDialog } from "@/components/caja/MovimientoCajaDialog";
import { CatalogoProductoCard } from "@/pages/pos/components/CatalogoProductoCard";
import { CarritoPanel } from "@/pages/pos/components/CarritoPanel";
import { useCarritoCantidadTeclado } from "@/hooks/useCarritoCantidadTeclado";
import { usePosVentaStore } from "@/context/usePosVentaStore";
import Toast from "@/components/ui/Toast";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 8;
const CATEGORIA_TODO = "todo";

const VentasPOS = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();
  const miCajaQ = useMiCajaActivaQuery();
  const idCaja = miCajaQ.data?.data?.idCaja;
  const flashTimerRef = useRef(0);
  const scanMsgTimerRef = useRef(0);

  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [debouncedCriterio, setDebouncedCriterio] = useState("");
  const [categoriaId, setCategoriaId] = useState(CATEGORIA_TODO);
  const [pagina, setPagina] = useState(1);
  const [flashRowId, setFlashRowId] = useState(null);
  const [scanFeedback, setScanFeedback] = useState(null);
  const [gastosOpen, setGastosOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const setPendiente = usePosVentaStore((s) => s.setPendiente);

  const {
    lineaSeleccionadaId,
    edicionActiva,
    seleccionarLinea,
    deseleccionar,
    cantidadVisible,
  } = useCarritoCantidadTeclado(carrito, setCarrito);

  useEffect(() => {
    setTitulo("POS · Ventas");
  }, [setTitulo]);

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
    (producto, notaLinea) => {
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
      seleccionarLinea(producto.id);
    },
    [seleccionarLinea]
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
            agregarProducto(producto);
            dispararFlash(producto.id);
            setScanFeedback({ type: "ok", nombre: producto.nombre });
          } else {
            setScanFeedback({ type: "no-encontrado", codigo });
          }
          window.clearTimeout(scanMsgTimerRef.current);
          scanMsgTimerRef.current = window.setTimeout(() => setScanFeedback(null), 2200);
        } catch {
          setScanFeedback({ type: "error", codigo });
          window.clearTimeout(scanMsgTimerRef.current);
          scanMsgTimerRef.current = window.setTimeout(() => setScanFeedback(null), 2800);
        }
      })();
    },
    [agregarProducto, dispararFlash]
  );

  useBarcodeScanner(handleBarcodeScan, {
    maxInterKeyMs: BARCODE_DEFAULT_MAX_INTER_KEY_MS,
    minLength: 3,
    enabled: !edicionActiva,
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
            <div className="flex flex-wrap gap-2">
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
                  En Usuarios → Roles, asigne al menos <strong>CAJAS · Leer</strong> o{" "}
                  <strong>VENTAS · Leer</strong> al rol del cajero. Reinicie el backend si acaba de
                  actualizar permisos.
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

          <div className="flex justify-end items-center gap-3 mt-4 text-sm text-(--color-pos-texto-muted)">
            <span className="tabular-nums">
              {totalCount === 0
                ? "0 / 0"
                : `${sliceStart + 1}-${Math.min(sliceStart + PAGE_SIZE, totalCount)} / ${totalCount}`}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={paginaSegura <= 1}
                onClick={() => setPagina((x) => Math.max(1, x - 1))}
                className="px-2 py-1 rounded-lg bg-(--color-pos-boton-primario) text-(--color-blanco) disabled:opacity-40 hover:bg-(--color-pos-boton-primario-hover)"
              >
                ‹
              </button>
              <button
                type="button"
                disabled={paginaSegura >= totalPaginas}
                onClick={() => setPagina((x) => Math.min(totalPaginas, x + 1))}
                className="px-2 py-1 rounded-lg bg-(--color-pos-boton-primario) text-(--color-blanco) disabled:opacity-40 hover:bg-(--color-pos-boton-primario-hover)"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t-2 border-(--color-pagina)/35 bg-(--color-pos-scan-banner) px-3 py-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 max-w-4xl">
            <div className="flex items-center gap-2 text-(--color-pagina) shrink-0">
              <ScanBarcode className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-bold leading-tight">Escáner listo (Emy-POS)</p>
                <p className="text-xs text-(--color-pos-texto-muted) leading-snug mt-0.5">
                  No hace falta hacer clic: el lector envía el código y se agrega al carrito. El buscador de arriba no se mezcla con el escáner.
                </p>
              </div>
            </div>
            <div className="flex-1 min-w-0 text-sm">
              {scanFeedback?.type === "ok" && (
                <p className="font-semibold text-(--color-esmeralda-hover)">
                  Agregado: {scanFeedback.nombre}
                </p>
              )}
              {scanFeedback?.type === "no-encontrado" && (
                <p className="font-medium text-(--color-rojo-obscuro)">
                  Código no encontrado:{" "}
                  <span className="font-mono tabular-nums">{scanFeedback.codigo}</span>
                </p>
              )}
              {scanFeedback?.type === "error" && (
                <p className="font-medium text-(--color-rojo-obscuro)">
                  Error al buscar el producto. Intente de nuevo.
                </p>
              )}
              {!scanFeedback && (
                <p className="text-(--color-pos-texto-muted) text-xs sm:text-sm">
                  Escanee el código de barras o SKU del producto para agregarlo al carrito.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <MovimientoCajaDialog
        open={gastosOpen}
        onOpenChange={setGastosOpen}
        idCaja={idCaja}
        dialogTitle="Registrar gasto de caja"
      />

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
