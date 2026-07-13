import { useQuery } from "@tanstack/react-query";
import {
  fetchNivelesStock,
  fetchNivelesStockExportar,
} from "@/services/nivelesStockService";

export const QK_NIVELES_STOCK = "niveles-stock";
export const QK_NIVELES_STOCK_COMPLETO = "niveles-stock-completo";

export function useNivelesStockQuery(params = {}, options = {}) {
  const { page = 1, pageSize = 15, estadoStock = "TODOS" } = params;

  return useQuery({
    queryKey: [QK_NIVELES_STOCK, page, pageSize, estadoStock],
    queryFn: () => fetchNivelesStock({ page, pageSize, estadoStock }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    ...options,
  });
}

export function useNivelesStockCompletoQuery(options = {}) {
  return useQuery({
    queryKey: [QK_NIVELES_STOCK_COMPLETO],
    queryFn: fetchNivelesStockExportar,
    staleTime: 30_000,
    ...options,
  });
}
