import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiErrorMessage } from "@/lib/apiClient";
import { pick, throwIfEnvelopeFailed, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";
import { obtenerKardexPorVariante } from "@/services/kardex";

const PERIODO_DEFAULT = "todos";
const PERIODOS_KARDEX = [
  { value: "todos", label: "Todos" },
  { value: "mensual", label: "Mes actual" },
  { value: "semanal", label: "Semana actual" },
  { value: "trimestral", label: "Trimestre actual" },
  { value: "anual", label: "Año actual" },
];

const formatDateTime = (value) => {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (value) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "0";
  return new Intl.NumberFormat("es-GT", {
    maximumFractionDigits: 2,
  }).format(number);
};

const normalizeText = (value) => String(value ?? "").trim();

const resolverIdVariante = (item) =>
  toNumberOrNull(pick(item, "idVariante", "IdVariante", "id_variante"));

const getVarianteLabel = (variante, fallbackIndex) => {
  const partes = [];
  const sku = normalizeText(
    pick(variante, "sku", "Sku", "codigoPrincipal", "CodigoPrincipal", "codigoBarras", "CodigoBarras")
  );
  const presentacion = normalizeText(
    pick(variante, "presentacionNombre", "PresentacionNombre", "presentacion", "Presentacion")
  );
  const talla = normalizeText(pick(variante, "tallaNombre", "TallaNombre", "talla", "Talla"));
  const color = normalizeText(pick(variante, "color", "Color", "nombreColor", "NombreColor"));

  if (sku) partes.push(sku);
  if (presentacion) partes.push(presentacion);
  if (talla) partes.push(talla);
  if (color) partes.push(color);

  return partes.length > 0 ? partes.join(" / ") : `Variante ${fallbackIndex + 1}`;
};

const normalizeTipo = (raw, cantidad) => {
  const tipo = normalizeText(
    pick(
      raw,
      "tipoMovimiento",
      "TipoMovimiento",
      "tipoMovimientoNombre",
      "TipoMovimientoNombre",
      "naturaleza",
      "Naturaleza",
      "tipo",
      "Tipo"
    )
  );
  const upper = tipo.toUpperCase();

  if (
    upper.includes("ENTRADA") ||
    upper.includes("INGRESO") ||
    upper.includes("COMPRA") ||
    upper.includes("DEVOLUCION") ||
    upper.includes("DEVOLUCIÓN") ||
    upper.includes("REEMBOLSO")
  ) {
    return { tipo: tipo || "Entrada", naturaleza: "ENTRADA" };
  }
  if (upper.includes("SALIDA") || upper.includes("EGRESO") || upper.includes("VENTA")) {
    return { tipo: tipo || "Salida", naturaleza: "SALIDA" };
  }
  if (Number(cantidad) < 0) {
    return { tipo: tipo || "Salida", naturaleza: "SALIDA" };
  }
  return { tipo: tipo || "Movimiento", naturaleza: "ENTRADA" };
};

const normalizeMovimiento = (raw, index) => {
  if (!raw || typeof raw !== "object") return null;

  const cantidad =
    toNumberOrNull(
      pick(
        raw,
        "cantidadAfectadaStock",
        "CantidadAfectadaStock",
        "cantidad",
        "Cantidad",
        "cantidadMovimiento",
        "CantidadMovimiento"
      )
    ) ?? 0;
  const { tipo, naturaleza } = normalizeTipo(raw, cantidad);
  const fecha = pick(raw, "fechaMovimiento", "FechaMovimiento", "fecha", "Fecha", "createdAt");
  const saldo =
    toNumberOrNull(
      pick(
        raw,
        "stockActualVariante",
        "StockActualVariante",
        "saldoHistorico",
        "SaldoHistorico",
        "saldo",
        "Saldo",
        "existencia",
        "Existencia"
      )
    ) ?? 0;
  const presentacion = normalizeText(
    pick(raw, "nombrePresentacion", "NombrePresentacion", "presentacion", "Presentacion")
  );
  const talla = normalizeText(pick(raw, "nombreTalla", "NombreTalla", "talla", "Talla"));
  const especificacion = [presentacion, talla].filter(Boolean).join(" / ") || "General";

  return {
    id:
      pick(
        raw,
        "idMovimiento",
        "IdMovimiento",
        "idMovimientoInventario",
        "IdMovimientoInventario",
        "idInventario",
        "IdInventario",
        "idKardex",
        "IdKardex"
      ) ?? `kardex-${index}`,
    fecha,
    especificacion,
    color: normalizeText(pick(raw, "nombreColor", "NombreColor", "color", "Color")) || "N/A",
    tipo,
    naturaleza,
    cantidad: Math.abs(cantidad),
    referencia:
      normalizeText(
        pick(
          raw,
          "referencia",
          "Referencia",
          "referenciaExterna",
          "ReferenciaExterna",
          "documento",
          "Documento",
          "motivo",
          "Motivo"
        )
      ) || "Sin referencia",
    saldo,
  };
};

const unwrapKardex = (raw) => {
  const items = unwrapList(raw);
  if (items.length > 0) return items;
  const data = pick(raw, "data", "Data");
  const movimientos = pick(
    data,
    "movimientos",
    "Movimientos",
    "historial",
    "Historial",
    "kardex",
    "Kardex",
    "registros",
    "Registros",
    "detalles",
    "Detalles"
  );
  if (Array.isArray(movimientos)) return movimientos;

  const movimientosRaw = pick(raw, "movimientos", "Movimientos", "historial", "Historial");
  return Array.isArray(movimientosRaw) ? movimientosRaw : [];
};

const ModalKardexProducto = ({ open, onClose, producto }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [periodoKardex, setPeriodoKardex] = useState(PERIODO_DEFAULT);
  const [idVarianteManual, setIdVarianteManual] = useState("");

  const productoNombre =
    producto?.nombre || producto?.productoNombre || producto?.presentacionNombre || "---";
  const variantes = useMemo(() => {
    if (!producto) return [];

    const entradas = [];
    const idFila = resolverIdVariante(producto);
    if (idFila) {
      entradas.push(producto);
    }

    const variantesProducto = pick(producto, "variantes", "Variantes");
    if (Array.isArray(variantesProducto)) {
      entradas.push(...variantesProducto);
    }

    const porId = new Map();
    for (const variante of entradas) {
      const idVariante = resolverIdVariante(variante);
      if (!idVariante || porId.has(idVariante)) continue;
      porId.set(idVariante, {
        idVariante,
        label: getVarianteLabel(variante, porId.size),
      });
    }

    return Array.from(porId.values());
  }, [producto]);
  const variantesIds = useMemo(
    () => new Set(variantes.map((variante) => String(variante.idVariante))),
    [variantes]
  );
  const idVarianteSeleccionada = variantesIds.has(String(idVarianteManual))
    ? Number(idVarianteManual)
    : variantes[0]?.idVariante ?? null;
  const varianteSeleccionada = useMemo(
    () => variantes.find((variante) => variante.idVariante === idVarianteSeleccionada) ?? null,
    [variantes, idVarianteSeleccionada]
  );

  const cargarKardex = async ({ forceRefresh = false } = {}) => {
    if (!open || !idVarianteSeleccionada) return;

    try {
      setCargando(true);
      setError("");
      const raw = await obtenerKardexPorVariante(idVarianteSeleccionada, {
        forceRefresh,
        periodo: periodoKardex,
      });
      throwIfEnvelopeFailed(raw, "No se pudo cargar el kardex de la variante.");
      const normalizados = unwrapKardex(raw).map(normalizeMovimiento).filter(Boolean);
      setMovimientos(normalizados);
    } catch (err) {
      console.error("Error al obtener los movimientos del kardex:", err);
      setMovimientos([]);
      setError(getApiErrorMessage(err, "No se pudo cargar el kardex de la variante."));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      if (!open || !idVarianteSeleccionada) return;

      try {
        setCargando(true);
        setError("");
        const raw = await obtenerKardexPorVariante(idVarianteSeleccionada, {
          periodo: periodoKardex,
        });
        throwIfEnvelopeFailed(raw, "No se pudo cargar el kardex de la variante.");
        const normalizados = unwrapKardex(raw).map(normalizeMovimiento).filter(Boolean);
        if (activo) {
          setMovimientos(normalizados);
        }
      } catch (err) {
        if (activo) {
          console.error("Error al obtener los movimientos del kardex:", err);
          setMovimientos([]);
          setError(getApiErrorMessage(err, "No se pudo cargar el kardex de la variante."));
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [open, idVarianteSeleccionada, periodoKardex]);

  const cerrarModal = () => {
    setMovimientos([]);
    setPeriodoKardex(PERIODO_DEFAULT);
    setError("");
    setIdVarianteManual("");
    onClose();
  };

  if (!open || !producto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border-t-4 border-pink-600 bg-(--color-blanco) shadow-2xl">
        <div className="flex shrink-0 flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-800">Kardex de inventario</h2>
            <p className="mt-1 truncate text-xs text-slate-500">
              Producto: <span className="font-semibold text-slate-700">{productoNombre}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {variantes.length > 1 ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Seleccionar variante:
                </span>
                <select
                  value={idVarianteSeleccionada ?? ""}
                  onChange={(event) => setIdVarianteManual(event.target.value)}
                  className="h-9 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  disabled={cargando}
                >
                  {variantes.map((variante) => (
                    <option key={variante.idVariante} value={variante.idVariante}>
                      {variante.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex min-h-9 max-w-full items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3">
                <span className="text-[10px] font-bold uppercase tracking-wide text-sky-700">
                  Atributos:
                </span>
                <span className="max-w-[260px] truncate rounded-full border border-sky-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                  {varianteSeleccionada?.label ?? "Sin variante"}
                </span>
              </div>
            )}

            <select
              value={periodoKardex}
              onChange={(event) => setPeriodoKardex(event.target.value)}
              className="h-9 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              disabled={cargando || !idVarianteSeleccionada}
            >
              {PERIODOS_KARDEX.map((periodo) => (
                <option key={periodo.value} value={periodo.value}>
                  {periodo.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => cargarKardex({ forceRefresh: true })}
              disabled={cargando || !idVarianteSeleccionada}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              title="Actualizar kardex"
            >
              <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={cerrarModal}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-slate-50/30">
          {!idVarianteSeleccionada ? (
            <div className="flex flex-1 items-center justify-center p-16 text-center text-sm font-medium text-slate-500">
              No se encontro una variante valida para consultar el Kardex.
            </div>
          ) : cargando ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-20">
              <Loader2 className="size-8 animate-spin text-pink-600" />
              <p className="text-xs font-medium text-slate-500">Consultando movimientos...</p>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="max-w-md rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
                {error}
              </div>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-16 text-center text-sm font-medium text-slate-500">
              No se encontraron movimientos para el periodo seleccionado.
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="p-4 text-left">No.</th>
                      <th className="p-4 text-left">Fecha</th>
                      <th className="p-4 text-left">Especificacion</th>
                      <th className="p-4 text-left">Color</th>
                      <th className="p-4 text-left">Tipo</th>
                      <th className="p-4 text-right">Cantidad</th>
                      <th className="p-4 text-left">Referencia</th>
                      <th className="p-4 text-right">Saldo</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {movimientos.map((movimiento, index) => {
                      const esEntrada = movimiento.naturaleza === "ENTRADA";

                      return (
                        <tr
                          key={`${movimiento.id}-${movimiento.fecha ?? "sin-fecha"}-${index}`}
                          className="transition-colors hover:bg-slate-50/60"
                        >
                          <td className="p-4 font-mono text-xs text-slate-400">#{index + 1}</td>
                          <td className="whitespace-nowrap p-4 text-xs">
                            {formatDateTime(movimiento.fecha)}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-800">
                              {movimiento.especificacion}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-medium uppercase text-slate-500">
                            {movimiento.color}
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                esEntrada
                                  ? "border-green-100 bg-green-50 text-green-700"
                                  : "border-pink-100 bg-pink-50 text-pink-600"
                              }`}
                            >
                              {movimiento.tipo}
                            </span>
                          </td>
                          <td
                            className={`p-4 text-right text-sm font-bold ${
                              esEntrada ? "text-green-700" : "text-red-600"
                            }`}
                          >
                            {esEntrada ? "+" : "-"}
                            {formatNumber(movimiento.cantidad)}
                          </td>
                          <td className="max-w-xs truncate p-4 text-xs text-slate-500">
                            {movimiento.referencia}
                          </td>
                          <td className="bg-slate-50/30 p-4 text-right font-bold text-slate-900">
                            {formatNumber(movimiento.saldo)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            {movimientos.length} movimientos
          </p>
          <button
            type="button"
            onClick={cerrarModal}
            className="rounded-xl bg-pink-600 px-6 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-pink-700"
          >
            Cerrar Kardex
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalKardexProducto;
