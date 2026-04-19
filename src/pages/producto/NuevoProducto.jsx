import { useEffect } from "react";
import { useNavigationStore } from "@/context/useNavigationStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const NuevoProducto = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);

  useEffect(() => {
    setTitulo("Nuevo producto");
  }, [setTitulo]);

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <Card className="max-w-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-(--color-pagina)">Registrar producto</CardTitle>
          <CardDescription>
            Formulario base para alta de productos. Conecta aquí tu API cuando esté lista.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" placeholder="Nombre del producto" className="bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="VF-000-XX-X" className="bg-slate-50 font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precio">Precio venta</Label>
              <Input id="precio" type="number" placeholder="0.00" className="bg-slate-50" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" className="bg-(--color-pagina) hover:bg-(--color-borde-button) text-white">
              Guardar
            </Button>
            <Button variant="outline" asChild>
              <Link to="/inventario">Volver a inventario</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NuevoProducto;
