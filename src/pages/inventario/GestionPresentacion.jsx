import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModalPresentacion from "./components/ModalPresentacion";

import {
  obtenerPresentaciones,
  crearPresentacion,
  actualizarPresentacion,
  eliminarPresentacion,
} from "@/services/presentaciones";

const GestionPresentacion = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [presentaciones, setPresentaciones] = useState([]);
  const [loading, setLoading] = useState(false); // Opcional: para feedback visual
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [presentacionAEliminar, setPresentacionAEliminar] = useState(null);

  // --- FUNCIONES ---

  // CARGAR - Envuelta en useCallback para evitar el warning de image_742168.png
  const fetchPresentaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerPresentaciones({
        Activo: true,
        Page: 1,
        PageSize: 10,
      });
      setPresentaciones(data.items || []);
    } catch (error) {
      console.error("Error al obtener presentaciones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto inicial de carga
  useEffect(() => {
    fetchPresentaciones();
  }, [fetchPresentaciones]);

  // GUARDAR (Crear o Editar)
  const handleGuardar = async (form) => {
    try {
      if (editando) {
        await actualizarPresentacion(editando.idPresentacion, form);
      } else {
        await crearPresentacion(form);
      }
      
      // Refrescar lista y cerrar modal
      await fetchPresentaciones();
      setOpenModal(false);
      setEditando(null);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar la presentación.");
    }
  };

  // EDITAR (Abrir modal con datos)
  const handleEditar = (p) => {
    setEditando(p);
    setOpenModal(true);
  };

  // ELIMINAR (Manejo de confirmación)
  const handleEliminarClick = (p) => {
    setPresentacionAEliminar(p);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!presentacionAEliminar) return;
    
    try {
      await eliminarPresentacion(presentacionAEliminar.idPresentacion);
      await fetchPresentaciones();
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error al intentar eliminar.");
    } finally {
      setDeleteModal(false);
      setPresentacionAEliminar(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-(--color-pagina)">
        Gestión de Presentaciones
      </h1>

      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            setEditando(null);
            setOpenModal(true);
          }}
          className="bg-(--color-pagina) text-white px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          + Crear Presentación
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
          <thead className="bg-gray-50 text-gray-600 font-medium border-b">
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
                  Cargando presentaciones...
                </td>
              </tr>
            ) : presentaciones.length > 0 ? (
              presentaciones.map((p) => (
                <tr key={p.idPresentacion} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{p.idPresentacion}</td>
                  <td className="p-4">{p.nombre}</td>
                  <td className="p-4 text-gray-500">{p.descripcion || "Sin descripción"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEditar(p)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminarClick(p)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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
                  No se encontraron presentaciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORMULARIO */}
      <ModalPresentacion
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditando(null);
        }}
        onSave={handleGuardar}
        data={editando}
      />

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2">¿Confirmar eliminación?</h2>
            <p className="text-gray-500">
              Estás a punto de eliminar la presentación <span className="font-semibold text-gray-700">"{presentacionAEliminar?.nombre}"</span>. Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPresentacion;