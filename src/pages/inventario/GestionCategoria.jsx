import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, ArrowLeft } from "lucide-react"; // Añadimos ArrowLeft
import { useNavigate } from "react-router-dom"; // Añadimos useNavigate
import ModalCategoria from "./components/ModalCategoria";

import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "@/services/categorias";

const GestionCategorias = () => {
  const navigate = useNavigate(); // Hook para la navegación

  // --- ESTADOS ---
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

  // --- FUNCIONES ---

  // 🔥 CARGAR - Optimizado con useCallback
  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerCategorias({
        Activo: true,
        Page: 1,
        PageSize: 10,
      });
      setCategorias(data.items || []);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // 🔥 GUARDAR
  const handleGuardar = async (form) => {
    try {
      if (editando) {
        await actualizarCategoria(editando.idCategoria, form);
      } else {
        await crearCategoria(form);
      }

      await fetchCategorias();
      setOpenModal(false);
      setEditando(null);
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  // 🔥 EDITAR
  const handleEditar = (cat) => {
    setEditando(cat);
    setOpenModal(true);
  };

  // 🔥 ELIMINAR (abrir modal)
  const handleEliminarClick = (cat) => {
    setCategoriaAEliminar(cat);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await eliminarCategoria(categoriaAEliminar.idCategoria);
      await fetchCategorias();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
    } finally {
      setDeleteModal(false);
      setCategoriaAEliminar(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-(--color-pagina)">
        Gestión de Categorías
      </h1>

      {/* SECCIÓN DE BOTONES ACCIÓN */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            setEditando(null);
            setOpenModal(true);
          }}
          className="bg-(--color-pagina) text-white px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          + Crear Categoría
        </button>

        {/* BOTÓN REGRESAR AÑADIDO */}
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
                <td colSpan="5" className="p-10 text-center text-gray-400">Cargando...</td>
              </tr>
            ) : categorias.length > 0 ? (
              categorias.map((cat) => (
                <tr key={cat.idCategoria} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{cat.idCategoria}</td>
                  <td className="p-4">{cat.nombre}</td>
                  <td className="p-4 text-gray-500">{cat.descripcion || "Sin descripción"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${cat.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cat.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEditar(cat)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminarClick(cat)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-400">No hay categorías disponibles.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR / EDITAR */}
      <ModalCategoria
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
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Eliminar Categoría</h2>
            <p className="text-gray-500">
              ¿Estás seguro de que deseas eliminar <span className="font-semibold">"{categoriaAEliminar?.nombre}"</span>?
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
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
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

export default GestionCategorias;