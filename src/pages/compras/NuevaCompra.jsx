import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { CATALOGO_COMPRA_MOCK } from "@/data/comprasMock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Info,
  Minus,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(n);

const IVA_RATE = 0.12;

const NuevaCompra = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [proveedor, setProveedor] = useState("amelisa");
  const [fechaPedido, setFechaPedido] = useState("2025-03-15");
  const [fechaRecepcion, setFechaRecepcion] = useState("2025-03-18");
  const [documentoRef, setDocumentoRef] = useState("REF-00123");
  const [tipoComprobante, setTipoComprobante] = useState("fel");
  const [notas, setNotas] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [lineas, setLineas] = useState([
    { ...CATALOGO_COMPRA_MOCK[0], cantidad: 5 },
    { ...CATALOGO_COMPRA_MOCK[1], cantidad: 5 },
  ]);

  useEffect(() => {
    setTitulo(editId ? "Editar compra" : "Nueva orden de compra");
  }, [setTitulo, editId]);

  const catalogoFiltrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return CATALOGO_COMPRA_MOCK;
    return CATALOGO_COMPRA_MOCK.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [busqueda]);

  const subtotal = lineas.reduce((a, l) => a + l.costo * l.cantidad, 0);
  const ivaIncluido = subtotal - subtotal / (1 + IVA_RATE);
  const total = subtotal;
  const articulos = lineas.reduce((a, l) => a + l.cantidad, 0);

  const agregar = (p) => {
    setLineas((prev) => {
      const ex = prev.find((x) => x.id === p.id);
      if (ex) {
        return prev.map((x) =>
          x.id === p.id ? { ...x, cantidad: x.cantidad + 1 } : x
        );
      }
      return [...prev, { ...p, cantidad: 1 }];
    });
  };

  const setCant = (id, delta) => {
    setLineas((prev) =>
      prev
        .map((x) =>
          x.id === id
            ? { ...x, cantidad: Math.max(1, x.cantidad + delta) }
            : x
        )
        .filter((x) => x.cantidad > 0)
    );
  };

  const quitar = (id) => setLineas((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-3 border-b border-slate-200/80">
        <Button variant="ghost" size="sm" className="gap-1.5 w-fit -ml-2" asChild>
          <Link to="/compras">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Nueva Orden de Compra
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestión de suministros y entrada de inventario
            {editId ? (
              <span className="ml-1 font-mono text-(--color-pagina)">· {editId}</span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Avatar className="size-9 border border-slate-200">
            <AvatarImage src="" alt="" />
            <AvatarFallback className="bg-(--color-pagina) text-white text-sm font-bold">
              AD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-slate-800">
              Datos generales de la orden
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Proveedor
                </Label>
                <Select value={proveedor} onValueChange={setProveedor}>
                  <SelectTrigger className="bg-slate-50 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amelisa">Distribuidora Amelisa</SelectItem>
                    <SelectItem value="norte">Textiles del Norte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Fecha de pedido
                </Label>
                <Input
                  type="date"
                  value={fechaPedido}
                  onChange={(e) => setFechaPedido(e.target.value)}
                  className="bg-slate-50 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  No. documento / Ref.
                </Label>
                <Input
                  value={documentoRef}
                  onChange={(e) => setDocumentoRef(e.target.value)}
                  placeholder="REF-00123"
                  className="bg-slate-50 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Tipo comprobante
                </Label>
                <Select value={tipoComprobante} onValueChange={setTipoComprobante}>
                  <SelectTrigger className="bg-slate-50 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fel">Factura electrónica</SelectItem>
                    <SelectItem value="fce">Factura en papel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Fecha de recepción
                </Label>
                <Input
                  type="date"
                  value={fechaRecepcion}
                  onChange={(e) => setFechaRecepcion(e.target.value)}
                  className="bg-slate-50 h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px] items-start">
          <div className="space-y-4 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal-600/70" />
              <Input
                placeholder="Buscar productos por nombre, SKU o código de barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={cn(
                  "pl-10 h-11 border-teal-100",
                  "bg-teal-50/60 placeholder:text-slate-500 focus-visible:ring-teal-200"
                )}
              />
            </div>

            {catalogoFiltrado.length > 0 && busqueda.trim() && (
              <Card className="border-teal-100 bg-white shadow-sm">
                <CardContent className="p-2 max-h-40 overflow-y-auto">
                  {catalogoFiltrado.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        agregar(p);
                        setBusqueda("");
                      }}
                      className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-teal-50 flex justify-between gap-2"
                    >
                      <span className="font-medium text-slate-800">{p.nombre}</span>
                      <span className="text-xs text-slate-500 font-mono">{p.sku}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold">Productos</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[min(360px,45vh)] sm:h-[min(400px,50vh)]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-[10px] uppercase font-bold">
                        Producto
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold w-28">
                        SKU
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right w-24">
                        Costo
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center w-36">
                        Cantidad
                      </TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right w-28">
                        Subtotal
                      </TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineas.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{row.nombre}</p>
                            <p className="text-xs text-slate-500">{row.detalle}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {fmtQ(row.costo)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-8"
                              onClick={() => setCant(row.id, -1)}
                            >
                              <Minus className="size-3.5" />
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold tabular-nums">
                              {row.cantidad}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-8"
                              onClick={() => setCant(row.id, 1)}
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-sm">
                          {fmtQ(row.costo * row.cantidad)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-400 hover:text-red-600"
                            onClick={() => quitar(row.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="flex items-start gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/80 text-xs text-slate-600">
                <Info className="size-4 shrink-0 text-sky-600 mt-0.5" />
                <p>
                  Agregue productos desde el buscador para verlos reflejados aquí.
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-4 min-w-0">
            <Card className="border-0 shadow-md bg-(--color-pagina) text-white overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">
                  Total estimado
                </p>
                <p className="text-3xl font-black tabular-nums">{fmtQ(total)}</p>
                <div className="space-y-2 text-sm border-t border-white/20 pt-3">
                  <div className="flex justify-between text-white/90">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{fmtQ(subtotal / (1 + IVA_RATE))}</span>
                  </div>
                  <div className="flex justify-between text-white/90">
                    <span>IVA (12%) incluido</span>
                    <span className="tabular-nums">{fmtQ(ivaIncluido)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Artículos</span>
                    <span>
                      {articulos} {articulos === 1 ? "artículo" : "artículos"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-bold">Notas internas</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Textarea
                  placeholder="Observaciones adicionales..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="min-h-[120px] bg-slate-50 resize-y"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-slate-200 bg-white pt-3 pb-1 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0">
        <Button variant="outline" type="button" onClick={() => setLineas([])}>
          Limpiar
        </Button>
        <Button variant="secondary" type="button" asChild>
          <Link to="/compras">Cancelar orden</Link>
        </Button>
        <Button
          type="button"
          className="bg-(--color-pagina-2) hover:opacity-90 text-white font-semibold sm:min-w-[160px]"
        >
          Registrar orden
        </Button>
      </footer>
    </div>
  );
};

export default NuevaCompra;
