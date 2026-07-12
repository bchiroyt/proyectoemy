import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Store, FileText, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { generarDetalleCompraPdf } from "@/lib/pdfExport";
import { getApiErrorMessage } from "@/lib/apiClient";
import { mapCompraApiToListRow } from "@/lib/comprasMappers";
import { useCompraDetalleQuery } from "@/hooks/queries/useComprasQueries";
import { normalizarAtributosAdicionales } from "@/lib/varianteUtils";
import { useMemo, useState } from "react";

const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(n);

const fmtFechaLarga = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const estadoBadge = (estado) => {
  const base = "rounded-full px-2.5 py-0.5 text-xs font-semibold";
  if (estado === "Recibido")
    return cn(base, "bg-emerald-100 text-emerald-800");
  if (estado === "En Proceso")
    return cn(base, "bg-pink-100 text-pink-700");
  return cn(base, "bg-slate-100 text-slate-600");
};
const truncarTexto = (valor, maximo = 18) => {
  const texto = String(valor ?? "").trim();
  if (texto.length <= maximo) return texto;
  return texto.slice(0, Math.max(1, maximo - 1)).trimEnd() + "\u2026";
};

function mapLineaDetalle(d, estadoCompra) {
  const esRecibida = String(estadoCompra ?? "").toUpperCase() === "CERRADA";
  const producto = d.productoNombre ?? d.ProductoNombre ?? "";
  const nombreVariante = d.nombreVariante ?? d.NombreVariante ?? "";
  const color = d.color ?? d.Color ?? "";
  const talla = d.tallaNombre ?? d.TallaNombre ?? "";
  const presentacion = d.presentacionNombre ?? d.PresentacionNombre ?? "";
  const material = d.material ?? d.Material ?? d.materialNombre ?? d.MaterialNombre ?? "";
  const genero = d.genero ?? d.Genero ?? d.generoNombre ?? d.GeneroNombre ?? "";
  const sku = d.sku ?? d.Sku ?? "";
  const codigo =
    sku ||
    d.codigoPrincipal ||
    d.CodigoPrincipal ||
    d.codigoBarras ||
    d.CodigoBarras ||
    d.codigo ||
    d.Codigo ||
    "";

  const solicitada = Number(d.cantidadSolicitada ?? d.CantidadSolicitada ?? 0);
  const recibida = Number(d.cantidadRecibida ?? d.CantidadRecibida ?? 0);
  const precioUnitario = Number(d.costoEstimado ?? d.CostoEstimado ?? 0);
  const costoReal = Number(d.costoReal ?? d.CostoReal ?? 0);
  const cantidad = esRecibida && recibida > 0 ? recibida : solicitada;
  const precioFinal = esRecibida && costoReal > 0 ? costoReal : null;
  const subtotalApi = Number(d.subtotal ?? d.Subtotal ?? 0);
  const total = subtotalApi > 0 ? subtotalApi : cantidad * (precioFinal ?? precioUnitario);

  const productoVariante =
    String(nombreVariante || producto).trim() || "\u2014";
  const detalleColorTalla = [
    color ? "Color: " + String(color).trim() : null,
    talla ? "Talla: " + String(talla).trim() : null,
  ]
    .filter(Boolean)
    .join(" \u00b7 ");

  const atributosAdicionalesPartes = [];
  const claves = new Set();
  const agregar = (etiqueta, valor) => {
    if (valor == null || typeof valor === "object") return;
    const texto = String(valor).trim();
    if (!texto) return;
    const clave = etiqueta.toLocaleLowerCase("es-GT");
    if (claves.has(clave)) return;
    claves.add(clave);
    atributosAdicionalesPartes.push(etiqueta + ": " + texto);
  };

  agregar("Material", material);
  agregar("G\u00e9nero", genero);

  const atributosRaw =
    d.atributosAdicionales ??
    d.AtributosAdicionales ??
    d.atributos ??
    d.Atributos;
  const adicionales = normalizarAtributosAdicionales(atributosRaw);
  if (adicionales) {
    Object.entries(adicionales).forEach(([clave, valor]) => {
      const etiqueta =
        clave.toLocaleLowerCase("es-GT") === "genero"
          ? "G\u00e9nero"
          : clave.charAt(0).toLocaleUpperCase("es-GT") + clave.slice(1);
      agregar(etiqueta, valor);
    });
  }

  if (!adicionales && typeof atributosRaw === "string") {
    const texto = atributosRaw.trim();
    if (texto) atributosAdicionalesPartes.push(texto);
  }

  const atributosAdicionales = atributosAdicionalesPartes.join(" \u00b7 ");
  const atributosAdicionalesCorto = truncarTexto(atributosAdicionales);

  return {
    id: d.idDetalleCompra ?? d.IdDetalleCompra ?? d.idVariante ?? d.IdVariante,
    productoVariante,
    detalleColorTalla: detalleColorTalla || null,
    presentacion: String(presentacion).trim() || null,
    atributosAdicionales: atributosAdicionales || null,
    atributosAdicionalesCorto: atributosAdicionalesCorto || null,
    codigo: codigo || "\u2014",
    cantidad,
    precioUnitario,
    precioFinal,
    total,
  };
}

const DetalleCompraDialog = ({ open, onOpenChange, idCompra }) => {
  const compraQ = useCompraDetalleQuery(idCompra, {
    enabled: open && Number(idCompra) > 0,
  });
  const compraDetalle = useMemo(
    () => (compraQ.data ? mapCompraApiToListRow(compraQ.data) : null),
    [compraQ.data]
  );
  const cargando = compraQ.isLoading || (!compraQ.data && compraQ.isFetching);
  const compra = compraDetalle ?? {
    id: idCompra ?? "?",
    estado: "Cargando",
    items: [],
    proveedor: { nombre: "" },
    total: 0,
  };
  const itemsTabla = useMemo(() => {
    const data = compraQ.data;
    const detalles = data?.detalles ?? data?.Detalles ?? [];
    const estado = data?.estadoCompra ?? data?.EstadoCompra;
    return Array.isArray(detalles)
      ? detalles.map((detalle) => mapLineaDetalle(detalle, estado))
      : [];
  }, [compraQ.data]);
  const compraParaPdf = useMemo(
    () => (compraDetalle ? { ...compraDetalle, items: itemsTabla } : null),
    [compraDetalle, itemsTabla]
  );

  const [generandoPdf, setGenerandoPdf] = useState(false);

  if (!compra) return null;

  const esRecibida = compra.estado === "Recibido";
  const subtotal = compra.items.reduce(
    (acc, it) => acc + (it.totalLinea ?? it.cantidad * it.precioUnitario),
    0
  );
  const descuento = 0;
  const totalEncabezado = Number(compra.total ?? 0);
  const total =
    esRecibida && totalEncabezado > 0 ? totalEncabezado : subtotal - descuento;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-[95vh] sm:h-[90vh] w-[95vw] sm:max-w-[1100px] sm:w-full gap-0 overflow-hidden p-0 flex flex-col transition-all duration-300"
      >
        <DialogHeader className="border-b border-(--color-gris-claro-2) px-5 py-4 text-left shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-lg font-bold text-(--color-negro)">
                  Detalle de Compra
                </DialogTitle>
                <Badge className={estadoBadge(compra.estado)} variant="secondary">
                  {compra.estado}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-gris-letra)">
                <span className="inline-flex items-center gap-1 font-medium">
                  <FileText className="size-3.5 shrink-0" /># {compra.id}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {fmtFechaLarga(compra.fechaPedido)}
                </span>
                <span className="inline-flex items-center gap-1 min-w-0">
                  <Store className="size-3.5 shrink-0" />
                  <span className="truncate">{compra.proveedor.nombre}</span>
                </span>
                {compra.numeroReferencia ? (
                  <span className="font-mono">
                    Ref. {compra.numeroReferencia}
                  </span>
                ) : null}
                {compra.tipoComprobante ? (
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {compra.tipoComprobante}
                  </Badge>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-slate-500"
              onClick={() => onOpenChange(false)}
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {cargando ? (
            <div className="space-y-2 rounded-xl border border-slate-100 p-4" aria-label="Cargando detalle de compra">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : compraQ.isError ? (
            <div className="rounded-lg border border-destructive/30 p-4 text-sm text-(--color-rojo)">
              {getApiErrorMessage(compraQ.error, "No se pudo cargar el detalle de la compra.")}
            </div>
          ) : itemsTabla.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No hay líneas de detalle para esta compra.
            </p>
          ) : (
            <div className="rounded-lg border border-slate-100 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="min-w-[240px] text-[0px] uppercase font-bold text-slate-600"><span className="text-[10px]">Producto / variante</span>
                      Descripción
                    </TableHead>
                    <TableHead className="min-w-[320px] text-[0px] uppercase font-bold text-slate-600"><span className="text-[10px]">Atributos</span>
                      Color
                    </TableHead>
                    <TableHead className="min-w-[110px] text-[0px] uppercase font-bold text-slate-600"><span className="text-[10px]">{"C\u00f3digo"}</span>
                      Talla
                    </TableHead>
                    <TableHead className="text-right text-[0px] uppercase font-bold text-slate-600"><span className="text-[10px]">Cantidad</span>
                      SKU
                    </TableHead>
                    <TableHead className="text-right text-[0px] uppercase font-bold text-slate-600"><span className="text-[10px]">P. unit.</span>
                      Código
                    </TableHead>
                    <TableHead className="text-right text-[0px] uppercase font-bold text-slate-600"><span className="text-[10px]">Final</span>
                      Cant.
                    </TableHead>
                    <TableHead className="text-right text-[0px] uppercase font-bold text-slate-600"><span className="text-[10px]">Total</span>
                      {esRecibida ? "P. unit. final" : "P. unit. est."}
                    </TableHead>
                    <TableHead className="hidden text-[10px] uppercase font-bold text-slate-600 text-right">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsTabla.map((row, i) => (
                    <TableRow key={row.id ?? i}>
                      <TableCell>
                        <p className="font-medium text-slate-800">
                          {row.productoVariante}
                        </p>
                        {row.detalleColorTalla ? (
                          <p className="mt-0.5 text-xs font-normal text-slate-500">
                            {row.detalleColorTalla}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs leading-relaxed text-slate-600" title={row.atributosAdicionales ?? undefined}>
                        <div className="flex flex-col gap-0.5">
                          {row.presentacion ? (
                            <span>{"Presentaci\u00f3n: "}{row.presentacion}</span>
                          ) : null}
                          {row.atributosAdicionales ? (
                            <span title={row.atributosAdicionales}>
                              {"Atributos: "}{row.atributosAdicionalesCorto}
                            </span>
                          ) : null}
                          {!row.presentacion && !row.atributosAdicionales ? (
                            <span className="text-slate-400">{"\u2014"}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.codigo}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.cantidad}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtQ(row.precioUnitario)}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.precioFinal == null ? "\u2014" : fmtQ(row.precioFinal)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{fmtQ(row.total)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums">
                        {fmtQ(row.precioUnitario)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums font-medium">
                        {fmtQ(row.totalLinea ?? row.cantidad * row.precioUnitario)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                Notas del proveedor
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {compra.notasProveedor || "Sin notas registradas."}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmtQ(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Descuento (0%)</span>
                <span className="tabular-nums">{fmtQ(descuento)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800">Total final</span>
                <span className="text-xl font-black text-(--color-pagina) tabular-nums">
                  {fmtQ(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-100 px-5 py-3 bg-slate-50/80 shrink-0">
          <div className="flex flex-wrap gap-2">
            {!cargando && compraParaPdf ? (
            <Button
              size="sm"
              className="gap-1.5 bg-(--color-pagina) hover:bg-(--color-borde-button) text-white"
              type="button"
              disabled={generandoPdf}
              onClick={async () => {
                try {
                  setGenerandoPdf(true);
                  await generarDetalleCompraPdf(compraParaPdf);
                } catch (e) {
                  console.error(e);
                } finally {
                  setGenerandoPdf(false);
                }
              }}
            >
              <Download className="size-4" />
              {generandoPdf ? "Generando..." : "Descargar PDF"}
            </Button>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetalleCompraDialog;
