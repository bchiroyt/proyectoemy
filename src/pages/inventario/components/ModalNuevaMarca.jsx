import { useState, useEffect } from "react";
import { X } from "lucide-react";

import {
  crearMarca,
  actualizarMarca,
} from "@/services/marcas";

const ModalNuevaMarca = ({
  open,
  onClose,
  onSave,
  marcaEditar,
}) => {

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (marcaEditar) {
      setForm({
        nombre: marcaEditar.nombre || "",
        descripcion: marcaEditar.descripcion || "",
        activo: marcaEditar.activo ?? true,
      });
    } else {
      setForm({
        nombre: "",
        descripcion: "",
        activo: true,
      });
    }
  }, [marcaEditar, open]);

  if (!open) return null;

  const handleChange = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;

    try {
      setLoading(true);

      if (marcaEditar) {
        await actualizarMarca(
          marcaEditar.idMarca,
          form
        );
      } else {
        await crearMarca(form);
      }

      await onSave();

      onClose();

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-gray-200 shadow-xl">

        <div className="flex justify-between items-center mb-5">

          <h2 className="font-semibold text-lg">
            {marcaEditar
              ? "Editar Marca"
              : "Nueva Marca"}
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

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-(--color-pagina-2) text-white py-3 rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            {loading
              ? "Guardando..."
              : marcaEditar
              ? "Actualizar"
              : "Guardar"}
          </button>

        </div>

      </div>

    </div>
  );
};

export default ModalNuevaMarca;