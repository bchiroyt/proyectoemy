import { fetchReembolsosHistorial } from "@/services/reembolsoService";
import { fetchVentas } from "@/services/ventaService";
import { mapReembolsoHistorial } from "@/lib/reembolsoMappers";
import { mapVentaHistorialItem } from "@/lib/ventaMappers";

function ordenarPorFechaDesc(a, b) {
  const ta = new Date(a.fechaHora || 0).getTime();
  const tb = new Date(b.fechaHora || 0).getTime();
  return tb - ta;
}

async function fetchReembolsosHistorialSeguro(params) {
  try {
    return await fetchReembolsosHistorial(params);
  } catch (err) {
    if (err?.response?.status === 404) {
      return { items: [], totalCount: 0, totalPages: 1, page: params.page, pageSize: params.pageSize };
    }
    throw err;
  }
}

/**
 * Historial unificado: ventas + reembolsos, ordenado por fecha descendente.
 */
export async function fetchHistorialTransacciones({ page = 1, pageSize = 10, idCaja } = {}) {
  const fetchSize = Math.max(pageSize, page * pageSize);

  const [ventasRes, reembolsosRes] = await Promise.all([
    fetchVentas({ page: 1, pageSize: fetchSize, idCaja }),
    fetchReembolsosHistorialSeguro({ page: 1, pageSize: fetchSize, idCaja }),
  ]);

  const ventasItems = (ventasRes.items ?? [])
    .map((item) =>
      item?.tipo === "venta" ? item : mapVentaHistorialItem(item)
    )
    .filter(Boolean);

  const reembolsosItems = (reembolsosRes.items ?? [])
    .map((item) =>
      item?.tipo === "reembolso" ? item : mapReembolsoHistorial(item)
    )
    .filter(Boolean);

  const merged = [...ventasItems, ...reembolsosItems].sort(ordenarPorFechaDesc);
  const start = (page - 1) * pageSize;
  const items = merged.slice(start, start + pageSize);
  const totalCount = (ventasRes.totalCount || 0) + (reembolsosRes.totalCount || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items,
    page,
    pageSize,
    totalCount,
    totalPages,
  };
}
