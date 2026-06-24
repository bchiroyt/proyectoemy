import { apiClient } from "@/lib/apiClient";

const CACHE_TTL_MS = 5 * 60 * 1000;
const kardexCache = new Map();
const kardexInflight = new Map();

/**
 * Obtiene el historial del Kardex de inventario para una variante.
 * GET /api/kardex/variantes/{idVariante}
 */
export const obtenerKardexPorVariante = async (
  idVariante,
  { forceRefresh = false, periodo = "todos" } = {}
) => {
  const id = Number(idVariante);
  if (!Number.isFinite(id) || id <= 0) {
    return { exito: true, data: [] };
  }

  const periodoNormalizado = String(periodo || "todos").trim().toLowerCase();
  const cacheKey = `${id}:${periodoNormalizado}`;
  const cached = kardexCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const inflight = kardexInflight.get(cacheKey);
  if (!forceRefresh && inflight) {
    return inflight;
  }

  const request = apiClient
    .get(`/api/kardex/variantes/${id}`, {
      params: periodoNormalizado === "todos" ? undefined : { periodo: periodoNormalizado },
    })
    .then((respuesta) => {
      const data = respuesta?.data;
      kardexCache.set(cacheKey, {
        timestamp: Date.now(),
        data,
      });
      return data;
    })
    .finally(() => {
      kardexInflight.delete(cacheKey);
    });

  kardexInflight.set(cacheKey, request);
  return request;
};

export const limpiarCacheKardexVariante = (idVariante) => {
  if (idVariante == null) {
    kardexCache.clear();
    kardexInflight.clear();
    return;
  }
  const cachePrefix = `${Number(idVariante)}:`;

  for (const cacheKey of kardexCache.keys()) {
    if (cacheKey.startsWith(cachePrefix)) {
      kardexCache.delete(cacheKey);
    }
  }

  for (const cacheKey of kardexInflight.keys()) {
    if (cacheKey.startsWith(cachePrefix)) {
      kardexInflight.delete(cacheKey);
    }
  }
};
