import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { getApiErrorMessage } from "@/lib/apiClient";
import {
  useActualizarCompraMutation,
  useActualizarDetalleCompraMutation,
  useAgregarDetalleCompraMutation,
  useCompraDetalleQuery,
  useCrearCompraDirectaMutation,
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
import { AlertTriangle, ArrowLeft, ClipboardList, Info, Minus, Plus, Search, Trash2, Zap } from "lucide-react";
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
  const nombre =
    v.productoNombre ?? v.ProductoNombre ?? v.nombre ?? v.Nombre ?? "";
  const color = v.color ?? v.Color ?? "";
  const tallaNombre = v.tallaNombre ?? v.TallaNombre ?? v.talla ?? v.Talla ?? "";
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
    cantidadRecibida: 1,
    costoReal: costo,
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
  const cantidadSolicitada = Number(d.cantidadSolicitada ?? d.CantidadSolicitada ?? 1);
  const costoEstimado = Number(d.costoEstimado ?? d.CostoEstimado ?? 0);
  return {
    idDetalleCompra,
    idVariante,
    sku,
    nombre,
    detalle,
    costoEstimado,
    cantidadSolicitada,
    cantidadRecibida: cantidadSolicitada,
    costoReal: costoEstimado,
  };
}

const NuevaCompra = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get("edit");
  const idCompraEdit = editParam && /^\d+$/.test(editParam) ? Number(editParam) : null;
  const isEdit = idCompraEdit != null;

  const modeParam = (searchParams.get("mode") || "").toLowerCase();
  const isDirecta = !isEdit && modeParam === "directa";

  const [proveedor, setProveedor] = useState("");
  const [fechaPedido, setFechaPedido] = useState(() => new Date().toISOString().slice(0, 10));
  const [documentoRef, setDocumentoRef] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("none");
  const [notas, setNotas] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [debouncedCriterio, setDebouncedCriterio] = useState("");
  const [lineas, setLineas] = useState([]);
  const [formError, setFormError] = useState("");
  const [confirmarMayor, setConfirmarMayor] = useState(false);
  const initialLineasRef = useRef(null);

  const provQ = useProveedoresCompraQuery();
  const compraQ = useCompraDetalleQuery(idCompraEdit, { enabled: isEdit });
  const crearMut = useCrearCompraMutation();
  const crearDirectaMut = useCrearCompraDirectaMutation();
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
    if (isEdit) {
      setTitulo("Editar presupuesto");
    } else if (isDirecta) {
      setTitulo("Pedido de compra directo");
    } else {
      setTitulo("Nuevo presupuesto de pedido");
    }
  }, [setTitulo, isEdit, isDirecta]);

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

  const subtotal = lineas.reduce((a, l) => {
    const cant = isDirecta ? l.cantidadRecibida : l.cantidadSolicitada;
    const costo = isDirecta ? l.costoReal : l.costoEstimado;
    return a + cant * costo;
  }, 0);
  const ivaIncluido = subtotal - subtotal / (1 + IVA_RATE);
  const total = subtotal;
  const articulos = lineas.reduce(
    (a, l) => a + (isDirecta ? l.cantidadRecibida : l.cantidadSolicitada),
    0
  );

  const algunaMayor = useMemo(
    () => isDirecta && lineas.some((l) => l.cantidadRecibida > l.cantidadSolicitada),
    [isDirecta, lineas]
  );

  const agregar = (v) => {
    const nueva = mapVarianteToLinea(v);
    setLineas((prev) => {
      const ex = prev.find((x) => x.idVariante === nueva.idVariante);
      if (ex) {
        return prev.map((x) =>
          x.idVariante === nueva.idVariante
            ? {
                ...x,
                cantidadSolicitada: x.cantidadSolicitada + 1,
                cantidadRecibida: x.cantidadRecibida + 1,
              }
            : x
        );
      }
      return [...prev, nueva];
    });
  };

  const setCant = (idVariante, delta) => {
    setLineas((prev) =>
      prev
        .map((x) => {
          if (x.idVariante !== idVariante) return x;
          const nuevaSolicitada = Math.max(1, x.cantidadSolicitada + delta);
          const ajustarRecibida =
            x.cantidadRecibida === x.cantidadSolicitada ? nuevaSolicitada : x.cantidadRecibida;
          return {
            ...x,
            cantidadSolicitada: nuevaSolicitada,
            cantidadRecibida: ajustarRecibida,
          };
        })
        .filter((x) => x.cantidadSolicitada > 0)
    );
  };

  const setRecibidaLinea = (idVariante, valor) => {
    const num = Number(valor);
    setLineas((prev) =>
      prev.map((x) =>
        x.idVariante === idVariante
          ? { ...x, cantidadRecibida: Number.isFinite(num) ? Math.max(0, num) : 0 }
          : x
      )
    );
  };

  const setCostoReal = (idVariante, valor) => {
    const num = Number(valor);
    setLineas((prev) =>
      prev.map((x) =>
        x.idVariante === idVariante
          ? { ...x, costoReal: Number.isFinite(num) ? Math.max(0, num) : 0 }
          : x
      )
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
    const sinId = lineas.some((l) => l.idVariante == null || Number(l.idVariante) <= 0);
    if (sinId) {
      setFormError(
        "Hay líneas sin IdVariante. Reinicia el backend para que la búsqueda devuelva el campo IdVariante y vuelve a agregar los productos."
      );
      return;
    }
    const header = buildHeaderBody();
    if (!header.idProveedor) {
      setFormError("Proveedor no válido.");
      return;
    }

    try {
      if (isDirecta) {
        for (const l of lineas) {
          if (!(l.costoReal > 0)) {
            setFormError("Debe ingresar el costo real (mayor a cero) de los productos recibidos.");
            return;
          }
          if (l.cantidadRecibida < 0) {
            setFormError("Las cantidades recibidas no pueden ser negativas.");
            return;
          }
        }
        if (algunaMayor && !confirmarMayor) {
          setFormError(
            "Hay productos con cantidad recibida mayor a la solicitada. Marca la casilla para confirmar."
          );
          return;
        }
        const body = {
          ...header,
          confirmarCantidadMayorSolicitada: confirmarMayor,
          detalles: lineas.map((l) => ({
            idVariante: l.idVariante,
            cantidadSolicitada: l.cantidadSolicitada,
            cantidadRecibida: l.cantidadRecibida,
            costoEstimado: l.costoEstimado,
            costoReal: l.costoReal,
          })),
        };
        await crearDirectaMut.mutateAsync(body);
        navigate("/compras");
        return;
      }

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
    crearDirectaMut.isPending ||
    actualizarMut.isPending ||
    agregarDetMut.isPending ||
    actualizarDetMut.isPending ||
    eliminarDetMut.isPending;

  const tituloPagina = isEdit
    ? "Editar presupuesto"
    : isDirecta
    ? "Pedido de compra directo"
    : "Nuevo presupuesto de pedido";

  const subtituloPagina = isEdit
    ? "Edita el presupuesto antes de recibir el pedido"
    : isDirecta
    ? "Registra y cierra una compra ya recibida en un solo paso"
    : "Borrador de compra que se recibirá y confirmará después";

  const submitText = isEdit
    ? "Guardar cambios"
    : isDirecta
    ? "Registrar y cerrar compra"
    : "Registrar presupuesto";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-1 border-b border-border bg-(--color-blanco) p-2 shadow-sm">
        <Button variant="ghost" size="sm" className="gap-1.5 w-fit -ml-2" asChild>
          <Link to="/compras">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  isDirecta
                    ? "bg-emerald-50 text-(--color-pagina-2) border border-(--color-pagina-2)/40"
                    : "bg-pink-50 text-pink-700 border border-pink-200"
                )}
              >
                {isDirecta ? <Zap className="size-3" /> : <ClipboardList className="size-3" />}
                {isDirecta ? "Directa" : "Presupuesto"}
              </span>
          </div>
          {/*<p className="text-xs sm:text-sm text-(--color-gris-letra)">
            {subtituloPagina}
            {isEdit ? (
              <span className="ml-1 font-mono text-(--color-pagina)">· #{idCompraEdit}</span>
            ) : null}
          </p>*/}
        </div>
      </div>

      {loadErrEdit ? (
        <p className="text-sm text-(--color-rojo) py-4">{getApiErrorMessage(compraQ.error)}</p>
      ) : null}

      {formError ? (
        <p className="text-sm text-(--color-rojo) py-2" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
        <Card className="border-(--color-gris-claro-2) shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-(--color-negro)">
              Datos generales de la orden
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-(--color-gris-letra)">Proveedor</Label>
                {provQ.isLoading ? (
                  <div className="h-10 rounded-md bg-(--color-gris-claro-2) animate-pulse" />
                ) : (
                  <Select value={proveedor} onValueChange={setProveedor} disabled={loadingEdit}>
                    <SelectTrigger className="bg-(--color-gris-claro-2) h-10">
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
                <Label className="text-[10px] uppercase font-bold text-(--color-gris-letra)">
                  Fecha de pedido
                </Label>
                <Input
                  type="date"
                  value={fechaPedido}
                  onChange={(e) => setFechaPedido(e.target.value)}
                  className="bg-(--color-gris-claro-2) h-10"
                  disabled={loadingEdit}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-(--color-gris-letra)">
                  No. documento / Ref.
                </Label>
                <Input
                  value={documentoRef}
                  onChange={(e) => setDocumentoRef(e.target.value)}
                  placeholder="REF-00123"
                  className="bg-(--color-gris-claro-2) h-10"
                  disabled={loadingEdit}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-(--color-gris-letra)">
                  Tipo comprobante (id)
                </Label>
                <Select value={tipoComprobante} onValueChange={setTipoComprobante} disabled={loadingEdit}>
                  <SelectTrigger className="bg-(--color-gris-claro-2) h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin comprobante</SelectItem>
                    <SelectItem value="1">Nota de crédito</SelectItem>
                    <SelectItem value="2">Factura</SelectItem>
                    <SelectItem value="3">Envio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px] items-start">
          <div className="space-y-4 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-pagina)" />
              <Input
                placeholder="Buscar variantes por nombre, SKU o código…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={cn(
                  "pl-10 h-11 border-(--color-gris-claro-2)",
                  "bg-(--color-gris-claro-2) placeholder:text-(--color-gris-letra) focus-visible:ring-(--color-gris-claro-2)"
                )}
                disabled={loadingEdit}
              />
            </div>

            {variantesQ.isFetching ? (
              <p className="text-xs text-(--color-gris-letra)">Buscando…</p>
            ) : null}

            {variantesResultado.length > 0 && debouncedCriterio.length >= 1 && (
              <Card className="border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm">
                <CardContent className="p-2 max-h-48 overflow-y-auto">
                  {variantesResultado.map((v, idx) => {
                    const idVariante = v.idVariante ?? v.IdVariante;
                    const disp = v.disponibleParaCompra ?? v.DisponibleParaCompra;
                    const motivo = v.motivoNoDisponible ?? v.MotivoNoDisponible;
                    const nombre =
                      v.productoNombre ?? v.ProductoNombre ?? v.nombre ?? v.Nombre ?? "";
                    const sku = v.sku ?? v.Sku ?? "";
                    const sinId = idVariante == null || Number(idVariante) <= 0;
                    const deshabilitado = disp === false || sinId;
                    const tooltip = sinId
                      ? "El backend no envió IdVariante. Reinicia el backend para tomar la nueva versión."
                      : disp === false
                      ? motivo || "No disponible para compra"
                      : undefined;
                    return (
                      <button
                        key={idVariante ?? (sku ? `sku:${sku}` : `idx:${idx}`)}
                        type="button"
                        disabled={deshabilitado}
                        title={tooltip}
                        onClick={() => {
                          if (deshabilitado) return;
                          agregar(v);
                          setBusqueda("");
                          setDebouncedCriterio("");
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm flex justify-between gap-2",
                          deshabilitado ? "opacity-50 cursor-not-allowed" : "hover:bg-(--color-pagina-hover)"
                        )}
                      >
                        <span className="font-medium text-(--color-negro)">
                          {nombre}
                          {sinId ? (
                            <span className="ml-2 text-[10px] uppercase font-bold text-(--color-rojo)">
                              (sin id)
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-(--color-gris-letra) font-mono">{sku}</span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card className="border-(--color-gris-claro-2) shadow-sm overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-(--color-gris-claro-2)">
                <CardTitle className="text-sm font-bold">Productos</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[min(360px,45vh)] sm:h-[min(420px,50vh)]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-(--color-gris-claro-2) hover:bg-(--color-gris-claro-2)">
                      <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra)">Producto</TableHead>
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
                              <p className="text-xs text-(--color-gris-letra)">{row.detalle}</p>
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
                          {isDirecta ? (
                            <>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  step="1"
                                  className={cn(
                                    "h-8 text-right tabular-nums text-sm",
                                    mayor ? "border-amber-400 bg-amber-50" : ""
                                  )}
                                  value={row.cantidadRecibida}
                                  onChange={(e) => setRecibidaLinea(row.idVariante, e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="h-8 text-right tabular-nums text-sm"
                                  value={row.costoReal}
                                  onChange={(e) => setCostoReal(row.idVariante, e.target.value)}
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
                              onClick={() => quitar(row.idVariante)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="flex items-start gap-2 px-4 py-3 border-t border-(--color-gris-claro-2) bg-(--color-gris-claro-2)/80 text-xs text-(--color-gris-letra)">
                <Info className="size-4 shrink-0 text-(--color-pagina) mt-0.5" />
                <p>
                  {isDirecta
                    ? "En modo directo se registra y cierra la compra inmediatamente, ingresando lo realmente recibido y el costo real. El inventario se actualiza al guardar."
                    : "Se guarda como presupuesto (estado EN_PROCESO). Más tarde puedes recibirlo desde la lista para confirmar cantidades, costos y entrar al inventario."}
                </p>
              </div>
            </Card>

            {isDirecta && algunaMayor ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Cantidad recibida mayor a la solicitada</p>
                  <Label className="mt-2 flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmarMayor}
                      onChange={(e) => setConfirmarMayor(e.target.checked)}
                      className="size-4 accent-amber-600"
                    />
                    Confirmo que se recibió más cantidad de la solicitada
                  </Label>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4 min-w-0">
            <Card
              className={cn(
                "border-0 shadow-md text-(--color-blanco) overflow-hidden",
                isDirecta ? "bg-emerald-700" : "bg-(--color-pagina)"
              )}
            >
              <CardContent className="p-5 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wide text-(--color-blanco)/90">
                  {isDirecta ? "Total a registrar" : "Total estimado"}
                </p>
                <p className="text-3xl font-black tabular-nums">{fmtQ(total)}</p>
                <div className="space-y-2 text-sm border-t border-(--color-blanco)/20 pt-3">
                  <div className="flex justify-between text-(--color-blanco)/90">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{fmtQ(subtotal / (1 + IVA_RATE))}</span>
                  </div>
                  <div className="flex justify-between text-(--color-blanco)/90">
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

            <Card className="border-(--color-gris-claro-2) shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-bold">Notas internas</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Textarea
                  placeholder="Observaciones adicionales…"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="min-h-[120px] bg-(--color-gris-claro-2) resize-y"
                  disabled={loadingEdit}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-(--color-gris-claro-2) bg-(--color-blanco) pt-3 pb-1 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0">
        <div className="relative">
          Buscador de productos
          <Search className="flex flex-1 justify-start grap-2  absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-pagina)" />
            <Input
              placeholder="Buscar variantes por nombre, SKU o código…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={cn(
                 "pl-10 h-11 border-(--color-gris-claro-2)",
                 "bg-(--color-gris-claro-2) placeholder:text-(--color-gris-letra) focus-visible:ring-(--color-gris-claro-2)"
              )}
              disabled={loadingEdit}
              />
            </div>

        <Button variant="outline" type="button" onClick={() => setLineas([])} disabled={busy}>
          Limpiar líneas
        </Button>
        <Button variant="secondary" type="button" asChild disabled={busy}>
          <Link to="/compras">Cancelar</Link>
        </Button>
        <Button
          type="button"
          className={cn(
            "text-(--color-blanco) font-semibold sm:min-w-[180px]",
            isDirecta
              ? "bg-emerald-700 hover:bg-emerald-800"
              : "bg-(--color-pagina-2) hover:opacity-90"
          )}
          disabled={busy || loadingEdit}
          onClick={guardar}
        >
          {busy ? "Guardando…" : submitText}
        </Button>
      </footer>
    </div>
  );
};

export default NuevaCompra;
