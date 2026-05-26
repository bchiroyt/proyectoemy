import { useState, useEffect } from "react";
import { X } from "lucide-react";

const ModalUbicacion = ({
  open,
  onClose,
  onSave,
  data,
}) => {

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        nombre: data.nombre || "",
        descripcion: data.descripcion || "",
        activo: data.activo ?? true,
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

  const handleSave = () => {
    if (!form.nombre.trim()) return;

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-gray-200 shadow-xl">

        <div className="flex justify-between items-center mb-5">

          <h2 className="font-semibold text-lg">
            {data
              ? "Editar Ubicación"
              : "Nueva Ubicación"}
          </h2>

          <button
            onClick={onClose}
            className="cursor-pointer"
          >
            <X />
          </button>

        </div>

        <div className="space-y-4">

          <input
            value={form.nombre}
            onChange={(e) =>
              handleChange("nombre", e.target.value)
            }
            placeholder="Nombre"
            className="w-full border p-3 rounded-xl"
          />

          <textarea
            value={form.descripcion}
            onChange={(e) =>
              handleChange("descripcion", e.target.value)
            }
            placeholder="Descripción"
            className="w-full border p-3 rounded-xl"
          />

          <select
            value={form.activo ? "Activo" : "Inactivo"}
            onChange={(e) =>
              handleChange(
                "activo",
                e.target.value === "Activo"
              )
            }
            className="w-full border p-3 rounded-xl cursor-pointer"
          >
            <option>Activo</option>
            <option>Inactivo</option>
          </select>

          <div className="flex justify-end gap-3 pt-2">

            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              className="bg-(--color-pagina-2) text-white px-5 py-2 rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Guardar
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ModalUbicacion;