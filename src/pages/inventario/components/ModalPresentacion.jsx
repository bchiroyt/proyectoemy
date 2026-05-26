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
        estado: data.estado ? "Activo" : "Inactivo",
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 border-t-4 border-(--color-pagina) shadow-2xl">

        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-lg">
            {data ? "Editar Presentación" : "Nueva Presentación"}
          </h2>

          <button
            onClick={onClose}
            className="hover:bg-gray-100 p-2 rounded-xl transition cursor-pointer"
          >
            <X />
          </button>
        </div>

        <div className="space-y-4">

          <input
            value={form.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            placeholder="Nombre"
            className="w-full border border-gray-200 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-(--color-pagina)"
          />

          <textarea
            value={form.descripcion}
            onChange={(e) => handleChange("descripcion", e.target.value)}
            placeholder="Descripción"
            className="w-full border border-gray-200 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-(--color-pagina)"
          />

          <select
            value={form.estado}
            onChange={(e) => handleChange("estado", e.target.value)}
            className="w-full border border-gray-200 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-(--color-pagina) cursor-pointer"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-2xl hover:bg-gray-100 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="bg-(--color-pagina-2) text-white px-5 py-2 rounded-2xl hover:opacity-90 transition cursor-pointer"
          >
            Guardar
          </button>

        </div>

      </div>
    </div>
  );
};

export default ModalPresentacion;