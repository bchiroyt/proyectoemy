import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { useVariantesCompraBuscarQuery } from "@/hooks/queries/useComprasQueries";
import {
  aplicarCriteriosBusquedaCompra,
  elegirVarianteParaAgregar,
  unwrapVariantesCompraBuscar,
  valorInputCantidad,
  valorInputCosto,
} from "@/lib/compraVarianteUtils";
import { buscarVariantesCompra } from "@/services/productosService";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  CLASES_ETIQUETA_VARIANTE,
  obtenerEtiquetasVariante,
  pickNombreVariante,
} from "@/lib/varianteUtils";

const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(n);

const thClass =
  "h-7 py-0 px-2 text-[10px] leading-tight uppercase font-bold text-(--color-gris-letra)";
const tdClass = "py-1 px-2 align-middle";

/** Sin flechas de incremento del navegador en type=number */
const inputNumClass =
  "h-7 tabular-nums text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]";

function resolverStockVariante(v) {
  const stock =
    v.stockActual ??
    v.StockActual ??
    v.existenciaActual ??
    v.ExistenciaActual ??
    v.existencia ??
    v.Existencia ??
    v.cantidadExistente ??
    v.CantidadExistente ??
    v.stock ??
    v.Stock ??
    0;
  const n = Number(stock);
  return Number.isFinite(n) ? n : 0;
}

function nombreBaseProducto(item) {
  return (
    item?.productoNombre ||
    item?.ProductoNombre ||
    item?.nombreProducto ||
    item?.NombreProducto ||
    item?.nombre ||
    item?.Nombre ||
    ""
  );
}

function nombreDisplayCompra(item) {
  return pickNombreVariante(item) || nombreBaseProducto(item) || "Producto";
}

function EtiquetasVarianteCompactas({ item, className = "" }) {
  const etiquetas = obtenerEtiquetasVariante(item).filter(
    (etiqueta) => etiqueta.key !== "nombreVariante" && etiqueta.key !== "atributos"
  );
  if (!etiquetas.length) return null;

  return (
    <div className={cn("mt-0.5 flex min-w-0 items-center gap-1 overflow-hidden", className)}>
      {etiquetas.map((etiqueta) => (
        <span
          key={etiqueta.key}
          className={cn(
            "min-w-0 max-w-[7.5rem] truncate rounded border px-1.5 py-px text-[10px] leading-none font-medium",
            CLASES_ETIQUETA_VARIANTE[etiqueta.key]
          )}
          title={etiqueta.value}
        >
          {etiqueta.value}
        </span>
      ))}
    </div>
  );
}

function VarianteOpcion({ v, onElegir }) {
  const idVariante = v.idVariante ?? v.IdVariante;
  const disp = v.disponibleParaCompra ?? v.DisponibleParaCompra;
  const motivo = v.motivoNoDisponible ?? v.MotivoNoDisponible;
  const nombreBase = nombreBaseProducto(v);
  const nombreVariante = pickNombreVariante(v) || "";
  const tituloPrincipal = nombreVariante || nombreBase || "Producto";
  const sku = v.sku ?? v.Sku ?? "";
  const stock = resolverStockVariante(v);
  const sinId = idVariante == null || Number(idVariante) <= 0;
  const deshabilitado = disp === false || sinId;
  const tooltip = sinId
    ? "El backend no envió IdVariante."
    : disp === false
    ? motivo || "No disponible para compra"
    : undefined;
  return (
    <button
      type="button"
      disabled={deshabilitado}
      title={tooltip}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!deshabilitado) onElegir(v);
      }}
      className={cn(
        "w-full min-w-0 text-left px-3 py-2 text-sm border-b border-(--color-gris-claro-2) transition-colors last:border-0",
        deshabilitado ? "cursor-not-allowed opacity-50" : "hover:bg-(--color-pagina-4)"
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate font-medium text-(--color-negro)">{tituloPrincipal}</p>
          <EtiquetasVarianteCompactas item={v} />
          {sinId ? (
            <span className="text-[10px] font-bold uppercase text-(--color-rojo)">Sin id variante</span>
          ) : null}
        </div>
        <div className="shrink-0 flex flex-col items-end text-right gap-0.5">
          {nombreVariante ? (
            <span className="max-w-[10rem] truncate text-[11px] font-medium text-(--color-gris-letra)">
              {nombreBase || "—"}
            </span>
          ) : null}
          <span className="font-mono text-[11px] text-(--color-gris-letra)">{sku}</span>
          <span className={cn("text-[10px] font-bold", stock > 0 ? "text-emerald-600" : "text-(--color-rojo-obscuro)")}>
            Stock: {stock}
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Líneas de compra estilo Odoo: tabla con scroll + buscador fijo abajo (resultados en portal).
 */
export function CompraLineasProductos({
  lineas,
  isDirecta,
  disabled = false,
  onAgregar,
  onQuitar,
  onSetCantidadPresupuesto,
  onSetCantidadDirecta,
  onSetCostoPresupuesto,
  onSetCostoUnitarioDirecta,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [debounced, setDebounced] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const inputRef = useRef(null);
  const buscadorRef = useRef(null);
  const menuRef = useRef(null);
  const lineasEndRef = useRef(null);
  const cantidadLineasPrev = useRef(lineas.length);
  const procesandoEnterRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(busqueda.trim()), 300);
    return () => window.clearTimeout(t);
  }, [busqueda]);

  const variantesQ = useVariantesCompraBuscarQuery(debounced, {
    enabled: debounced.length >= 1,
  });

  const resultados = variantesQ.data ?? [];
  const buscando = variantesQ.isFetching && debounced.length >= 1;

  useEffect(() => {
    if (debounced.length >= 1) setListaAbierta(true);
  }, [debounced]);

  useEffect(() => {
    if (lineas.length > cantidadLineasPrev.current) {
      window.requestAnimationFrame(() => {
        lineasEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
      });
    }
    cantidadLineasPrev.current = lineas.length;
  }, [lineas.length]);

  const actualizarPosicionMenu = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const espacioArriba = rect.top;
    const maxH = 280;
    const abrirArriba = espacioAbajo < 200 && espacioArriba > espacioAbajo;

    if (abrirArriba) {
      const altura = Math.min(maxH, espacioArriba - 12);
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top + 4,
        maxHeight: altura,
        zIndex: 9999,
      });
    } else {
      const altura = Math.min(maxH, espacioAbajo - 12);
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        top: rect.bottom + 4,
        maxHeight: altura,
        zIndex: 9999,
      });
    }
  }, []);

  const mostrarLista = listaAbierta && debounced.length >= 1;

  useLayoutEffect(() => {
    if (!mostrarLista) {
      setMenuStyle(null);
      return;
    }
    actualizarPosicionMenu();
    window.addEventListener("resize", actualizarPosicionMenu);
    window.addEventListener("scroll", actualizarPosicionMenu, true);
    return () => {
      window.removeEventListener("resize", actualizarPosicionMenu);
      window.removeEventListener("scroll", actualizarPosicionMenu, true);
    };
  }, [mostrarLista, actualizarPosicionMenu, resultados.length, buscando]);

  useEffect(() => {
    const cerrarSiClickFuera = (e) => {
      const target = e.target;
      if (
        buscadorRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setListaAbierta(false);
    };
    document.addEventListener("mousedown", cerrarSiClickFuera);
    return () => document.removeEventListener("mousedown", cerrarSiClickFuera);
  }, []);

  const elegirVariante = useCallback(
    async (v) => {
      await onAgregar(v);
      setBusqueda("");
      setDebounced("");
      setListaAbierta(false);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    },
    [onAgregar]
  );

  const buscarVariantesInmediato = useCallback(
    async (criterio) => {
      const q = criterio.trim();
      if (!q) return [];

      const cacheKey = ["productos", "variantes-buscar", "compra", q];
      const enCache = queryClient.getQueryData(cacheKey);
      if (Array.isArray(enCache) && enCache.length > 0) {
        return enCache;
      }

      const raw = await buscarVariantesCompra(q);
      if (raw && raw.exito === false) {
        throw new Error(raw.mensaje || raw.Mensaje || "Error en búsqueda");
      }
      const items = aplicarCriteriosBusquedaCompra(unwrapVariantesCompraBuscar(raw), q);
      queryClient.setQueryData(cacheKey, items);
      return items;
    },
    [queryClient]
  );

  const confirmarBusquedaEnter = useCallback(async () => {
    if (disabled || procesandoEnterRef.current) return;

    const criterio = busqueda.trim();
    if (!criterio) return;

    procesandoEnterRef.current = true;
    setDebounced(criterio);
    setListaAbierta(true);

    try {
      let items = resultados;
      const cacheActual = debounced === criterio && !variantesQ.isFetching;
      if (!cacheActual || !items.length) {
        items = await buscarVariantesInmediato(criterio);
      }

      const elegida = elegirVarianteParaAgregar(items, criterio);
      if (elegida) {
        await elegirVariante(elegida);
      }
    } catch {
      /* La query en pantalla mostrará el error si aplica */
    } finally {
      procesandoEnterRef.current = false;
    }
  }, [
    disabled,
    busqueda,
    debounced,
    resultados,
    variantesQ.isFetching,
    buscarVariantesInmediato,
    elegirVariante,
  ]);

  const colSpan = isDirecta ? 6 : 6;

  const menuPortal =
    mostrarLista && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            className="overflow-x-hidden overflow-y-auto rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-xl"
          >
            {buscando && resultados.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-(--color-gris-letra)">Buscando…</p>
            ) : null}
            {!buscando && resultados.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-(--color-gris-letra)">
                Sin resultados para «{debounced}»
              </p>
            ) : null}
            {resultados.map((v, idx) => (
              <VarianteOpcion
                key={v.idVariante ?? v.IdVariante ?? v.sku ?? idx}
                v={v}
                onElegir={elegirVariante}
              />
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <Card className="flex min-h-0 flex-1 flex-col gap-0 border-(--color-gris-claro-2) py-0 shadow-sm">
      <CardHeader className="shrink-0 space-y-0 border-b border-(--color-gris-claro-2) py-1.5 px-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs font-bold leading-none">Líneas de producto</CardTitle>
          {lineas.length > 0 ? (
            <span className="shrink-0 rounded-full bg-(--color-pagina)/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-(--color-pagina)">
              {lineas.length} {lineas.length === 1 ? "línea" : "líneas"}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[10px] text-(--color-gris-letra)">
          Busque abajo y elija un producto. La tabla hace scroll si hay muchas líneas.
        </p>
      </CardHeader>

      <div className="relative min-h-0 flex-1">
        <ScrollArea className="h-full min-h-[10rem]">
          <Table className={isDirecta ? "min-w-[520px]" : "min-w-[640px]"}>
          <TableHeader className="sticky top-0 z-[1] bg-(--color-gris-claro-2)">
            <TableRow className="hover:bg-(--color-gris-claro-2)">
              <TableHead className={cn(thClass, "min-w-[160px]")}>Producto</TableHead>
              <TableHead className={cn(thClass, "w-20")}>SKU</TableHead>
              {isDirecta ? (
                <>
                  <TableHead className={cn(thClass, "text-center w-28")}>Cantidad</TableHead>
                  <TableHead className={cn(thClass, "text-right w-24")}>Costo unit.</TableHead>
                </>
              ) : (
                <>
                  <TableHead className={cn(thClass, "text-right w-20")}>Costo</TableHead>
                  <TableHead className={cn(thClass, "text-center w-28")}>Cantidad</TableHead>
                </>
              )}
              <TableHead className={cn(thClass, "text-right w-24")}>Subtotal</TableHead>
              <TableHead className={cn(thClass, "w-9")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineas.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={colSpan}
                  className="py-8 text-center text-xs text-(--color-gris-letra)"
                >
                  Sin productos. Use el buscador de abajo para agregar el primero.
                </TableCell>
              </TableRow>
            ) : null}

            {lineas.map((row, idx) => {
              const cantUI = isDirecta ? row.cantidadRecibida : row.cantidadSolicitada;
              const costoUI = isDirecta ? row.costoReal : row.costoEstimado;
              const rowKey =
                row.idDetalleCompra ??
                row.idVariante ??
                (row.sku ? `sku:${row.sku}` : `idx:${idx}`);

              return (
                <TableRow key={rowKey}>
                  <TableCell className={tdClass}>
                    <div>
                      <p className="text-xs font-medium leading-tight text-(--color-negro)">
                        {nombreDisplayCompra(row)}
                      </p>
                      {pickNombreVariante(row) && nombreBaseProducto(row) ? (
                        <p className="truncate text-[10px] text-(--color-gris-letra)">
                          {nombreBaseProducto(row)}
                        </p>
                      ) : null}
                      <EtiquetasVarianteCompactas item={row} />
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px]">
                        {row.stockActual !== undefined && row.stockActual !== null ? (
                          <span className={cn("font-bold", row.stockActual > 0 ? "text-emerald-600" : "text-(--color-rojo-obscuro)")}>
                            Stock: {row.stockActual}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={cn(tdClass, "font-mono text-[10px]")}>{row.sku}</TableCell>
                  {isDirecta ? (
                    <>
                      <TableCell className={tdClass}>
                        <Input
                          type="text"
                          inputMode="numeric"
                          disabled={disabled}
                          placeholder="0"
                          className={cn(inputNumClass, "w-20 text-center")}
                          value={valorInputCantidad(row.cantidadRecibida, row.cantidadText)}
                          onChange={(e) => onSetCantidadDirecta(row.idVariante, e.target.value)}
                        />
                      </TableCell>
                      <TableCell className={cn(tdClass, "text-right")}>
                        <Input
                          type="text"
                          inputMode="decimal"
                          disabled={disabled}
                          placeholder="0.00"
                          className={cn(inputNumClass, "w-24 text-right")}
                          value={valorInputCosto(row.costoReal, row.costoText)}
                          onChange={(e) => onSetCostoUnitarioDirecta(row.idVariante, e.target.value)}
                        />
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className={cn(tdClass, "text-right")}>
                        <Input
                          type="text"
                          inputMode="decimal"
                          disabled={disabled}
                          placeholder="0.00"
                          className={cn(inputNumClass, "w-24 text-right")}
                          value={valorInputCosto(row.costoEstimado, row.costoText)}
                          onChange={(e) => onSetCostoPresupuesto(row.idVariante, e.target.value)}
                        />
                      </TableCell>
                      <TableCell className={tdClass}>
                        <Input
                          type="text"
                          inputMode="numeric"
                          disabled={disabled}
                          placeholder="1"
                          className={cn(inputNumClass, "w-20 text-center")}
                          value={valorInputCantidad(row.cantidadSolicitada, row.cantidadText)}
                          onChange={(e) => onSetCantidadPresupuesto(row.idVariante, e.target.value)}
                        />
                      </TableCell>
                    </>
                  )}
                  <TableCell className={cn(tdClass, "text-right tabular-nums text-xs font-semibold")}>
                    {fmtQ(cantUI * costoUI)}
                  </TableCell>
                  <TableCell className={cn(tdClass, "p-1")}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-(--color-gris-letra) hover:text-(--color-rojo)"
                      disabled={disabled}
                      onClick={() => onQuitar(row.idVariante)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="h-0 border-0 hover:bg-transparent">
              <TableCell colSpan={colSpan} className="h-0 p-0" aria-hidden>
                <div ref={lineasEndRef} className="h-px w-full" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </ScrollArea>
      </div>

      <div
        ref={buscadorRef}
        className="relative shrink-0 border-t border-(--color-gris-claro-2) bg-(--color-gris-claro-2)/30 p-2"
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-(--color-pagina)" />
          <Input
            ref={inputRef}
            disabled={disabled}
            placeholder="Escanee código o busque por nombre — Enter agrega"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onFocus={() => {
              if (debounced.length >= 1) {
                setListaAbierta(true);
                actualizarPosicionMenu();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setListaAbierta(false);
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                confirmarBusquedaEnter();
              }
            }}
            className="h-9 bg-(--color-blanco) pl-9 text-sm border-(--color-gris-claro-2) focus-visible:ring-(--color-pagina)/40"
            autoComplete="off"
          />
        </div>
      </div>

      {menuPortal}
    </Card>
  );
}
