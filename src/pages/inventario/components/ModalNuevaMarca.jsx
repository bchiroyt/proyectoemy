import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { crearMarca, actualizarMarca } from "@/services/marcas";

const ModalNuevaMarca = ({ open, onClose, onSave, marcaEditar }) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 CARGAR DATOS SI ES EDICIÓN
  useEffect(() => {
    if (marcaEditar) {
      setNombre(marcaEditar.nombre || "");
      setDescripcion(marcaEditar.descripcion || "");
    } else {
      setNombre("");
      setDescripcion("");
    }
  }, [marcaEditar, open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!nombre.trim()) return;

    try {
      setLoading(true);

      let response;

      if (marcaEditar) {
        // 🔥 EDITAR
        response = await actualizarMarca(marcaEditar.idMarca, {
          nombre,
          descripcion,
        });
      } else {
        // 🔥 CREAR
        response = await crearMarca({
          nombre,
          descripcion,
        });
      }

      const marca = response.data || response;

      onSave(marca);

      onClose();

    } catch (error) {
      console.error(error);
      alert("Error al guardar marca");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border-t-4 border-(--color-pagina)">

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">
            {marcaEditar ? "Editar Marca" : "Nueva Marca"}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="space-y-4">

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="w-full border p-3 rounded-lg"
          />

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción"
            className="w-full border p-3 rounded-lg"
          />

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-(--color-pagina-2) text-white py-3 rounded-xl"
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