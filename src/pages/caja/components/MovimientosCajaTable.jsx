import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCajaMovimientosQuery } from "@/hooks/queries/useCajaQueries";
import { fmtQ } from "@/lib/cajaMappers";
import { EstadoErrorCarga } from "@/components/shared/EstadoErrorCarga";

export function MovimientosCajaTable({ idCaja }) {
  const { data, isLoading, isError, error, refetch } = useCajaMovimientosQuery(idCaja, {
    enabled: idCaja > 0,
  });

  const movimientos = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EstadoErrorCarga
        compact
        error={error}
        nombreModulo="movimientos de caja"
        fallbackGenerico="No se pudieron cargar los movimientos."
        onReintentar={() => refetch()}
      />
    );
  }

  if (!movimientos.length) {
    return (
      <p className="text-sm text-(--color-gris-letra) py-6 text-center">
        Sin movimientos manuales registrados.
      </p>
    );
  }

  return (
    <ScrollArea className="w-full rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco)">
      <div className="min-w-[640px]">
        <Table>
          <TableHeader className="bg-(--color-pagina-3)/60">
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((m) => (
              <TableRow key={m.idMovimientoCaja}>
                <TableCell className="text-sm whitespace-nowrap">
                  {new Date(m.fechaMovimiento).toLocaleString("es-GT")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      m.naturaleza === "ENTRADA"
                        ? "border-green-300 text-green-700 bg-green-50"
                        : "border-red-200 text-(--color-rojo) bg-red-50"
                    }
                  >
                    {m.tipoMovimientoNombre}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-nums">
                  {m.naturaleza === "SALIDA" ? "−" : "+"}
                  {fmtQ(m.monto)}
                </TableCell>
                <TableCell className="text-sm max-w-[180px] truncate">{m.motivo || "—"}</TableCell>
                <TableCell className="text-sm">{m.usuarioNombre}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
