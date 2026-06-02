import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { useVariantesBuscarQuery } from "@/hooks/queries/useComprasQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(n);

function VarianteOpcion({ v, onElegir }) {
  const idVariante = v.idVariante ?? v.IdVariante;
  const disp = v.disponibleParaCompra ?? v.DisponibleParaCompra;
  const motivo = v.motivoNoDisponible ?? v.MotivoNoDisponible;
  const nombre = v.productoNombre ?? v.ProductoNombre ?? v.nombre ?? v.Nombre ?? "";
  const sku = v.sku ?? v.Sku ?? "";
  const color = v.color ?? v.Color ?? "";
  const talla = v.tallaNombre ?? v.TallaNombre ?? v.talla ?? v.Talla ?? "";
  const detalle = [color, talla].filter(Boolean).join(" · ");
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
        "w-full text-left px-3 py-2.5 text-sm border-b border-(--color-gris-claro-2) last:border-0",
        deshabilitado ? "cursor-not-allowed opacity-50" : "hover:bg-(--color-pagina-hover)"
      )}
    >
      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-(--color-negro) truncate">{nombre}</p>
          {detalle ? (
            <p className="text-xs text-(--color-gris-letra) truncate">{detalle}</p>
          ) : null}
          {sinId ? (
            <span className="text-[10px] font-bold uppercase text-(--color-rojo)">Sin id variante</span>
          ) : null}
        </div>
        <span className="shrink-0 font-mono text-xs text-(--color-gris-letra)">{sku}</span>
      </div>
    </button>
  );
}

/**
 * Líneas de compra estilo Odoo: tabla de productos + una fila final solo para buscar y agregar.
 */
export function CompraLineasProductos({
  lineas,
  isDirecta,
  disabled = false,
  onAgregar,
  onQuitar,
  onSetCant,
  onSetRecibida,
  onSetCostoReal,
  onUpdateLinea,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [debounced, setDebounced] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);
  const inputRef = useRef(null);
  const contenedorRef = useRef(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(busqueda.trim()), 300);
    return () => window.clearTimeout(t);
  }, [busqueda]);

  const variantesQ = useVariantesBuscarQuery(debounced, {
    enabled: debounced.length >= 1,
  });

  const resultados = variantesQ.data ?? [];
  const buscando = variantesQ.isFetching && debounced.length >= 1;

  useEffect(() => {
    setListaAbierta(debounced.length >= 1);
  }, [debounced]);

  useEffect(() => {
    const cerrarSiClickFuera = (e) => {
      if (!contenedorRef.current?.contains(e.target)) {
        setListaAbierta(false);
      }
    };
    document.addEventListener("mousedown", cerrarSiClickFuera);
    return () => document.removeEventListener("mousedown", cerrarSiClickFuera);
  }, []);

  const elegirVariante = (v) => {
    onAgregar(v);
    setBusqueda("");
    setDebounced("");
    setListaAbierta(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const mostrarLista =
    listaAbierta && debounced.length >= 1 && (buscando || resultados.length > 0);

  return (
    <Card className="border-(--color-gris-claro-2) shadow-sm overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-(--color-gris-claro-2)">
        <CardTitle className="text-sm font-bold">Líneas de producto</CardTitle>
        <p className="text-xs text-(--color-gris-letra) mt-0.5">
          Escriba en la última fila para buscar y agregar. Cada producto aparece como una línea nueva.
        </p>
      </CardHeader>

      <ScrollArea className="h-[min(420px,55vh)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-(--color-gris-claro-2) hover:bg-(--color-gris-claro-2)">
              <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra) min-w-[200px]">
                Producto
              </TableHead>
              <TableHead className="text-[10px] uppercase font-bold w-24">SKU</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-right w-24">
                {isDirecta ? "Costo est." : "Costo"}
              </TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-center w-32">
                Solicitada
              </TableHead>
              {isDirecta ? (
                <>
                  <TableHead className="text-[10px] uppercase font-bold text-right w-24">
                    Recibida
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right w-24">
                    Costo real
                  </TableHead>
                </>
              ) : null}
              <TableHead className="text-[10px] uppercase font-bold text-right w-28">
                Subtotal
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineas.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={isDirecta ? 8 : 6}
                  className="py-6 text-center text-sm text-(--color-gris-letra)"
                >
                  Sin productos. Use la fila de abajo para agregar el primero.
                </TableCell>
              </TableRow>
            ) : null}

            {lineas.map((row, idx) => {
              const cantUI = isDirecta ? row.cantidadRecibida : row.cantidadSolicitada;
              const costoUI = isDirecta ? row.costoReal : row.costoEstimado;
              const mayor = isDirecta && row.cantidadRecibida > row.cantidadSolicitada;
              const rowKey =
                row.idDetalleCompra ??
                row.idVariante ??
                (row.sku ? `sku:${row.sku}` : `idx:${idx}`);

              return (
                <TableRow key={rowKey}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-(--color-negro) text-sm">{row.nombre}</p>
                      {row.detalle ? (
                        <p className="text-xs text-(--color-gris-letra)">{row.detalle}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={disabled}
                      className="h-8 text-right tabular-nums text-sm"
                      value={row.costoEstimado}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onUpdateLinea(row.idVariante, {
                          costoEstimado: Number.isFinite(val) ? val : 0,
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={disabled}
                        onClick={() => onSetCant(row.idVariante, -1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {row.cantidadSolicitada}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={disabled}
                        onClick={() => onSetCant(row.idVariante, 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  {isDirecta ? (
                    <>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          disabled={disabled}
                          className={cn(
                            "h-8 text-right tabular-nums text-sm",
                            mayor ? "border-amber-400 bg-amber-50" : ""
                          )}
                          value={row.cantidadRecibida}
                          onChange={(e) => onSetRecibida(row.idVariante, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          disabled={disabled}
                          className="h-8 text-right tabular-nums text-sm"
                          value={row.costoReal}
                          onChange={(e) => onSetCostoReal(row.idVariante, e.target.value)}
                        />
                      </TableCell>
                    </>
                  ) : null}
                  <TableCell className="text-right tabular-nums font-semibold text-sm">
                    {fmtQ(cantUI * costoUI)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-(--color-gris-letra) hover:text-(--color-rojo)"
                      disabled={disabled}
                      onClick={() => onQuitar(row.idVariante)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            <TableRow className="bg-(--color-gris-claro-2)/40 hover:bg-(--color-gris-claro-2)/40">
              <TableCell colSpan={isDirecta ? 8 : 6} className="p-0">
                <div ref={contenedorRef} className="relative p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-pagina)" />
                    <Input
                      ref={inputRef}
                      disabled={disabled}
                      placeholder="Buscar producto por nombre, SKU o código y presione para agregar…"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      onFocus={() => {
                        if (debounced.length >= 1) setListaAbierta(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setListaAbierta(false);
                          return;
                        }
                        if (e.key === "Enter" && resultados.length > 0) {
                          const primera = resultados.find((v) => {
                            const id = v.idVariante ?? v.IdVariante;
                            const disp = v.disponibleParaCompra ?? v.DisponibleParaCompra;
                            return id != null && Number(id) > 0 && disp !== false;
                          });
                          if (primera) {
                            e.preventDefault();
                            elegirVariante(primera);
                          }
                        }
                      }}
                      className={cn(
                        "h-10 pl-10 border-(--color-gris-claro-2) bg-(--color-blanco)",
                        "placeholder:text-(--color-gris-letra) focus-visible:ring-(--color-pagina)/30"
                      )}
                      autoComplete="off"
                    />
                  </div>

                  {mostrarLista ? (
                    <div
                      className="absolute left-2 right-2 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-lg"
                      role="listbox"
                    >
                      {buscando && resultados.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-(--color-gris-letra)">Buscando…</p>
                      ) : null}
                      {!buscando && resultados.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-(--color-gris-letra)">
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
                    </div>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
