import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCajasAbiertasQuery, useActivarCajaMutation } from "@/hooks/queries/useCajaQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Paginacion from "@/components/shared/Paginacion";
import { NipDialog } from "@/pages/caja/components/NipDialog";
import { fmtQ } from "@/lib/cajaMappers";
import Toast from "@/components/ui/Toast";

export function CajasAbiertasPanel({ searchQuery = "", page = 1, setPage }) {
  const { data: cajasRes, isLoading, isError, error, refetch } = useCajasAbiertasQuery();
  const actM = useActivarCajaMutation();
  const [activarId, setActivarId] = useState(null);
  const [nipOpen, setNipOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const lista = cajasRes?.data ?? [];

  const filtrados = useMemo(() => {
    const s = searchQuery.trim().toLowerCase();
    if (!s) return lista;
    return lista.filter(
      (c) =>
        c.idCaja.toString().includes(s) ||
        (c.usuarioResponsableNombre && c.usuarioResponsableNombre.toLowerCase().includes(s))
    );
  }, [lista, searchQuery]);

  const PAGE_SIZE = 10;
  const totalRegistros = filtrados.length;
  const totalPages = Math.ceil(totalRegistros / PAGE_SIZE) || 1;
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRegistros);
  const itemsPaginados = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleActivarClick = (idCaja) => {
    setActivarId(idCaja);
    setNipOpen(true);
  };

  const handleNipConfirm = async (nip) => {
    try {
      await actM.mutateAsync({ idCaja: activarId, body: { nip } });
      setNipOpen(false);
      setActivarId(null);
      setToast({ open: true, message: "Caja activada en este equipo.", type: "success" });
      refetch();
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err, "No se pudo activar la caja."),
        type: "error",
      });
    }
  };

  return (
    <>
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2 rounded-lg border border-border bg-(--color-blanco) p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-(--color-blanco) p-4 text-sm text-(--color-rojo)">
            {getApiErrorMessage(error, "No se pudieron cargar las cajas abiertas.")}
          </div>
        ) : (
          <ScrollArea className="w-full rounded-lg border border-border bg-(--color-blanco) shadow-sm">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold">No.</TableHead>
                    <TableHead className="font-bold">Responsable</TableHead>
                    <TableHead className="font-bold">Apertura</TableHead>
                    <TableHead className="font-bold">Monto apertura</TableHead>
                    <TableHead className="font-bold">Estado</TableHead>
                    <TableHead className="text-center font-bold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsPaginados.map((c, index) => (
                    <TableRow key={c.idCaja} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-bold text-(--color-pagina)">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {c.usuarioResponsableNombre || "—"}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(c.fechaApertura).toLocaleString("es-GT")}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {fmtQ(c.montoApertura)}
                      </TableCell>
                      <TableCell>
                        {c.esActiva ? (
                          <Badge className="bg-(--color-pagina) text-(--color-blanco) gap-1">
                            <CheckCircle2 className="size-3" />
                            Activa aquí
                          </Badge>
                        ) : (
                          <Badge className="bg-(--color-pagina-2) text-(--color-blanco)">
                            Abierta
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={c.esActiva || actM.isPending}
                          className="border-(--color-pagina) text-(--color-pagina) hover:bg-(--color-pagina)/10"
                          onClick={() => handleActivarClick(c.idCaja)}
                        >
                          <LayoutDashboard className="mr-1.5 size-3.5" />
                          Activar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!itemsPaginados.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        No hay cajas abiertas que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {!isLoading && !isError && (
          <div className="flex justify-end pt-2">
            <Paginacion
              from={from}
              to={to}
              total={totalRegistros}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              disablePrev={page <= 1}
              disableNext={page >= totalPages}
              isLoading={false}
            />
          </div>
        )}
      </div>

      <NipDialog
        open={nipOpen}
        onOpenChange={(o) => {
          setNipOpen(o);
          if (!o) setActivarId(null);
        }}
        title="Activar caja"
        description={`Ingrese su NIP para operar con la caja #${activarId ?? ""}.`}
        confirmLabel="Activar"
        isLoading={actM.isPending}
        onConfirm={handleNipConfirm}
      />
    </>
  );
}
