import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { getApiErrorMessage } from "@/lib/apiClient";
import {
  useActualizarCompraMutation,
  useActualizarDetalleCompraMutation,
  useAgregarDetalleCompraMutation,
  useCompraDetalleQuery,
  useCrearCompraMutation,
  useEliminarDetalleCompraMutation,
  useProveedoresCompraQuery,
  useVariantesBuscarQuery,
} from "@/hooks/queries/useComprasQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Info, Minus, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(n);

const IVA_RATE = 0.12;

function mapVarianteToLinea(v) {
  const idVariante = v.idVariante ?? v.IdVariante;
  const sku = v.sku ?? v.Sku ?? "";
  const nombre = v.productoNombre ?? v.ProductoNombre ?? "";
  const color = v.color ?? v.Color ?? "";
  const tallaNombre = v.tallaNombre ?? v.TallaNombre ?? "";
  const detalle = [color, tallaNombre].filter(Boolean).join(" · ");
  const precio = v.precioVentaActual ?? v.PrecioVentaActual;
  const costo = precio != null ? Number(precio) : 0;
  return {
    idDetalleCompra: undefined,
    idVariante,
    sku,
    nombre,
    detalle,
    costoEstimado: costo,
    cantidadSolicitada: 1,
  };
}

function mapDetalleToLinea(d) {
  const idDetalleCompra = d.idDetalleCompra ?? d.IdDetalleCompra;
  const idVariante = d.idVariante ?? d.IdVariante;
  const sku = d.sku ?? d.Sku ?? "";
  const nombre = d.productoNombre ?? d.ProductoNombre ?? "";
  const color = d.color ?? d.Color ?? "";
  const tallaNombre = d.tallaNombre ?? d.TallaNombre ?? "";
  const detalle = [color, tallaNombre].filter(Boolean).join(" · ");
  return {
    idDetalleCompra,
    idVariante,
    sku,
    nombre,
    detalle,
    costoEstimado: Number(d.costoEstimado ?? d.CostoEstimado ?? 0),
    cantidadSolicitada: Number(d.cantidadSolicitada ?? d.CantidadSolicitada ?? 1),
  };
}

const NuevaCompra = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get("edit");
  const idCompraEdit = editParam && /^\d+$/.test(editParam) ? Number(editParam) : null;
  const isEdit = idCompraEdit != null;

  const [proveedor, setProveedor] = useState("");
  const [fechaPedido, setFechaPedido] = useState(() => new Date().toISOString().slice(0, 10));
  const [documentoRef, setDocumentoRef] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("none");
  const [notas, setNotas] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [debouncedCriterio, setDebouncedCriterio] = useState("");
  const [lineas, setLineas] = useState([]);
  const [formError, setFormError] = useState("");
  const initialLineasRef = useRef(null);

  const provQ = useProveedoresCompraQuery();
  const compraQ = useCompraDetalleQuery(idCompraEdit, { enabled: isEdit });
  const crearMut = useCrearCompraMutation();
  const actualizarMut = useActualizarCompraMutation();
  const agregarDetMut = useAgregarDetalleCompraMutation();
  const actualizarDetMut = useActualizarDetalleCompraMutation();
  const eliminarDetMut = useEliminarDetalleCompraMutation();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCriterio(busqueda.trim()), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const variantesQ = useVariantesBuscarQuery(debouncedCriterio, {
    enabled: debouncedCriterio.length >= 1,
  });

  useEffect(() => {
    setTitulo(isEdit ? "Editar compra" : "Nueva orden de compra");
  }, [setTitulo, isEdit]);

  useEffect(() => {
    if (!isEdit || !compraQ.data) return;
    const c = compraQ.data;
    queueMicrotask(() => {
      setProveedor(String(c.idProveedor ?? c.IdProveedor ?? ""));
      const fc = c.fechaCompra ?? c.FechaCompra;
      setFechaPedido(fc ? String(fc).slice(0, 10) : new Date().toISOString().slice(0, 10));
      setDocumentoRef(String(c.numeroOrden ?? c.NumeroOrden ?? ""));
      const idTipo = c.idTipoComprobante ?? c.IdTipoComprobante;
      setTipoComprobante(idTipo != null ? String(idTipo) : "none");
      setNotas(String(c.observacion ?? c.Observacion ?? ""));
      const detalles = c.detalles ?? c.Detalles ?? [];
      const mapped = detalles.map(mapDetalleToLinea);
      setLineas(mapped);
      initialLineasRef.current = mapped.map((l) => ({
        idDetalleCompra: l.idDetalleCompra,
        idVariante: l.idVariante,
        cantidadSolicitada: l.cantidadSolicitada,
        costoEstimado: l.costoEstimado,
      }));
    });
  }, [isEdit, compraQ.data]);

  const proveedores = useMemo(() => {
    const raw = provQ.data ?? [];
    return raw.map((p) => ({
      id: p.idProveedor ?? p.IdProveedor,
      nombre: p.nombre ?? p.Nombre ?? "",
    }));
  }, [provQ.data]);

  const variantesResultado = variantesQ.data ?? [];

  const subtotal = lineas.reduce((a, l) => a + l.costoEstimado * l.cantidadSolicitada, 0);
  const ivaIncluido = subtotal - subtotal / (1 + IVA_RATE);
  const total = subtotal;
  const articulos = lineas.reduce((a, l) => a + l.cantidadSolicitada, 0);

  const agregar = (v) => {
    const nueva = mapVarianteToLinea(v);
    setLineas((prev) => {
      const ex = prev.find((x) => x.idVariante === nueva.idVariante);
      if (ex) {
        return prev.map((x) =>
          x.idVariante === nueva.idVariante
            ? { ...x, cantidadSolicitada: x.cantidadSolicitada + 1 }
            : x
        );
      }
      return [...prev, nueva];
    });
  };

  const setCant = (idVariante, delta) => {
    setLineas((prev) =>
      prev
        .map((x) =>
          x.idVariante === idVariante
            ? { ...x, cantidadSolicitada: Math.max(1, x.cantidadSolicitada + delta) }
            : x
        )
        .filter((x) => x.cantidadSolicitada > 0)
    );
  };

  const quitar = (idVariante) => setLineas((prev) => prev.filter((x) => x.idVariante !== idVariante));

  const buildHeaderBody = () => {
    const idTipo =
      tipoComprobante === "none" || tipoComprobante === "" ? null : Number(tipoComprobante);
    return {
      idProveedor: Number(proveedor),
      fechaCompra: fechaPedido,
      numeroOrden: documentoRef.trim() || null,
      observacion: notas.trim() || null,
      idTipoComprobante: idTipo,
    };
  };

  const guardar = async () => {
    setFormError("");
    if (!proveedor) {
      setFormError("Seleccione un proveedor.");
      return;
    }
    if (!lineas.length) {
      setFormError("Agregue al menos una línea de producto.");
      return;
    }
    const header = buildHeaderBody();
    if (!header.idProveedor) {
      setFormError("Proveedor no válido.");
      return;
    }

    try {
      if (!isEdit) {
        const body = {
          ...header,
          detalles: lineas.map((l) => ({
            idVariante: l.idVariante,
            cantidadSolicitada: l.cantidadSolicitada,
            costoEstimado: l.costoEstimado,
          })),
        };
        await crearMut.mutateAsync(body);
        navigate("/compras");
        return;
      }

      await actualizarMut.mutateAsync({ idCompra: idCompraEdit, body: header });

      const inicial = initialLineasRef.current ?? [];
      const inicialPorDetalle = new Map(
        inicial.filter((x) => x.idDetalleCompra).map((x) => [x.idDetalleCompra, x])
      );

      const idsActuales = new Set(lineas.map((l) => l.idDetalleCompra).filter(Boolean));
      for (const prev of inicial) {
        if (prev.idDetalleCompra && !idsActuales.has(prev.idDetalleCompra)) {
          await eliminarDetMut.mutateAsync({
            idCompra: idCompraEdit,
            idDetalleCompra: prev.idDetalleCompra,
          });
        }
      }

      for (const l of lineas) {
        if (l.idDetalleCompra) {
          const prev = inicialPorDetalle.get(l.idDetalleCompra);
          const cambio =
            !prev ||
            prev.cantidadSolicitada !== l.cantidadSolicitada ||
            prev.costoEstimado !== l.costoEstimado;
          if (cambio) {
            await actualizarDetMut.mutateAsync({
              idCompra: idCompraEdit,
              idDetalleCompra: l.idDetalleCompra,
              body: {
                cantidadSolicitada: l.cantidadSolicitada,
                costoEstimado: l.costoEstimado,
              },
            });
          }
        } else {
          await agregarDetMut.mutateAsync({
            idCompra: idCompraEdit,
            body: {
              idVariante: l.idVariante,
              cantidadSolicitada: l.cantidadSolicitada,
              costoEstimado: l.costoEstimado,
            },
          });
        }
      }

      navigate("/compras");
    } catch (e) {
      setFormError(getApiErrorMessage(e, "No se pudo guardar la compra."));
    }
  };

  const loadingEdit = isEdit && compraQ.isLoading;
  const loadErrEdit = isEdit && compraQ.isError;

  const busy =
    crearMut.isPending ||
    actualizarMut.isPending ||
    agregarDetMut.isPending ||
    actualizarDetMut.isPending ||
    eliminarDetMut.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-3 border-b border-slate-200/80">
        <Button variant="ghost" size="sm" className="gap-1.5 w-fit -ml-2" asChild>
          <Link to="/compras">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {isEdit ? "Editar orden de compra" : "Nueva Orden de Compra"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestión de suministros y entrada de inventario
            {isEdit ? (
              <span className="ml-1 font-mono text-(--color-pagina)">· #{idCompraEdit}</span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Avatar className="size-9 border border-slate-200">
            <AvatarImage src="" alt="" />
            <AvatarFallback className="bg-(--color-pagina) text-white text-sm font-bold">
              AD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {loadErrEdit ? (
        <p className="text-sm text-red-600 py-4">{getApiErrorMessage(compraQ.error)}</p>
      ) : null}

      {formError ? (
        <p className="text-sm text-red-600 py-2" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-slate-800">
              Datos generales de la orden
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Proveedor</Label>
                {provQ.isLoading ? (
                  <div className="h-10 rounded-md bg-slate-100 animate-pulse" />
                ) : (
                  <Select value={proveedor} onValueChange={setProveedor} disabled={loadingEdit}>
                    <SelectTrigger className="bg-slate-50 h-10">
                      <SelectValue placeholder="Seleccione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Fecha de pedido
                </Label>
                <Input
                  type="date"
                  value={fechaPedido}
                  onChange={(e) => setFechaPedido(e.target.value)}
                  className="bg-slate-50 h-10"
                  disabled={loadingEdit}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  No. documento / Ref.
                </Label>
                <Input
                  value={documentoRef}
                  onChange={(e) => setDocumentoRef(e.target.value)}
                  placeholder="REF-00123"
                  className="bg-slate-50 h-10"
                  disabled={loadingEdit}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Tipo comprobante (id)
                </Label>
                <Select value={tipoComprobante} onValueChange={setTipoComprobante} disabled={loadingEdit}>
                  <SelectTrigger className="bg-slate-50 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin comprobante</SelectItem>
                    <SelectItem value="1">1 — según BD</SelectItem>
                    <SelectItem value="2">2 — según BD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px] items-start">
          <div className="space-y-4 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal-600/70" />
              <Input
                placeholder="Buscar variantes por nombre, SKU o código…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={cn(
                  "pl-10 h-11 border-teal-100",
                  "bg-teal-50/60 placeholder:text-slate-500 focus-visible:ring-teal-200"
                )}
                disabled={loadingEdit}
              />
            </div>

            {variantesQ.isFetching ? (
              <p className="text-xs text-slate-500">Buscando…</p>
            ) : null}

            {variantesResultado.length > 0 && debouncedCriterio.length >= 1 && (
              <Card className="border-teal-100 bg-white shadow-sm">
                <CardContent className="p-2 max-h-48 overflow-y-auto">
                  {variantesResultado.map((v) => {
                    const idVariante = v.idVariante ?? v.IdVariante;
                    const disp = v.disponibleParaCompra ?? v.DisponibleParaCompra;
                    const motivo = v.motivoNoDisponible ?? v.MotivoNoDisponible;
                    return (
                      <button
                        key={idVariante}
                        type="button"
                        disabled={disp === false}
                        title={disp === false ? motivo || "No disponible para compra" : undefined}
                        onClick={() => {
                          if (disp === false) return;
                          agregar(v);
                          setBusqueda("");
                          setDebouncedCriterio("");
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm flex justify-between gap-2",
                          disp === false ? "opacity-50 cursor-not-allowed" : "hover:bg-teal-50"
                        )}
                      >
                        <span className="font-medium text-slate-800">
                          {v.productoNombre ?? v.ProductoNombre}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{v.sku ?? v.Sku}</span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold">Productos</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[min(360px,45vh)] sm:h-[min(400px,50vh)]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-[10px] uppercase font-bold">Producto</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold w-28">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right w-24">
                        Costo
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center w-36">
                        Cantidad
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right w-28">
                        Subtotal
                      </TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineas.map((row) => (
                      <TableRow key={row.idVariante}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{row.nombre}</p>
                            <p className="text-xs text-slate-500">{row.detalle}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            className="h-8 text-right tabular-nums text-sm"
                            value={row.costoEstimado}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setLineas((prev) =>
                                prev.map((x) =>
                                  x.idVariante === row.idVariante
                                    ? { ...x, costoEstimado: Number.isFinite(val) ? val : 0 }
                                    : x
                                )
                              );
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
                              onClick={() => setCant(row.idVariante, -1)}
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
                              onClick={() => setCant(row.idVariante, 1)}
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-sm">
                          {fmtQ(row.costoEstimado * row.cantidadSolicitada)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-400 hover:text-red-600"
                            onClick={() => quitar(row.idVariante)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="flex items-start gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/80 text-xs text-slate-600">
                <Info className="size-4 shrink-0 text-sky-600 mt-0.5" />
                <p>
                  Busque variantes con el campo superior (misma API que{" "}
                  <code className="text-[11px]">GET /api/Productos/variantes/buscar</code>). Los costos
                  pueden ajustarse por línea antes de registrar.
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-4 min-w-0">
            <Card className="border-0 shadow-md bg-(--color-pagina) text-white overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">
                  Total estimado
                </p>
                <p className="text-3xl font-black tabular-nums">{fmtQ(total)}</p>
                <div className="space-y-2 text-sm border-t border-white/20 pt-3">
                  <div className="flex justify-between text-white/90">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{fmtQ(subtotal / (1 + IVA_RATE))}</span>
                  </div>
                  <div className="flex justify-between text-white/90">
                    <span>IVA (12%) incluido</span>
                    <span className="tabular-nums">{fmtQ(ivaIncluido)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Artículos</span>
                    <span>
                      {articulos} {articulos === 1 ? "artículo" : "artículos"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-bold">Notas internas</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Textarea
                  placeholder="Observaciones adicionales…"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="min-h-[120px] bg-slate-50 resize-y"
                  disabled={loadingEdit}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-slate-200 bg-white pt-3 pb-1 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0">
        <Button variant="outline" type="button" onClick={() => setLineas([])} disabled={busy}>
          Limpiar líneas
        </Button>
        <Button variant="secondary" type="button" asChild disabled={busy}>
          <Link to="/compras">Cancelar</Link>
        </Button>
        <Button
          type="button"
          className="bg-(--color-pagina-2) hover:opacity-90 text-white font-semibold sm:min-w-[160px]"
          disabled={busy || loadingEdit}
          onClick={guardar}
        >
          {busy ? "Guardando…" : isEdit ? "Guardar cambios" : "Registrar orden"}
        </Button>
      </footer>
    </div>
  );
};

export default NuevaCompra;
