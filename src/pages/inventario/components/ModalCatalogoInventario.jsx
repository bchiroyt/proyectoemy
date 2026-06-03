import { useEffect, useState } from "react";
import { X } from "lucide-react";

function leerActivo(item) {
  if (!item) return true;
  if (typeof item.activo === "boolean") return item.activo;
  if (typeof item.estado === "boolean") return item.estado;
  if (item.estado === "Activo" || item.estado === "activo") return true;
  if (item.estado === "Inactivo" || item.estado === "inactivo") return false;
  return true;
}

const ModalCatalogoInventario = ({
  open,
  onClose,
  onSave,
  data = null,
  tituloNuevo = "Nuevo registro",
  tituloEditar = "Editar registro",
  nombrePlaceholder = "Nombre",
  descripcionPlaceholder = "Descripción",
}) => {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (data) {
      setForm({
        nombre: data.nombre || "",
        descripcion: data.descripcion || "",
        activo: leerActivo(data),
      });
    } else {
      setForm({
        nombre: "",
        descripcion: "",
        activo: true,
      });
    }
  }, [data, open]);

  if (!open) return null;

  const handleChange = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || guardando) return;

    try {
      setGuardando(true);
      await onSave(form);
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-2xl border-t-4 border-(--color-pagina) bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {data ? tituloEditar : tituloNuevo}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="cursor-pointer text-gray-500 hover:text-gray-800 disabled:opacity-50"
          >
            <X />
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={form.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            placeholder={nombrePlaceholder}
            className="w-full rounded-lg border p-3 outline-none focus:border-gray-400"
          />

          <textarea
            value={form.descripcion}
            onChange={(e) => handleChange("descripcion", e.target.value)}
            placeholder={descripcionPlaceholder}
            className="min-h-[88px] w-full resize-y rounded-lg border p-3 outline-none focus:border-gray-400"
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={guardando}
            className="w-full cursor-pointer rounded-xl bg-(--color-pagina-2) py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {guardando ? "Guardando..." : data ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCatalogoInventario;
