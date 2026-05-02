import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModalUbicacion from "./components/ModalUbicacion";

import {
  obtenerUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  eliminarUbicacion,
} from "@/services/ubicaciones";

const GestionUbicaciones = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [ubicacionAEliminar, setUbicacionAEliminar] = useState(null);

  // --- FUNCIONES ---

  // 🔥 CARGAR - Optimizado con useCallback
  const fetchUbicaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerUbicaciones({
        Activo: true,
        Page: 1,
        PageSize: 10,
      });
      setUbicaciones(data.items || []);
    } catch (error) {
      console.error("Error al cargar ubicaciones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUbicaciones();
  }, [fetchUbicaciones]);

  // 🔥 GUARDAR
  const handleGuardar = async (form) => {
    try {
      if (editando) {
        await actualizarUbicacion(editando.idUbicacion, form);
      } else {
        await crearUbicacion(form);
      }

      await fetchUbicaciones();
      setOpenModal(false);
      setEditando(null);
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  // 🔥 EDITAR
  const handleEditar = (u) => {
    setEditando(u);
    setOpenModal(true);
  };

  // 🔥 ELIMINAR
  const handleEliminarClick = (u) => {
    setUbicacionAEliminar(u);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await eliminarUbicacion(ubicacionAEliminar.idUbicacion);
      await fetchUbicaciones();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
    } finally {
      setDeleteModal(false);
      setUbicacionAEliminar(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-(--color-pagina)">
        Gestión de Ubicaciones
      </h1>

      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            setEditando(null);
            setOpenModal(true);
          }}
          className="bg-(--color-pagina) text-white px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          + Crear Ubicación
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
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-400">
                  Cargando ubicaciones...
                </td>
              </tr>
            ) : ubicaciones.length > 0 ? (
              ubicaciones.map((u) => (
                <tr key={u.idUbicacion} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-700">{u.idUbicacion}</td>
                  <td className="p-4 font-medium">{u.nombre}</td>
                  <td className="p-4 text-gray-500">{u.descripcion || "Sin descripción"}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEditar(u)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminarClick(u)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-400">
                  No se encontraron ubicaciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORMULARIO */}
      <ModalUbicacion
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
            <h2 className="text-lg font-bold mb-2 text-gray-900">Eliminar Ubicación</h2>
            <p className="text-gray-500">
              ¿Estás seguro que deseas eliminar <span className="font-semibold text-gray-700">"{ubicacionAEliminar?.nombre}"</span>? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200 font-medium"
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

export default GestionUbicaciones;