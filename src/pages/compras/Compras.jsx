import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { COMPRAS_MOCK } from "@/data/comprasMock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import DetalleCompraDialog from "@/components/compras/DetalleCompraDialog";
import { ChevronLeft, ChevronRight, Download, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(n);

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
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
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const PAGE_SIZE = 10;

const Compras = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(0);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    setTitulo("Compras");
  }, [setTitulo]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return COMPRAS_MOCK;
    return COMPRAS_MOCK.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.proveedor.nombre.toLowerCase().includes(q) ||
        c.comprobante.toLowerCase().includes(q)
    );
  }, [busqueda]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages - 1);
  const slice = filtradas.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE
  );
  const from = filtradas.length === 0 ? 0 : pageSafe * PAGE_SIZE + 1;
  const to = Math.min((pageSafe + 1) * PAGE_SIZE, filtradas.length);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 md:gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            className="bg-(--color-pagina-2) hover:opacity-90 text-(--color-blanco) font-semibold"
          >
            <Link to="/compras/nueva">Nueva compra</Link>
          </Button>
          <Button variant="outline" size="icon" type="button" aria-label="Exportar">
            <Download className="size-5 text-slate-600" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end min-w-0">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPage(0);
              }}
              className="pl-9 h-10 bg-(--color-blanco) border-(--color-gris-claro-2)"
            />
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-1 text-sm text-(--color-gris-letra) whitespace-nowrap">
            <span className="tabular-nums text-xs sm:text-sm">
              {from}-{to} / {filtradas.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              disabled={pageSafe <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              disabled={pageSafe >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 min-h-0 h-[320px] sm:h-[420px] md:h-full md:max-h-[calc(100vh-220px)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-12 text-[10px] uppercase font-bold text-slate-600">
                  No.
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                  Fecha pedido
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                  Recepción
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-600 min-w-[140px]">
                  Proveedor
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                  Comprobante
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right">
                  Total
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                  Estado
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right w-[120px]">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-slate-700">{row.no}</TableCell>
                  <TableCell className="tabular-nums text-slate-700">
                    {fmtFecha(row.fechaPedido)}
                  </TableCell>
                  <TableCell className="tabular-nums text-slate-700">
                    {fmtFecha(row.fechaRecepcion)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="size-8 shrink-0 border border-slate-100">
                        <AvatarFallback className="text-[10px] font-bold bg-slate-100 text-slate-700">
                          {row.proveedor.iniciales}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium text-slate-800">
                        {row.proveedor.nombre}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{row.comprobante}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-slate-800">
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
                        className="size-8 text-sky-600 hover:text-sky-700"
                        aria-label="Ver"
                        onClick={() => setDetalle(row)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-sky-600 hover:text-sky-700"
                        aria-label="Editar"
                        asChild
                      >
                        <Link to={`/compras/nueva?edit=${encodeURIComponent(row.id)}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-400 hover:text-red-600"
                        aria-label="Eliminar"
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <DetalleCompraDialog
        open={!!detalle}
        onOpenChange={(o) => !o && setDetalle(null)}
        compra={detalle}
      />
    </div>
  );
};

export default Compras;
