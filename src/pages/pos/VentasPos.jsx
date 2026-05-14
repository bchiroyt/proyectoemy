import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ShoppingCart,
  Check,
  Info,
  RotateCcw,
  ScanBarcode,
  Barcode,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { cn } from "@/lib/utils";
import {
  useBarcodeScanner,
  BARCODE_DEFAULT_MAX_INTER_KEY_MS,
} from "@/hooks/useBarcodeScanner";
import { fetchProductoByCodigo, getProductosPosDemo } from "@/services/posProductoService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const productosMock = getProductosPosDemo();

const CATEGORIAS = [
  { id: "todo", label: "Todo" },
  { id: "zapatos", label: "Zapatos" },
  { id: "ropa", label: "Ropa" },
  { id: "cosmeticos", label: "Cosméticos" },
  { id: "shampoo", label: "Shampoo" },
];

const PAGE_SIZE = 8;

const VentasPOS = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();
  const flashTimerRef = useRef(0);
  const scanMsgTimerRef = useRef(0);

  useEffect(() => {
    setTitulo("POS · Ventas");
  }, [setTitulo]);

  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaId, setCategoriaId] = useState("todo");
  const [pagina, setPagina] = useState(1);
  const [flashRowId, setFlashRowId] = useState(null);
  const [scanFeedback, setScanFeedback] = useState(null);

  const agregarProducto = useCallback((producto, notaLinea) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      const base = { ...producto, cantidad: 1 };
      if (producto.id === 7) {
        return [...prev, { ...base, notaLinea: "5% de descuento Q5.00" }];
      }
      if (producto.notaCatalogo) {
        return [...prev, { ...base, notaLinea: producto.notaCatalogo }];
      }
      if (notaLinea) return [...prev, { ...base, notaLinea }];
      return [...prev, base];
    });
  }, []);

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

  const productosFiltrados = productosMock.filter((p) => {
    const matchCat = categoriaId === "todo" || p.categoria === categoriaId;
    const q = busqueda.trim().toLowerCase();
    const matchText =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo && p.codigo.includes(q));
    return matchCat && matchText;
  });

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const sliceStart = (paginaSegura - 1) * PAGE_SIZE;
  const productosPagina = productosFiltrados.slice(
    sliceStart,
    sliceStart + PAGE_SIZE
  );

  return (
    <div className="flex h-full min-h-0 bg-(--color-pos-fondo) text-foreground">
      <aside className="w-[min(100%,22rem)] shrink-0 bg-(--color-pos-panel) border-r border-(--color-pos-borde-suave) flex flex-col min-h-0 shadow-sm">
        <div className="p-4 border-b border-(--color-pos-borde-suave) flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-(--color-pagina)">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="font-bold text-lg">Carrito</h2>
          </div>
          <button
            type="button"
            onClick={() => setCarrito([])}
            className="text-xs font-semibold text-(--color-pagina) hover:underline"
          >
            Limpiar todo
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-3 py-12 text-(--color-pos-texto-muted)">
              <Barcode className="size-12 mb-3 opacity-25 text-(--color-pagina)" strokeWidth={1.25} />
              <p className="text-sm leading-relaxed">
                Pase un producto por el escáner para comenzar, o agréguelo desde la cuadrícula.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-(--color-pos-texto-muted) whitespace-normal min-w-0">
                    Producto
                  </TableHead>
                  <TableHead className="text-(--color-pos-texto-muted) text-right w-12">
                    Cant.
                  </TableHead>
                  <TableHead className="text-(--color-pos-texto-muted) text-right w-16">
                    P.u.
                  </TableHead>
                  <TableHead className="text-(--color-pos-texto-muted) text-right w-20">
                    Subt.
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carrito.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      flashRowId === item.id && "animate-pos-scan-flash"
                    )}
                  >
                    <TableCell className="whitespace-normal align-top">
                      <span className="font-medium text-foreground">{item.nombre}</span>
                      {item.notaLinea && (
                        <p className="text-xs font-medium text-(--color-pagina) mt-1 leading-snug">
                          {item.notaLinea}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums align-top">
                      {item.cantidad}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-(--color-pos-texto-muted) align-top">
                      {item.precio}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums align-top">
                      {item.precio * item.cantidad}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="p-3 border-t border-(--color-pos-borde-suave) space-y-2 bg-(--color-pos-panel)">
          <div className="flex justify-between items-baseline px-1">
            <span className="text-lg font-bold">Total</span>
            <span className="text-xl font-bold tabular-nums">Q {total}</span>
          </div>

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
            className="w-full mt-1 flex items-center justify-center gap-2 bg-(--color-pos-boton-primario) text-(--color-blanco) font-bold py-3 rounded-xl hover:bg-(--color-pos-boton-primario-hover) transition-colors"
          >
            <Check className="w-5 h-5" />
            Confirmar compra
          </button>
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="shrink-0 p-3 sm:p-4 space-y-3 border-b border-(--color-pos-borde-suave) bg-(--color-pos-panel)/95">
          <div className="flex flex-wrap items-center gap-3">
            <div
              data-barcode-listener="off"
              className="flex flex-1 min-w-48 items-center rounded-xl px-3 py-2 border border-(--color-pos-busqueda-borde) bg-(--color-pos-busqueda-fondo)"
            >
              <Search className="w-4 h-4 shrink-0 text-(--color-pos-busqueda-icono)" />
              <input
                type="search"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                className="ml-2 outline-none w-full bg-transparent text-foreground placeholder:text-(--color-pos-texto-muted)"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-(--color-pagina) text-(--color-blanco) text-sm font-semibold hover:opacity-90"
              >
                Gastos
              </button>
              <button
                type="button"
                onClick={() => navigate("/pos")}
                className="px-4 py-2 rounded-xl bg-(--color-pagina) text-(--color-blanco) text-sm font-semibold hover:opacity-90"
              >
                Cerrar turno
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-w-[1200px]">
            {productosPagina.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => agregarProducto(p)}
                className="text-left bg-(--color-pos-panel) rounded-xl p-3 shadow-sm border border-(--color-pos-borde-suave) hover:shadow-md hover:border-(--color-pagina)/35 transition cursor-pointer"
              >
                <div className="h-24 bg-(--color-pagina-3) rounded-lg mb-2 overflow-hidden flex items-center justify-center text-[10px] text-(--color-pos-texto-muted) px-1 text-center">
                  Imagen
                </div>
                <p className="text-sm font-semibold leading-snug">{p.nombre}</p>
                <p className="text-sm text-(--color-pos-texto-muted) mt-1 tabular-nums">
                  Q {p.precio.toFixed(2)}
                </p>
                {p.notaCatalogo && (
                  <p className="text-xs text-(--color-pagina) font-medium mt-1">
                    {p.notaCatalogo}
                  </p>
                )}
              </button>
            ))}
          </div>

          {productosFiltrados.length === 0 && (
            <p className="text-center text-(--color-pos-texto-muted) py-12">Sin resultados.</p>
          )}

          <div className="flex justify-end items-center gap-3 mt-4 text-sm text-(--color-pos-texto-muted)">
            <span className="tabular-nums">
              {productosFiltrados.length === 0
                ? "0 / 0"
                : `${sliceStart + 1}-${Math.min(
                    sliceStart + PAGE_SIZE,
                    productosFiltrados.length
                  )} / ${productosFiltrados.length}`}
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
                  Demo: código <span className="font-mono font-semibold">7501001001001</span> (Labial
                  Mate).
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VentasPOS;
