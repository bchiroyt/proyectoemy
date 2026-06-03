import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { mapCompraApiToListRow } from "@/lib/comprasMappers";
import { getApiErrorMessage } from "@/lib/apiClient";
import { useAnularCompraMutation, useComprasListQuery } from "@/hooks/queries/useComprasQueries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DetalleCompraDialog from "./components/DetalleCompraDialog";
import RecibirCompraDialog from "./components/RecibirCompraDialog";
import {
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  PackageCheck,
  Pencil,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";
import Paginacion from "@/components/shared/Paginacion";

const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(n);

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  return d.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const estadoClass = (estado) => {
  if (estado === "Recibido")
    return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (estado === "En Proceso")
    return "bg-pink-50 text-pink-700 border-pink-100";
  if (estado === "Anulada")
    return "bg-slate-100 text-slate-500 border-slate-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const PAGE_SIZE = 20;

const Compras = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [detalle, setDetalle] = useState(null);
  const [recibirCompra, setRecibirCompra] = useState(null);

  const listQ = useComprasListQuery({
    page,
    pageSize: PAGE_SIZE,
    search: busqueda,
  });

  const anularMut = useAnularCompraMutation();

  useEffect(() => {
    setTitulo("Compras");
  }, [setTitulo]);

  const filasApi = useMemo(() => {
    const items = listQ.data?.items ?? [];
    return items.map((row) => mapCompraApiToListRow(row));
  }, [listQ.data]);

  const totalRegistros = listQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, listQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(from + PAGE_SIZE - 1, totalRegistros);
  const slice = filasApi;

  const handleAnular = async (row) => {
    if (row.estado === "Anulada") return;
    const ok = window.confirm(
      `¿Anular la compra #${row.idCompra}? Esta acción marca la compra como anulada en el sistema.`
    );
    if (!ok) return;
    try {
      await anularMut.mutateAsync(row.idCompra);
    } catch (e) {
      window.alert(getApiErrorMessage(e, "No se pudo anular la compra."));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-10 flex w-full shrink-0 flex-wrap items-center gap-1 border-b border-border bg-(--color-blanco) p-2 shadow-sm">
        <div className="flex flex-1 justify-start gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                className="bg-(--color-pagina-2) hover:opacity-90 text-(--color-blanco) font-semibold gap-1.5"
              >
                <Plus className="size-4" />
                Nueva compra
                <ChevronDown className="size-4 opacity-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wide">
                Tipo de compra
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => navigate("/compras/nueva?mode=presupuesto")}
                className="gap-2 py-2"
              >
                <ClipboardList className="size-4 text-(--color-pagina-2)" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">Presupuesto de pedido</span>
                  <span className="text-xs text-(--color-gris-letra) leading-snug">
                    Borrador previo. Se recibe y confirma después.
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => navigate("/compras/nueva?mode=directa")}
                className="gap-2 py-2"
              >
                <Zap className="size-4 text-(--color-verde)" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">Pedido de compra (directo)</span>
                  <span className="text-xs text-(--color-gris-letra) leading-snug">
                    Registra y cierra en un solo paso. Actualiza inventario.
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" type="button" aria-label="Exportar">
            <Download className="size-5 text-(--color-gris-letra)" />
          </Button>
        </div>

          <div className="flex flex-1 justify-center px-4">
          <BuscadorPrincipal
          placeholder="Buscar por número de orden..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPage(1);
          }}
          />
          </div>

          <div className="flex flex-1 justify-end items-center sm:justify-end gap-1 text-sm text-(--color-gris-letra) whitespace-nowrap">
          <Paginacion
            from={from}
            to={to}
            total={totalRegistros}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            disablePrev={page <= 1}
            disableNext={page >= totalPages}
          />
          </div>
        </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 md:p-4">
      {listQ.isLoading ? (
        <div className="space-y-2 rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : listQ.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-(--color-blanco) p-4 text-sm text-(--color-rojo)">
          {getApiErrorMessage(listQ.error, "No se pudieron cargar las compras.")}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm">
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-(--color-gris-calro) hover:bg-(--color-gris-claro-2) shadow-[0_1px_0_0_var(--color-gris-claro-2)]">
                  <TableHead className="w-12 text-[10px] uppercase font-bold text-(--color-gris-letra)">
                    No.
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra)">
                    Fecha pedido
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra)">
                    Recepción
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra) min-w-[140px]">
                    Proveedor
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra) min-w-[100px]">
                    No. ref.
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra) min-w-[110px]">
                    Tipo comprob.
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra) text-right">
                    Total
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra)">
                    Estado
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-(--color-gris-letra) text-right w-[160px]">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((row, index) => {
                  const esEnProceso = row.estadoCompraRaw === "EN_PROCESO" || row.estado === "En Proceso";
                  const esAnulada = row.estado === "Anulada";
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-(--color-gris-letra)">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell className="tabular-nums text-(--color-gris-letra)">
                        {fmtFecha(row.fechaPedido)}
                      </TableCell>
                      <TableCell className="tabular-nums text-(--color-gris-letra)">
                        {fmtFecha(row.fechaRecepcion)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-8 shrink-0 border border-(--color-gris-claro-2)">
                            <AvatarFallback className="text-[10px] font-bold bg-(--color-gris-claro-2) text-(--color-gris-letra)">
                              {row.proveedor.iniciales}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm font-medium text-(--color-negro text-base)">
                            {row.proveedor.nombre}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-(--color-negro)">
                        {row.numeroReferencia ? (
                          <span className="truncate block max-w-[140px]" title={row.numeroReferencia}>
                            {row.numeroReferencia}
                          </span>
                        ) : (
                          <span className="text-(--color-gris-letra)">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.tipoComprobante ? (
                          <Badge
                            variant="outline"
                            className="w-fit max-w-full truncate border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700"
                            title={row.tipoComprobante}
                          >
                            {row.tipoComprobante}
                          </Badge>
                        ) : (
                          <span className="text-sm text-(--color-gris-letra)">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-(--color-negro)">
                        {fmtQ(row.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("font-semibold border", estadoClass(row.estado))}
                        >
                          {row.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-(--color-celeste) hover:text-(--color-celeste-hover)"
                            aria-label="Ver"
                            onClick={() => setDetalle(row)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {esEnProceso ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-(--color-esmeralda-hover) hover:text-emerald-800"
                              aria-label="Recibir pedido"
                              type="button"
                              onClick={() => setRecibirCompra(row)}
                            >
                              <PackageCheck className="size-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-(--color-celeste) hover:text-(--color-celeste-hover) disabled:opacity-40"
                            aria-label="Editar"
                            asChild={esEnProceso}
                            disabled={!esEnProceso}
                          >
                            {esEnProceso ? (
                              <Link to={`/compras/nueva?edit=${encodeURIComponent(row.idCompra)}`}>
                                <Pencil className="size-4" />
                              </Link>
                            ) : (
                              <Pencil className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-(--color-gris-letra) hover:text-(--color-rojo)"
                            aria-label="Anular compra"
                            type="button"
                            disabled={esAnulada || !esEnProceso || anularMut.isPending}
                            onClick={() => handleAnular(row)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <DetalleCompraDialog
        open={!!detalle}
        onOpenChange={(o) => !o && setDetalle(null)}
        compra={detalle}
      />

      <RecibirCompraDialog
        open={!!recibirCompra}
        onOpenChange={(o) => !o && setRecibirCompra(null)}
        idCompra={recibirCompra?.idCompra ?? null}
      />
    </div>
    </div>
  );
};

export default Compras;
