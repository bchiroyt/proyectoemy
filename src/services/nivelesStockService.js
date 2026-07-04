import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import { unwrapNivelesStock, unwrapNivelesStockExportar } from "@/lib/nivelesStockMappers";

export async function fetchNivelesStock(params = {}) {
  try {
    const { page = 1, pageSize = 15 } = params;
    const { data } = await apiClient.get("/api/niveles-stock", {
      params: {
        page,
        pageSize,
      },
    });
    console.info("[NivelesStock] Respuesta cruda de /api/niveles-stock:", data);
    throwIfEnvelopeFailed(data, "No se pudieron cargar los niveles de stock.");
    return unwrapNivelesStock(data);
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para consultar los niveles de stock."
        )
      );
    }
    throw err;
  }
}

export async function fetchNivelesStockExportar() {
  try {
    const { data } = await apiClient.get("/api/niveles-stock/exportar");
    console.info("[NivelesStock] Respuesta cruda de /api/niveles-stock/exportar:", data);
    throwIfEnvelopeFailed(data, "No se pudo exportar el informe de nivel de stock.");
    return unwrapNivelesStockExportar(data);
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para exportar el informe de nivel de stock."
        )
      );
    }
    throw err;
  }
}
