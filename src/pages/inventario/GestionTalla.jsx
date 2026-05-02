import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModalTalla from "./components/ModalTalla";

import {
  obtenerTallas,
  crearTalla,
  actualizarTalla,
  eliminarTalla,
} from "@/services/tallas";

const GestionTallas = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [tallas, setTallas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [tallaAEliminar, setTallaAEliminar] = useState(null);

  // --- FUNCIONES ---

  // 🔥 CARGAR - Optimizado con useCallback para evitar renders infinitos
  const fetchTallas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerTallas({
        Activo: true,
        Page: 1,
        PageSize: 10,
      });
      setTallas(data.items || []);
    } catch (error) {
      console.error("Error al cargar tallas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTallas();
  }, [fetchTallas]);

  // 🔥 GUARDAR
  const handleGuardar = async (form) => {
    try {
      if (editando) {
        await actualizarTalla(editando.idTalla, form);
      } else {
        await crearTalla(form);
      }

      await fetchTallas();
      setOpenModal(false);
      setEditando(null);
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  // 🔥 EDITAR
  const handleEditar = (t) => {
    setEditando(t);
    setOpenModal(true);
  };

  // 🔥 ELIMINAR
  const handleEliminarClick = (t) => {
    setTallaAEliminar(t);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await eliminarTalla(tallaAEliminar.idTalla);
      await fetchTallas();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
    } finally {
      setDeleteModal(false);
      setTallaAEliminar(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-(--color-pagina)">
        Gestión de Tallas
      </h1>

      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            setEditando(null);
            setOpenModal(true);
          }}
          className="bg-(--color-pagina) text-white px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          + Crear Talla
        </button>

        <button
          onClick={() => navigate("/inventario")}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 font-medium">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Descripción</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-400">
                  Cargando tallas...
                </td>
              </tr>
            ) : tallas.length > 0 ? (
              tallas.map((t) => (
                <tr key={t.idTalla} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{t.idTalla}</td>
                  <td className="p-4">{t.nombre}</td>
                  <td className="p-4 text-gray-500">{t.descripcion || "Sin descripción"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${t.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEditar(t)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminarClick(t)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-400">
                  No se encontraron tallas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORMULARIO */}
      <ModalTalla
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditando(null);
        }}
        onSave={handleGuardar}
        data={editando}
      />

      {/* MODAL ELIMINAR */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Eliminar Talla</h2>
            <p className="text-gray-500">
              ¿Seguro que deseas eliminar la talla <span className="font-semibold text-gray-700">"{tallaAEliminar?.nombre}"</span>?
            </p>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTallas;