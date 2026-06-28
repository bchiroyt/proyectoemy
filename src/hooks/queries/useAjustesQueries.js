import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAjustesCatalogos,
  fetchAjustes,
  fetchAjusteById,
  crearAjuste,
} from "@/services/ajustesService";
import { invalidarCacheDetalleProductoVariantes } from "@/lib/compraVarianteUtils";

export function useAjustesCatalogosQuery(options = {}) {
  return useQuery({
    queryKey: ["ajustes", "catalogos"],
    queryFn: async () => {
      const resp = await fetchAjustesCatalogos();
      return resp.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
}

export function useAjustesListQuery(
  { page = 1, pageSize = 10, fechaDesde, fechaHasta, idUsuario, criterio } = {},
  options = {}
) {
  return useQuery({
    queryKey: [
      "ajustes",
      "lista",
      { page, pageSize, fechaDesde, fechaHasta, idUsuario, criterio },
    ],
    queryFn: async () => {
      return await fetchAjustes({
        page,
        pageSize,
        fechaDesde,
        fechaHasta,
        idUsuario,
        criterio,
      });
    },
    ...options,
  });
}

export function useAjusteDetalleQuery(idAjuste, options = {}) {
  const enabled = options.enabled !== false && Number(idAjuste) > 0;
  return useQuery({
    queryKey: ["ajustes", "detalle", idAjuste],
    queryFn: async () => {
      const resp = await fetchAjusteById(idAjuste);
      return resp.data;
    },
    enabled,
    ...options,
  });
}

export function useCrearAjusteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crearAjuste,
    onSuccess: () => {
      invalidarCacheDetalleProductoVariantes();
      qc.invalidateQueries({ queryKey: ["ajustes"] });
      qc.invalidateQueries({ queryKey: ["productos"] });
      qc.removeQueries({ queryKey: ["productos", "variantes-buscar"] });
    },
  });
}
