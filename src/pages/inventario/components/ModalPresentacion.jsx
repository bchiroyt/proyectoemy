import { useState, useEffect } from "react";
import { X } from "lucide-react";

const ModalPresentacion = ({ open, onClose, onSave, data }) => {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    estado: "Activo",
  });

  useEffect(() => {
    if (data) {
      setForm({
        nombre: data.nombre || "",
        descripcion: data.descripcion || "",
        estado: data.estado || "Activo",
      });
    } else {
      setForm({
        nombre: "",
        descripcion: "",
        estado: "Activo",
      });
    }
  }, [data, open]);

  if (!open) return null;

  const handleChange = (campo, valor) => {
    setForm({ ...form, [campo]: valor });
  };

  const handleSave = () => {
    if (!form.nombre.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border-t-4 border-(--color-pagina)">

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">
            {data ? "Editar Presentación" : "Nueva Presentación"}
          </h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="space-y-4">

          <input
            value={form.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            placeholder="Nombre (Ej: Caja, Unidad, Pack)"
            className="w-full border p-3 rounded-lg"
          />

          <textarea
            value={form.descripcion}
            onChange={(e) => handleChange("descripcion", e.target.value)}
            placeholder="Descripción"
            className="w-full border p-3 rounded-lg"
          />

          <select
            value={form.estado}
            onChange={(e) => handleChange("estado", e.target.value)}
            className="w-full border p-3 rounded-lg"
          >
            <option>Activo</option>
            <option>Inactivo</option>
          </select>

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="bg-(--color-pagina-2) text-white px-5 py-2 rounded-lg"
          >
            Guardar
          </button>

        </div>

      </div>
    </div>
  );
};

export default ModalPresentacion;