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
} from "@/hooks/queries/useComprasQueries";
import { CompraDatosGenerales } from "@/pages/compras/components/CompraDatosGenerales";
import { CompraLineasProductos } from "@/pages/compras/components/CompraLineasProductos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ClipboardList, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  aplicarInputCantidad,
  aplicarInputCosto,
  enriquecerVarianteCompraConCosto,
  resolverCostoCompraVariante,
  sincronizarLineaCompraDirecta,
} from "@/lib/compraVarianteUtils";

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
  const costo = resolverCostoCompraVariante(v);
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
    stockActual: v.stockActual ?? v.StockActual ?? v.stock ?? v.Stock ?? 0,
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
  const [esCredito, setEsCredito] = useState(false);
  const [fechaVencimientoCredito, setFechaVencimientoCredito] = useState("");
  const [documentoRef, setDocumentoRef] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("none");
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState([]);
  const [formError, setFormError] = useState("");
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

  useEffect(() => {
    if (isDirecta) return;
    setEsCredito(false);
    setFechaVencimientoCredito("");
  }, [isDirecta]);

  const proveedores = useMemo(() => {
    const raw = provQ.data ?? [];
    return raw.map((p) => ({
      id: p.idProveedor ?? p.IdProveedor,
      nombre: p.nombre ?? p.Nombre ?? "",
    }));
  }, [provQ.data]);

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

  const agregar = async (v) => {
    const variante = await enriquecerVarianteCompraConCosto(v);
    const nueva = mapVarianteToLinea(variante);
    setLineas((prev) => {
      const ex = prev.find((x) => x.idVariante === nueva.idVariante);
      if (ex) {
        return prev.map((x) => {
          if (x.idVariante !== nueva.idVariante) return x;
          const cant = x.cantidadRecibida + 1;
          const nuevaCant = x.cantidadSolicitada + 1;
          const linea = {
            ...x,
            cantidadSolicitada: nuevaCant,
            cantidadRecibida: cant,
            cantidadText: String(nuevaCant),
          };
          return isDirecta ? sincronizarLineaCompraDirecta(linea) : linea;
        });
      }
      const linea = isDirecta ? sincronizarLineaCompraDirecta(nueva) : nueva;
      return [...prev, linea];
    });
  };

  const setCantidadPresupuesto = (idVariante, valor) => {
    const parsed = aplicarInputCantidad(valor);
    if (!parsed) return;
    setLineas((prev) =>
      prev.map((x) =>
        x.idVariante === idVariante
          ? {
              ...x,
              cantidadSolicitada: parsed.cantidad,
              cantidadRecibida: parsed.cantidad,
              cantidadText: parsed.cantidadText,
            }
          : x
      )
    );
  };

  const setCantidadDirecta = (idVariante, valor) => {
    const parsed = aplicarInputCantidad(valor);
    if (!parsed) return;
    setLineas((prev) =>
      prev.map((x) => {
        if (x.idVariante !== idVariante) return x;
        return sincronizarLineaCompraDirecta({
          ...x,
          cantidadRecibida: parsed.cantidad,
          cantidadText: parsed.cantidadText,
        });
      })
    );
  };

  const setCostoPresupuesto = (idVariante, valor) => {
    const parsed = aplicarInputCosto(valor);
    if (!parsed) return;
    setLineas((prev) =>
      prev.map((x) =>
        x.idVariante === idVariante
          ? { ...x, costoEstimado: parsed.costo, costoText: parsed.costoText }
          : x
      )
    );
  };

  const setCostoUnitarioDirecta = (idVariante, valor) => {
    const parsed = aplicarInputCosto(valor);
    if (!parsed) return;
    setLineas((prev) =>
      prev.map((x) => {
        if (x.idVariante !== idVariante) return x;
        return sincronizarLineaCompraDirecta({
          ...x,
          costoReal: parsed.costo,
          costoText: parsed.costoText,
        });
      })
    );
  };

  const quitar = (idVariante) => setLineas((prev) => prev.filter((x) => x.idVariante !== idVariante));

  const cambiarEsCredito = (value) => {
    setEsCredito(value);
    if (!value) {
      setFechaVencimientoCredito("");
    }
  };

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
        if (esCredito) {
          if (!fechaVencimientoCredito) {
            setFormError("Seleccione la fecha de vencimiento del credito.");
            return;
          }
          if (fechaVencimientoCredito <= header.fechaCompra) {
            setFormError("La fecha de vencimiento del credito debe ser posterior a la fecha de compra.");
            return;
          }
        }
        for (const l of lineas) {
          const sync = sincronizarLineaCompraDirecta(l);
          if (!(sync.costoReal > 0)) {
            setFormError("Debe ingresar el costo unitario (mayor a cero) de cada producto.");
            return;
          }
          if (sync.cantidadRecibida <= 0) {
            setFormError("La cantidad debe ser mayor a cero en cada línea.");
            return;
          }
        }
        const body = {
          ...header,
          confirmarCantidadMayorSolicitada: false,
          esCredito,
          ...(esCredito ? { fechaVencimientoCredito } : {}),
          detalles: lineas.map((l) => {
            const sync = sincronizarLineaCompraDirecta(l);
            return {
              idVariante: sync.idVariante,
              cantidadSolicitada: sync.cantidadSolicitada,
              cantidadRecibida: sync.cantidadRecibida,
              costoEstimado: sync.costoEstimado,
              costoReal: sync.costoReal,
            };
          }),
        };
        await crearDirectaMut.mutateAsync(body);
        navigate("/compras");
        return;
      }

      if (!isEdit) {
        for (const l of lineas) {
          if (!(l.cantidadSolicitada > 0)) {
            setFormError("La cantidad debe ser mayor a cero en cada línea.");
            return;
          }
        }
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2 sm:px-3 sm:py-2">
        <CompraDatosGenerales
          proveedor={proveedor}
          onProveedorChange={setProveedor}
          proveedores={proveedores}
          proveedoresLoading={provQ.isLoading}
          fechaPedido={fechaPedido}
          onFechaPedidoChange={setFechaPedido}
          documentoRef={documentoRef}
          onDocumentoRefChange={setDocumentoRef}
          tipoComprobante={tipoComprobante}
          onTipoComprobanteChange={setTipoComprobante}
          showCreditoControls={isDirecta}
          esCredito={esCredito}
          onEsCreditoChange={cambiarEsCredito}
          fechaVencimientoCredito={fechaVencimientoCredito}
          onFechaVencimientoCreditoChange={setFechaVencimientoCredito}
          disabled={loadingEdit}
        />

        <div className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-[1fr_280px]">
          <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
            <CompraLineasProductos
              lineas={lineas}
              isDirecta={isDirecta}
              disabled={loadingEdit}
              onAgregar={agregar}
              onQuitar={quitar}
              onSetCantidadPresupuesto={setCantidadPresupuesto}
              onSetCantidadDirecta={setCantidadDirecta}
              onSetCostoPresupuesto={setCostoPresupuesto}
              onSetCostoUnitarioDirecta={setCostoUnitarioDirecta}
            />

            <div className="flex shrink-0 items-start gap-2 rounded-lg border border-(--color-gris-claro-2) bg-(--color-gris-claro-2)/80 px-3 py-2 text-[11px] leading-snug text-(--color-gris-letra)">
              <Info className="size-4 shrink-0 text-(--color-pagina) mt-0.5" />
              <p>
                {isDirecta
                  ? "Compra directa: indique cantidad y costo unitario por producto. Al guardar se cierra la compra y actualiza el inventario."
                  : "Se guarda como presupuesto (estado EN_PROCESO). Más tarde puedes recibirlo desde la lista para confirmar cantidades, costos y entrar al inventario."}
              </p>
            </div>

          </div>

          <div className="flex shrink-0 flex-col gap-3 min-w-0 xl:max-h-full xl:overflow-y-auto">
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
