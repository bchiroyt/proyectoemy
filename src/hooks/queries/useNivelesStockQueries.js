import { useQuery } from "@tanstack/react-query";
import { fetchNivelesStock } from "@/services/nivelesStockService";

export const QK_NIVELES_STOCK = "niveles-stock";

export function useNivelesStockQuery(params = {}, options = {}) {
  const { page = 1, pageSize = 15 } = params;

  return useQuery({
    queryKey: [QK_NIVELES_STOCK, page, pageSize],
    queryFn: () => fetchNivelesStock({ page, pageSize }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    ...options,
  });
}
