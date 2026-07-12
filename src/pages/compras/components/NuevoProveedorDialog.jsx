import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearProveedor } from "@/services/proveedoresService";
import { getApiErrorMessage } from "@/lib/apiClient";

const FORM_INICIAL = {
  nombre: "",
  telefono: "",
  telefono2: "",
  correo: "",
  direccion: "",
};

export function NuevoProveedorDialog({ onClose, onCreated }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [error, setError] = useState("");
  const closeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const actualizarCampo = (campo, valor) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const cerrar = () => {
    if (guardando) return;
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    onClose();
  };

  const guardar = async (event) => {
    event.preventDefault();
    const nombre = form.nombre.trim();
    if (!nombre || guardando || confirmado) return;

    setError("");
    setGuardando(true);

    const body = {
      nombre,
      telefono: form.telefono.trim(),
      telefono2: form.telefono2.trim(),
      correo: form.correo.trim(),
      direccion: form.direccion.trim(),
    };

    try {
      const respuesta = await crearProveedor(body);
      if (respuesta?.exito === false) {
        throw new Error(respuesta.mensaje || respuesta.Mensaje || "No se pudo crear el proveedor.");
      }

      setConfirmado(true);
      Promise.resolve(onCreated?.({ respuesta, nombre })).catch((errorRefresco) => {
        console.error("No se pudo refrescar la lista de proveedores:", errorRefresco);
      });

      closeTimerRef.current = window.setTimeout(() => {
        onClose();
      }, 1200);
    } catch (errorCreacion) {
      setError(getApiErrorMessage(errorCreacion, "No se pudo crear el proveedor."));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && cerrar()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar nuevo proveedor</DialogTitle>
          <DialogDescription>
            El nombre es el único campo obligatorio.
          </DialogDescription>
        </DialogHeader>

        {confirmado ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800"
          >
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
            Proveedor creado correctamente.
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nuevo-proveedor-nombre">Nombre comercial *</Label>
            <Input
              id="nuevo-proveedor-nombre"
              value={form.nombre}
              onChange={(event) => actualizarCampo("nombre", event.target.value)}
              placeholder="Ej. Distribuidora del Norte"
              autoFocus
              disabled={guardando || confirmado}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nuevo-proveedor-telefono">Teléfono principal</Label>
              <Input
                id="nuevo-proveedor-telefono"
                value={form.telefono}
                onChange={(event) => actualizarCampo("telefono", event.target.value)}
                placeholder="5555-5555"
                disabled={guardando || confirmado}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nuevo-proveedor-telefono2">Teléfono secundario</Label>
              <Input
                id="nuevo-proveedor-telefono2"
                value={form.telefono2}
                onChange={(event) => actualizarCampo("telefono2", event.target.value)}
                placeholder="2222-2222"
                disabled={guardando || confirmado}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nuevo-proveedor-correo">Correo electrónico</Label>
            <Input
              id="nuevo-proveedor-correo"
              type="email"
              value={form.correo}
              onChange={(event) => actualizarCampo("correo", event.target.value)}
              placeholder="proveedor@empresa.com"
              disabled={guardando || confirmado}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nuevo-proveedor-direccion">Dirección física</Label>
            <Textarea
              id="nuevo-proveedor-direccion"
              value={form.direccion}
              onChange={(event) => actualizarCampo("direccion", event.target.value)}
              placeholder="Calle principal, zona 10..."
              className="min-h-20 resize-none"
              disabled={guardando || confirmado}
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={cerrar}
              disabled={guardando || confirmado}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-(--color-pagina-2) text-white hover:opacity-90"
              disabled={!form.nombre.trim() || guardando || confirmado}
            >
              {guardando ? <Loader2 className="size-4 animate-spin" /> : null}
              {guardando ? "Guardando..." : confirmado ? "Creado" : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
