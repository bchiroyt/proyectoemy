import { useQuery } from "@tanstack/react-query";
import { fetchNivelesStock } from "@/services/nivelesStockService";

export const QK_NIVELES_STOCK = "niveles-stock";

export function useNivelesStockQuery(options = {}) {
  return useQuery({
    queryKey: [QK_NIVELES_STOCK],
    queryFn: fetchNivelesStock,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    ...options,
  });
}
