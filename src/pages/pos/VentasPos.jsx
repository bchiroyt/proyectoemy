import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Check, Info, RotateCcw, ScanLine, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigationStore } from "@/context/useNavigationStore";
import { cn } from "@/lib/utils";
import { useBarcodeScanner, BARCODE_DEFAULT_MAX_INTER_KEY_MS } from "@/hooks/useBarcodeScanner";
import { fetchProductoByCodigo } from "@/services/posProductoService";
import { useMiCajaActivaQuery } from "@/hooks/queries/useCajaQueries";
import { useVentaCatalogoQuery, useVentaCategoriasQuery } from "@/hooks/queries/useVentaQueries";
import { MovimientoCajaDialog } from "@/pages/caja/components/MovimientoCajaDialog";
import { CambiarCajeroDialog } from "@/pages/caja/components/CambiarCajeroDialog";
import { HistorialTransaccionesDialog } from "@/pages/caja/components/HistorialTransaccionesDialog";
import { useHeaderUserActionStore } from "@/context/useHeaderUserActionStore";
import { useHeaderTicketsStore } from "@/context/useHeaderTicketsStore";
import { CatalogoProductoCard } from "@/pages/pos/components/CatalogoProductoCard";
import { CarritoPanel } from "@/pages/pos/components/CarritoPanel";
import { ReembolsoLineaDetalleDialog } from "@/pages/pos/components/ReembolsoLineaDetalleDialog";
import { CerrarTurnoMenu } from "@/pages/pos/components/CerrarTurnoMenu";
import { useCarritoCantidadTeclado } from "@/hooks/useCarritoCantidadTeclado";
import { usePosVentaStore } from "@/context/usePosVentaStore";
import {
  mapReembolsoCatalogos,
  mapReembolsoPreparacion,
  mapReembolsoPrevisualizacion,
  unwrapReembolsoVentasDisponibles,
} from "@/lib/reembolsoMappers";
import { subtotalLinea, roundVenta, descuentoMontoLinea } from "@/lib/ventaMappers";
import {
  useReembolsoPreparacionQuery, useReembolsoVentasDisponiblesQuery,
  QK_REEMBOLSOS
} from "@/hooks/queries/useReembolsoQueries";
import { usePosTicketsStore, LIMITE_TICKETS_ESPERA } from "@/context/usePosTicketsStore";
import Toast from "@/components/ui/Toast";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Paginacion from "@/components/shared/Paginacion";

const PAGE_SIZE = 30;
const CATEGORIA_TODO = "todo";
const CATALOGO_GRID_CLASS =
  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full";
const CAMPOS_CATALOGO_LINEA = [
  "idVariante",
  "sku",
  "nombre",
  "nombreProducto",
  "descripcion",
  "marca",
  "categoria",
  "categoriaSlug",
  "talla",
  "color",
  "presentacion",
  "precio",
  "costoPromedioActual",
  "stockActual",
  "codigo",
];

const mergeCatalogoEnLineaCarrito = (linea, producto, cantidad = linea.cantidad) => ({
  ...linea,
  ...producto,
  cantidad,
  descuentoTipo: linea.descuentoTipo,
  descuentoValor: linea.descuentoValor,
  notaLinea: linea.notaLinea,
});

const VentasPOS = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reembolsoCleanupPending = usePosVentaStore((s) => s.reembolsoCleanupPending);
  const consumeReembolsoCleanup = usePosVentaStore((s) => s.consumeReembolsoCleanup);
  const miCajaQ = useMiCajaActivaQuery();
  const idCaja = miCajaQ.data?.data?.idCaja;
  const flashTimerRef = useRef(0);
  const scanMsgTimerRef = useRef(0);

  const tickets = usePosTicketsStore((s) => s.tickets);
  const activeId = usePosTicketsStore((s) => s.activeId);
  const setCarrito = usePosTicketsStore((s) => s.setCarritoActivo);
  const prevActiveIdRef = useRef(activeId);

  const ticketActivo = tickets.find((t) => t.id === activeId) ?? tickets[0];
  const carrito = ticketActivo?.carrito ?? [];

  const [busqueda, setBusqueda] = useState("");
  const [debouncedCriterio, setDebouncedCriterio] = useState("");
  const [categoriaId, setCategoriaId] = useState(CATEGORIA_TODO);
  const [pagina, setPagina] = useState(1);
  const [flashRowId, setFlashRowId] = useState(null);
  const [scanModal, setScanModal] = useState(null);
  const [gastosOpen, setGastosOpen] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [cambiarCajeroOpen, setCambiarCajeroOpen] = useState(false);
  const [reembolsoFiltro, setReembolsoFiltro] = useState("");
  const [reembolsoLineaModalId, setReembolsoLineaModalId] = useState(null);
  const [reembolsoLineaBorrador, setReembolsoLineaBorrador] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [mostrarInputsDescuento, setMostrarInputsDescuento] = useState(false);
  const reembolsoSesion = usePosVentaStore((s) => s.reembolsoSesion);
  const setReembolsoSesion = usePosVentaStore((s) => s.setReembolsoSesion);
  const resetReembolsoSesion = usePosVentaStore((s) => s.resetReembolsoSesion);
  const setPendiente = usePosVentaStore((s) => s.setPendiente);
  const clearPendiente = usePosVentaStore((s) => s.clearPendiente);

  const tieneLineasReembolsoEnCarrito = useMemo(
    () => carrito.some((p) => p.esReembolso && p.cantidad > 0),
    [carrito]
  );
  const modoReembolso = reembolsoSesion.activo || tieneLineasReembolsoEnCarrito;
  const ventaReembolsoId = reembolsoSesion.idVenta;
  const reembolsoMotivo = reembolsoSesion.motivo;
  const reembolsoObservacion = reembolsoSesion.observacion;
  const setReembolsoMotivo = (motivo) => setReembolsoSesion({ motivo });
  const setReembolsoObservacion = (observacion) => setReembolsoSesion({ observacion });
  const setHeaderAction = useHeaderUserActionStore((s) => s.setAction);
  const clearHeaderAction = useHeaderUserActionStore((s) => s.clearAction);
  const setTicketsHeaderVisible = useHeaderTicketsStore((s) => s.setVisible);
  const setOnLimiteAlcanzado = useHeaderTicketsStore((s) => s.setOnLimiteAlcanzado);
  const clearTicketsHeader = useHeaderTicketsStore((s) => s.clear);

  const {
    lineaSeleccionadaId,
    seleccionarLinea,
    deseleccionar,
    cantidadVisible,
  } = useCarritoCantidadTeclado(carrito, setCarrito, {
    getMaxCantidad: (item) => item.maxCantidad ?? 9999,
    getMinCantidad: (item) => (item.esReembolso && item.cantidad > 0 ? 1 : 0),
    getPuedeEliminarLinea: (item) => !item.esReembolso,
  });

  useEffect(() => {
    setTitulo("POS · Ventas");
  }, [setTitulo]);

  useEffect(() => {
    setHeaderAction(() => setCambiarCajeroOpen(true), "Cambiar cajero / operador");
    return () => clearHeaderAction();
  }, [setHeaderAction, clearHeaderAction]);

  useEffect(() => {
    setTicketsHeaderVisible(true);
    setOnLimiteAlcanzado(() => {
      setToast({
        open: true,
        message: `Máximo ${LIMITE_TICKETS_ESPERA} ventas en espera. Cobre o cierre una antes de abrir otra.`,
        type: "warning",
      });
    });
    return () => clearTicketsHeader();
  }, [setTicketsHeaderVisible, setOnLimiteAlcanzado, clearTicketsHeader]);

  useEffect(() => {
    if (prevActiveIdRef.current !== activeId) {
      deseleccionar();
      prevActiveIdRef.current = activeId;
    }
  }, [activeId, deseleccionar]);

  useEffect(() => {
    if (!lineaSeleccionadaId) {
      setMostrarInputsDescuento(false);
    }
  }, [lineaSeleccionadaId]);

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
    { enabled: !!idCaja && !modoReembolso }
  );

  const ventasReembolsoQ = useReembolsoVentasDisponiblesQuery(
    { page: 1, pageSize: 30, criterio: reembolsoFiltro, idCaja },
    { enabled: !!idCaja && modoReembolso }
  );
  const preparacionReembolsoQ = useReembolsoPreparacionQuery(ventaReembolsoId, {
    enabled: !!ventaReembolsoId && modoReembolso,
  });
  const productosPagina = catalogoQ.data?.items ?? [];
  const totalCount = catalogoQ.data?.totalCount ?? 0;
  const totalPages = catalogoQ.data?.totalPages ?? 1;
  const from = totalCount === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const to = Math.min(from + PAGE_SIZE - 1, totalCount);

  useEffect(() => {
    if (productosPagina.length === 0 || carrito.length === 0) return;

    const catalogoPorId = new Map(productosPagina.map((producto) => [producto.id, producto]));
    let hayCambios = false;

    const carritoActualizado = carrito.map((linea) => {
      if (linea.esReembolso) return linea;

      const productoCatalogo = catalogoPorId.get(linea.id);
      if (!productoCatalogo) return linea;

      const requiereActualizar = CAMPOS_CATALOGO_LINEA.some(
        (campo) => linea[campo] !== productoCatalogo[campo]
      );
      if (!requiereActualizar) return linea;

      hayCambios = true;
      return mergeCatalogoEnLineaCarrito(linea, productoCatalogo);
    });

    if (hayCambios) {
      setCarrito(carritoActualizado);
    }
  }, [carrito, productosPagina, setCarrito]);

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
            p.id === producto.id
              ? mergeCatalogoEnLineaCarrito(p, producto, p.cantidad + 1)
              : p
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
            window.clearTimeout(scanMsgTimerRef.current);
          } else {
            setScanModal({ type: "no-encontrado", codigo });
          }
        } catch {
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
    enabled: !modoReembolso,
  });

  useEffect(
    () => () => {
      window.clearTimeout(flashTimerRef.current);
      window.clearTimeout(scanMsgTimerRef.current);
    },
    []
  );

  const mapPrepLineaAItemReembolso = useCallback((l, idVenta) => {
    if (!l?.idVentaDetalle) return null;
    const cantidadVendida = Number(l.cantidadVendida) || 0;
    const subtotalSnap = Number(l.subtotalLineaSnapshot) || 0;
    const precioNetoUnitario =
      cantidadVendida > 0
        ? roundVenta(subtotalSnap / cantidadVendida)
        : Math.abs(Number(l.precioUnitario) || 0);
    return {
      id: `reb-${l.idVentaDetalle}`,
      idVariante: l.idVariante,
      idVentaDetalle: l.idVentaDetalle,
      idVentaOrigen: idVenta,
      idUbicacion: 1,
      nombre: l.nombre,
      sku: l.sku,
      precio: -precioNetoUnitario,
      precioNetoUnitario,
      subtotalLineaSnapshot: subtotalSnap,
      cantidad: 0,
      cantidadVendida: Number(l.cantidadVendida) || 0,
      cantidadYaDevuelta: Number(l.cantidadYaDevuelta) || 0,
      maxCantidad: Math.max(1, Math.floor(l.cantidadDisponible || 0)),
      esReembolso: true,
      productoRecibido: true,
      regresaInventario: false,
      puedeReintegrarInventario: !!l.puedeReintegrarInventario,
      descuentoTipo: null,
      descuentoValor: null,
      montoPenalizacion: 0,
      motivoPenalizacion: "",
      observacionDetalle: "",
    };
  }, []);

  const total = roundVenta(
    carrito.reduce(
      (acc, p) => acc + (p.esReembolso && p.cantidad <= 0 ? 0 : subtotalLinea(p)),
      0
    )
  );

  const lineaSeleccionada = carrito.find((p) => p.id === lineaSeleccionadaId) ?? null;

  useEffect(() => {
    if (!infoModalOpen || !lineaSeleccionada) return;
    console.info("[VentasPOS] Modal de detalle abierto con data:", lineaSeleccionada);
  }, [infoModalOpen, lineaSeleccionada]);

  const aplicarDescuentoLinea = useCallback(
    (tipo, valorRaw) => {
      if (lineaSeleccionadaId == null) return;
      const valor = Number(valorRaw);
      const valido = Number.isFinite(valor) && valor > 0;
      setCarrito((prev) =>
        prev.map((p) =>
          p.id === lineaSeleccionadaId
            ? {
              ...p,
              descuentoTipo: valido ? tipo : null,
              descuentoValor: valido ? valor : null,
            }
            : p
        )
      );
    },
    [lineaSeleccionadaId, setCarrito]
  );

  const ventasReembolso = ventasReembolsoQ.data?.items ?? [];

  const resetSesionReembolso = useCallback(() => {
    resetReembolsoSesion();
    setReembolsoFiltro("");
    setReembolsoLineaModalId(null);
    setReembolsoLineaBorrador(null);
    setCarrito([]);
    deseleccionar();
    clearPendiente();
    queryClient.invalidateQueries({ queryKey: [QK_REEMBOLSOS] });
  }, [
    resetReembolsoSesion,
    setCarrito,
    deseleccionar,
    clearPendiente,
    queryClient,
  ]);

  useEffect(() => {
    if (!reembolsoCleanupPending) return;
    consumeReembolsoCleanup();
    resetSesionReembolso();
  }, [reembolsoCleanupPending, consumeReembolsoCleanup, resetSesionReembolso]);

  const toggleModoReembolso = () => {
    if (modoReembolso) {
      resetSesionReembolso();
      return;
    }
    setReembolsoSesion({
      activo: true,
      idVenta: null,
      motivo: "",
      observacion: "",
    });
    setReembolsoFiltro("");
    setReembolsoLineaModalId(null);
    setReembolsoLineaBorrador(null);
    setCarrito([]);
    deseleccionar();
    clearPendiente();
  };

  const seleccionarVentaReembolso = (idVenta) => {
    setReembolsoSesion({ idVenta });
    setReembolsoLineaModalId(null);
    setReembolsoLineaBorrador(null);
    setCarrito([]);
    deseleccionar();
  };

  const aplicarCambiosLineaReembolso = useCallback((item, cambios) => {
    const next = { ...item, ...cambios };
    if (next.productoRecibido === false) {
      next.regresaInventario = false;
    }
    next.idUbicacion = 1;
    return next;
  }, []);

  const construirLineaReembolsoParaModal = useCallback(
    (idLinea) => {
      const enCarrito = carrito.find((c) => c.id === idLinea);
      if (enCarrito) return { ...enCarrito };

      const prep = preparacionReembolsoQ.data?.data;
      if (!prep?.elegible) return null;
      const idDetalle = Number(String(idLinea).replace(/^reb-/, ""));
      const lineaPrep = (prep.lineas ?? []).find((l) => l.idVentaDetalle === idDetalle);
      if (!lineaPrep) return null;
      return mapPrepLineaAItemReembolso(lineaPrep, prep.idVenta);
    },
    [carrito, preparacionReembolsoQ.data, mapPrepLineaAItemReembolso]
  );

  const abrirConfigLineaReembolso = useCallback(
    (idLinea) => {
      const base = construirLineaReembolsoParaModal(idLinea);
      if (!base) return;
      setReembolsoLineaBorrador(base);
      setReembolsoLineaModalId(idLinea);
    },
    [construirLineaReembolsoParaModal]
  );

  const cerrarModalReembolso = useCallback(() => {
    setReembolsoLineaModalId(null);
    setReembolsoLineaBorrador(null);
  }, []);

  const actualizarLineaReembolso = useCallback(
    (idLinea, cambios) => {
      setReembolsoLineaBorrador((prev) => {
        if (!prev || prev.id !== idLinea) return prev;
        return aplicarCambiosLineaReembolso(prev, cambios);
      });
    },
    [aplicarCambiosLineaReembolso]
  );

  const cambiarCantidadReembolso = useCallback((idLinea, cantidad) => {
    const max = Math.max(0, Math.floor(Number(cantidad) || 0));
    setReembolsoLineaBorrador((prev) => {
      if (!prev || prev.id !== idLinea) return prev;
      const limitado = Math.min(prev.maxCantidad ?? 9999, max);
      return { ...prev, cantidad: limitado };
    });
  }, []);

  const confirmarLineaReembolso = useCallback(() => {
    if (!reembolsoLineaBorrador) return;
    if (reembolsoLineaBorrador.cantidad <= 0 || !reembolsoMotivo.trim()) return;

    const linea = aplicarCambiosLineaReembolso(reembolsoLineaBorrador, {});
    setCarrito((prev) => {
      const idx = prev.findIndex((p) => p.id === linea.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = linea;
        return next;
      }
      return [...prev, linea];
    });
    cerrarModalReembolso();
  }, [
    reembolsoLineaBorrador,
    reembolsoMotivo,
    aplicarCambiosLineaReembolso,
    setCarrito,
    cerrarModalReembolso,
  ]);

  const fmtFechaBreve = useMemo(
    () => (valor) => {
      if (!valor) return "";
      const d = new Date(valor);
      if (Number.isNaN(d.getTime())) return String(valor);
      return d.toLocaleString("es-GT", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    []
  );

  const irACobro = () => {
    const lineas = carrito.filter((p) => p.cantidad > 0);
    const enReembolso = modoReembolso || lineas.some((l) => l.esReembolso);
    if (!lineas.length) {
      setToast({
        open: true,
        message: enReembolso
          ? "Agregue al menos un producto con «Listo» en el modal de reembolso."
          : "Agregue al menos un producto con cantidad mayor a cero.",
        type: "warning",
      });
      return;
    }
    const totalLineas = roundVenta(lineas.reduce((acc, p) => acc + subtotalLinea(p), 0));
    if (enReembolso) {
      const invalidaPenal = lineas.find((l) => {
        const base = Math.abs(Number(l.precio) || 0) * (Number(l.cantidad) || 0);
        const penal = Number(l.montoPenalizacion) || 0;
        return penal >= base;
      });
      if (invalidaPenal) {
        setToast({
          open: true,
          message: `La penalización en ${invalidaPenal.nombre} no puede dejar reembolso en Q0.`,
          type: "warning",
        });
        return;
      }
      const sinMotivoPenal = lineas.find(
        (l) => (Number(l.montoPenalizacion) || 0) > 0 && !String(l.motivoPenalizacion || "").trim()
      );
      if (sinMotivoPenal) {
        setToast({
          open: true,
          message: `La línea ${sinMotivoPenal.nombre} requiere motivo de penalización.`,
          type: "warning",
        });
        return;
      }
    }
    if (!enReembolso && totalLineas <= 0) {
      setToast({
        open: true,
        message: "El total de la venta debe ser mayor que cero.",
        type: "warning",
      });
      return;
    }
    if (enReembolso && totalLineas >= 0) {
      setToast({
        open: true,
        message: "El total del reembolso debe ser menor que cero.",
        type: "warning",
      });
      return;
    }
    if (enReembolso && !ventaReembolsoId) {
      setToast({
        open: true,
        message: "Seleccione una venta para reembolso.",
        type: "warning",
      });
      return;
    }
    if (enReembolso && !reembolsoMotivo.trim()) {
      setToast({
        open: true,
        message: "El motivo de reembolso es obligatorio.",
        type: "warning",
      });
      return;
    }
    deseleccionar();
    clearPendiente();
    if (enReembolso) {
      setReembolsoSesion({
        activo: true,
        idVenta: ventaReembolsoId,
        motivo: reembolsoMotivo.trim(),
        observacion: reembolsoObservacion.trim(),
      });
    }
    setPendiente(
      lineas,
      totalLineas,
      enReembolso
        ? {
          tipo: "reembolso",
          reembolso: {
            idVenta: ventaReembolsoId,
            motivo: reembolsoMotivo.trim(),
            observacion: reembolsoObservacion.trim() || null,
          },
        }
        : { tipo: "venta", reembolso: null }
    );
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
        modoReembolso={modoReembolso}
        lineaReembolsoActivaId={reembolsoLineaModalId}
        onAbrirLineaReembolso={abrirConfigLineaReembolso}
      >
        <button
          type="button"
          onClick={() => setHistorialOpen(true)}
          className="w-full text-sm font-semibold py-2 rounded-lg bg-(--color-pos-accent-suave) text-(--color-pagina) hover:bg-(--color-pos-accent-suave-hover) transition-colors"
        >
          Historial de transacciones
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (lineaSeleccionada) {
                setInfoModalOpen(true);
              } else {
                setToast({
                  open: true,
                  message: "Por favor, seleccione un producto en el carrito para ver su información.",
                  type: "warning",
                });
              }
            }}
            className="flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg bg-(--color-pos-accent-suave) text-(--color-pagina) hover:bg-(--color-pos-accent-suave-hover) transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            Información
          </button>
          <button
            type="button"
            onClick={toggleModoReembolso}
            className="flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg bg-(--color-pos-accent-suave) text-(--color-pagina) hover:bg-(--color-pos-accent-suave-hover) transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {modoReembolso ? "Salir reembolso" : "Reembolso"}
          </button>
        </div>

        {!modoReembolso && (
          <div
            data-barcode-listener="off"
            className={cn(
              "rounded-lg border border-(--color-pos-borde-suave) bg-(--color-pos-accent-suave)/40 p-2.5 space-y-2 transition-all duration-200",
              lineaSeleccionada && !mostrarInputsDescuento && "hover:bg-(--color-pos-accent-suave-hover)/60 cursor-pointer"
            )}
            onClick={() => {
              if (lineaSeleccionada && !mostrarInputsDescuento) {
                setMostrarInputsDescuento(true);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-(--color-pagina)">Descuento por producto</span>
              {lineaSeleccionada && (
                <div className="flex items-center gap-2">
                  {(lineaSeleccionada.descuentoValor ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        aplicarDescuentoLinea("monto", 0);
                      }}
                      className="text-[10px] font-semibold text-(--color-rojo-obscuro) hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                  {mostrarInputsDescuento && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMostrarInputsDescuento(false);
                      }}
                      className="text-[10px] font-semibold text-(--color-pos-texto-muted) hover:underline"
                    >
                      Ocultar
                    </button>
                  )}
                </div>
              )}
            </div>
            {lineaSeleccionada ? (
              mostrarInputsDescuento ? (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="flex flex-col gap-1 text-[10px] font-semibold text-(--color-pos-texto-muted)">
                    Porcentaje (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      inputMode="decimal"
                      placeholder="0"
                      value={
                        lineaSeleccionada.descuentoTipo === "porcentaje"
                          ? lineaSeleccionada.descuentoValor ?? ""
                          : ""
                      }
                      onChange={(e) => aplicarDescuentoLinea("porcentaje", e.target.value)}
                      className="w-full rounded-md border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-2 py-1.5 text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-(--color-pagina)"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[10px] font-semibold text-(--color-pos-texto-muted)">
                    Monto fijo (Q)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={
                        lineaSeleccionada.descuentoTipo === "monto"
                          ? lineaSeleccionada.descuentoValor ?? ""
                          : ""
                      }
                      onChange={(e) => aplicarDescuentoLinea("monto", e.target.value)}
                      className="w-full rounded-md border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-2 py-1.5 text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-(--color-pagina)"
                    />
                  </label>
                </div>
              ) : (
                <p className="text-[11px] text-(--color-pos-texto-muted)">
                  Presione aquí para agregar descuento.
                </p>
              )
            ) : (
              <p className="text-[11px] text-(--color-pos-texto-muted)">
                Seleccione un producto para aplicar descuento.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={irACobro}
          disabled={carrito.every((p) => p.cantidad <= 0)}
          className="w-full mt-1 flex items-center justify-center gap-2 bg-(--color-pos-boton-primario) text-(--color-blanco) font-bold py-3 rounded-xl hover:bg-(--color-pos-boton-primario-hover) transition-colors disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          {modoReembolso ? "Reembolsar" : "Confirmar compra"}
        </button>
      </CarritoPanel>

      <section className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="shrink-0 p-3 sm:p-4 space-y-3 border-b border-(--color-pos-borde-suave) bg-(--color-pos-panel)/95">
          <div className="flex flex-wrap items-center gap-3">
            <div data-barcode-listener="off" className="flex flex-1 min-w-48 max-w-md">
              <BuscadorPrincipal
                placeholder={
                  modoReembolso
                    ? "Buscar venta por número de ticket..."
                    : "Buscar producto por nombre o código..."
                }
                value={modoReembolso ? reembolsoFiltro : busqueda}
                onChange={(e) => {
                  if (modoReembolso) {
                    setReembolsoFiltro(e.target.value);
                  } else {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }
                }}
                className="max-w-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 ml-auto">

              <button
                type="button"
                onClick={() => setGastosOpen(true)}
                className="px-4 py-2 rounded-xl bg-(--color-pagina) text-(--color-blanco) text-sm font-semibold hover:opacity-90"
              >
                Gastos
              </button>
              <CerrarTurnoMenu />

              <Paginacion
                from={from}
                to={to}
                total={totalCount}
                onPrev={() => setPagina((p) => Math.max(1, p - 1))}
                onNext={() => setPagina((p) => Math.min(totalPages, p + 1))}
                disablePrev={pagina <= 1}
                disableNext={pagina >= totalPages}
                isLoading={catalogoQ.isLoading}
              />
            </div>
          </div>

          {!modoReembolso && (
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
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
          {!modoReembolso && (
            <>
              {catalogoQ.isLoading && (
                <div className={CATALOGO_GRID_CLASS}>
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <Skeleton key={i} className="h-38 rounded-xl" />
                  ))}
                </div>
              )}

              {catalogoQ.isError && (
                <div className="text-center py-12 px-4 max-w-md mx-auto">
                  <p className="text-(--color-rojo-obscuro) text-sm font-medium">
                    {catalogoQ.error?.message ?? "No se pudo cargar el catálogo."}
                  </p>
                </div>
              )}

              {!catalogoQ.isLoading && !catalogoQ.isError && (
                <div className={CATALOGO_GRID_CLASS}>
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
            </>
          )}

          {modoReembolso && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <section className="rounded-xl border border-(--color-pos-borde-suave) bg-(--color-pos-panel) min-h-[18rem]">
                <header className="px-3 py-2 border-b border-(--color-pos-borde-suave) flex items-center gap-2">
                  <Search className="size-4 text-(--color-pagina)" />
                  <h3 className="text-sm font-bold">Transacciones para reembolso</h3>
                </header>
                <div className="max-h-[24rem] overflow-y-auto">
                  {ventasReembolsoQ.isLoading && (
                    <div className="p-3 space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                      ))}
                    </div>
                  )}
                  {!ventasReembolsoQ.isLoading &&
                    ventasReembolso.map((v) => (
                      <button
                        key={v.idVenta}
                        type="button"
                        onClick={() => seleccionarVentaReembolso(v.idVenta)}
                        className={cn(
                          "w-full text-left px-3 py-2 border-b border-(--color-pos-borde-suave) hover:bg-(--color-pos-accent-suave)/40 transition-colors",
                          ventaReembolsoId === v.idVenta && "bg-(--color-pos-accent-suave)"
                        )}
                      >
                        <p className="text-sm font-semibold">Ticket #{v.numeroTicket}</p>
                        <p className="text-xs text-(--color-pos-texto-muted)">
                          {fmtFechaBreve(v.fechaHora)} · Vendido {roundVenta(v.totalVendido).toFixed(2)}
                        </p>
                        {!v.elegible && (
                          <p className="text-[11px] text-(--color-rojo-obscuro) mt-0.5">
                            {v.motivoNoElegible || "No elegible"}
                          </p>
                        )}
                      </button>
                    ))}
                  {!ventasReembolsoQ.isLoading && ventasReembolso.length === 0 && (
                    <p className="text-center text-sm text-(--color-pos-texto-muted) py-10">
                      No hay ventas disponibles para reembolso.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-(--color-pos-borde-suave) bg-(--color-pos-panel) min-h-[18rem]">
                <header className="px-3 py-2 border-b border-(--color-pos-borde-suave)">
                  <h3 className="text-sm font-bold">Detalle de la venta seleccionada</h3>
                </header>
                <div className="p-3">
                  {!ventaReembolsoId && (
                    <p className="text-sm text-(--color-pos-texto-muted)">
                      Seleccione una transacción para cargar sus productos al carrito.
                    </p>
                  )}
                  {preparacionReembolsoQ.isLoading && ventaReembolsoId && (
                    <Skeleton className="h-24 rounded-lg" />
                  )}
                  {preparacionReembolsoQ.data?.data && (
                    <div className="space-y-3">
                      {!preparacionReembolsoQ.data.data.elegible && (
                        <p className="text-xs font-semibold text-(--color-rojo-obscuro)">
                          {preparacionReembolsoQ.data.data.motivoNoElegible ||
                            "Venta no elegible para reembolso."}
                        </p>
                      )}
                      {preparacionReembolsoQ.data.data.elegible && (
                        <>
                          <p className="text-xs text-(--color-pos-texto-muted)">
                            Ticket #{preparacionReembolsoQ.data.data.numeroTicket} · Pulse un
                            producto y confirme con «Listo» para agregarlo al carrito.
                          </p>
                          <ul className="space-y-1.5 max-h-[20rem] overflow-y-auto">
                            {(preparacionReembolsoQ.data.data.lineas ?? []).map((l) => {
                              const cartId = `reb-${l.idVentaDetalle}`;
                              const enCarrito = carrito.find((c) => c.id === cartId);
                              const qReemb = enCarrito?.cantidad ?? 0;
                              return (
                                <li key={l.idVentaDetalle}>
                                  <button
                                    type="button"
                                    onClick={() => abrirConfigLineaReembolso(cartId)}
                                    className={cn(
                                      "w-full text-left rounded-lg border px-2.5 py-2 transition-colors",
                                      "border-(--color-pos-borde-suave) hover:bg-(--color-pos-accent-suave)/50",
                                      reembolsoLineaModalId === cartId &&
                                      "border-(--color-pagina) bg-(--color-pos-accent-suave)"
                                    )}
                                  >
                                    <p className="text-sm font-semibold leading-snug">{l.nombre}</p>
                                    <p className="text-[11px] text-(--color-pos-texto-muted) mt-0.5">
                                      Vendió {l.cantidadVendida} · Disponible {l.cantidadDisponible}
                                      {qReemb > 0 && (
                                        <span className="font-semibold text-(--color-pagina)">
                                          {" "}
                                          · En reembolso: {qReemb}
                                        </span>
                                      )}
                                    </p>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </section>

      <HistorialTransaccionesDialog
        open={historialOpen}
        onOpenChange={setHistorialOpen}
        idCaja={idCaja}
        idSucursal={miCajaQ.data?.data?.idSucursal}
      />

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

      <ReembolsoLineaDetalleDialog
        open={!!reembolsoLineaBorrador}
        onOpenChange={(v) => {
          if (!v) cerrarModalReembolso();
        }}
        item={reembolsoLineaBorrador}
        onActualizar={actualizarLineaReembolso}
        onCantidadChange={(n) => {
          if (reembolsoLineaBorrador) {
            cambiarCantidadReembolso(reembolsoLineaBorrador.id, n);
          }
        }}
        motivo={reembolsoMotivo}
        onMotivoChange={setReembolsoMotivo}
        observacion={reembolsoObservacion}
        onObservacionChange={setReembolsoObservacion}
        onConfirm={confirmarLineaReembolso}
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

      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="sm:max-w-lg bg-(--color-pos-panel) border border-(--color-pos-borde-suave) text-foreground rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-(--color-pagina) text-xl font-bold">
              <Info className="size-5" />
              Detalle del Producto
            </DialogTitle>
            <DialogDescription className="text-(--color-pos-texto-muted) text-sm mt-1">
              Información técnica y comercial de la variante seleccionada.
            </DialogDescription>
          </DialogHeader>

          {lineaSeleccionada && (
            <div className="space-y-4 py-2">
              {/* Encabezado con Nombre y SKU */}
              <div className="border-b border-(--color-pos-borde-suave) pb-3">
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {lineaSeleccionada.nombre}
                </h3>
                {lineaSeleccionada.sku && (
                  <p className="text-xs font-mono text-(--color-pos-texto-muted) mt-1">
                    SKU: {lineaSeleccionada.sku}
                  </p>
                )}
              </div>

              {/* Grid de Información Principal */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-(--color-pos-borde-suave) p-3 bg-(--color-pos-fondo)/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-pos-texto-muted) block mb-0.5">
                    Categoría
                  </span>
                  <span className="font-semibold">
                    {lineaSeleccionada.categoria || "—"}
                  </span>
                </div>
                <div className="rounded-xl border border-(--color-pos-borde-suave) p-3 bg-(--color-pos-fondo)/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-pos-texto-muted) block mb-0.5">
                    Marca
                  </span>
                  <span className="font-semibold">
                    {lineaSeleccionada.marca || "—"}
                  </span>
                </div>
                <div className="rounded-xl border border-(--color-pos-borde-suave) p-3 bg-(--color-pos-fondo)/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-pos-texto-muted) block mb-0.5">
                    Precio Venta
                  </span>
                  <span className="font-bold text-(--color-pagina)">
                    Q {Number(lineaSeleccionada.precio || 0).toFixed(2)}
                  </span>
                </div>
                <div className="rounded-xl border border-(--color-pos-borde-suave) p-3 bg-(--color-pos-fondo)/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-pos-texto-muted) block mb-0.5">
                    Costo promedio
                  </span>
                  <span className="font-bold text-foreground">
                    {lineaSeleccionada.costoPromedioActual == null
                      ? "null"
                      : `Q ${Number(lineaSeleccionada.costoPromedioActual).toFixed(2)}`}
                  </span>
                </div>
                <div className="rounded-xl border border-(--color-pos-borde-suave) p-3 bg-(--color-pos-fondo)/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-pos-texto-muted) block mb-0.5">
                    Stock Disponible
                  </span>
                  <span className={cn(
                    "font-semibold",
                    (lineaSeleccionada.stockActual ?? 0) <= 0 ? "text-(--color-rojo-obscuro)" : "text-foreground"
                  )}>
                    {lineaSeleccionada.stockActual != null ? `${lineaSeleccionada.stockActual} uds.` : "No definido"}
                  </span>
                </div>
              </div>

              {/* Grid de Atributos Específicos */}
              <div className="grid grid-cols-3 gap-2 text-xs border-t border-b border-(--color-pos-borde-suave) py-3">
                <div className="text-center">
                  <span className="text-[9px] font-bold uppercase text-(--color-pos-texto-muted) block mb-0.5">
                    Talla
                  </span>
                  <span className="font-medium bg-(--color-pos-fondo) px-2.5 py-1 rounded-md inline-block">
                    {lineaSeleccionada.talla || "N/A"}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold uppercase text-(--color-pos-texto-muted) block mb-0.5">
                    Color
                  </span>
                  <span className="font-medium bg-(--color-pos-fondo) px-2.5 py-1 rounded-md inline-block">
                    {lineaSeleccionada.color || "N/A"}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold uppercase text-(--color-pos-texto-muted) block mb-0.5">
                    Presentación
                  </span>
                  <span className="font-medium bg-(--color-pos-fondo) px-2.5 py-1 rounded-md inline-block">
                    {lineaSeleccionada.presentacion || "N/A"}
                  </span>
                </div>
              </div>

              {/* Descripción */}
              {lineaSeleccionada.descripcion && (
                <div className="text-xs">
                  <span className="font-bold text-(--color-pos-texto-muted) block mb-1">
                    Descripción:
                  </span>
                  <p className="text-foreground/90 bg-(--color-pos-fondo)/30 p-2.5 rounded-xl border border-(--color-pos-borde-suave) leading-relaxed">
                    {lineaSeleccionada.descripcion}
                  </p>
                </div>
              )}

              {/* Resumen del Carrito */}
              <div className="bg-(--color-pos-accent-suave)/40 border border-(--color-pos-borde-suave) rounded-xl p-3.5 space-y-2">
                <span className="text-xs font-bold text-(--color-pagina) block">
                  Estado en el carrito actual
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <span className="text-[9px] font-semibold text-(--color-pos-texto-muted) block mb-0.5">
                      Cantidad
                    </span>
                    <span className="font-bold text-sm">
                      {lineaSeleccionada.cantidad}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-(--color-pos-texto-muted) block mb-0.5">
                      Descuento
                    </span>
                    <span className="font-bold text-sm text-(--color-esmeralda-hover)">
                      {lineaSeleccionada.descuentoValor > 0
                        ? (lineaSeleccionada.descuentoTipo === "porcentaje"
                          ? `-${lineaSeleccionada.descuentoValor}%`
                          : `-Q${Number(descuentoMontoLinea(lineaSeleccionada)).toFixed(2)}`)
                        : "Q0.00"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-(--color-pos-texto-muted) block mb-0.5">
                      Subtotal
                    </span>
                    <span className="font-bold text-sm text-(--color-pagina)">
                      Q {Number(subtotalLinea(lineaSeleccionada)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setInfoModalOpen(false)}
              className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button) rounded-xl w-full sm:w-auto"
            >
              Entendido
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
