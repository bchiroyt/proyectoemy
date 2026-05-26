import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModalCategoria from "./components/ModalCategoria";

import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "@/services/categorias";

const GestionCategorias = () => {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

  const [errorModal, setErrorModal] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");

  const fetchCategorias = useCallback(async () => {
    setLoading(true);

    try {
      const data = await obtenerCategorias({
        Page: 1,
        PageSize: 50,
      });

      setCategorias(data.items || []);
    } catch (error) {
      console.error(error);

      setErrorMensaje("Error al cargar categorías");
      setErrorModal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const handleGuardar = async (form) => {
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        estado: form.estado,
      };

      if (editando) {
        await actualizarCategoria(editando.idCategoria, payload);
      } else {
        await crearCategoria(payload);
      }

      await fetchCategorias();

      setOpenModal(false);
      setEditando(null);
    } catch (error) {
      console.error(error);

      setErrorMensaje("Error al guardar categoría");
      setErrorModal(true);
    }
  };

  const handleEditar = (cat) => {
    setEditando(cat);
    setOpenModal(true);
  };

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

      setErrorMensaje("Error al eliminar categoría");
      setErrorModal(true);
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

      <div className="flex justify-between items-center">

        <button
          onClick={() => {
            setEditando(null);
            setOpenModal(true);
          }}
          className="bg-(--color-pagina) text-white px-5 py-2 rounded-xl hover:opacity-90"
        >
          + Crear Categoría
        </button>

        <button
          onClick={() => navigate("/inventario")}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>

      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Descripción</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan="5" className="p-10 text-center">
                  Cargando...
                </td>
              </tr>
            ) : categorias.length > 0 ? (
              categorias.map((cat, index) => (
                <tr
                  key={index + 1}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="p-4">
                    {cat.idCategoria}
                  </td>

                  <td className="p-4">
                    {cat.nombre}
                  </td>

                  <td className="p-4">
                    {cat.descripcion || "Sin descripción"}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        cat.estado
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {cat.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="p-4 flex justify-center gap-2">

                    <button
                      onClick={() => handleEditar(cat)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-blue-50"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEliminarClick(cat)}
                      className="p-2 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>

                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-10 text-center text-gray-400"
                >
                  No hay categorías disponibles.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

      <ModalCategoria
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditando(null);
        }}
        onSave={handleGuardar}
        data={editando}
      />

      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-2xl w-full max-w-sm">

            <h2 className="text-lg font-bold mb-3">
              Eliminar Categoría
            </h2>

            <p>
              ¿Seguro que deseas eliminar "
              {categoriaAEliminar?.nombre}"?
            </p>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Eliminar
              </button>

            </div>

          </div>

        </div>
      )}

      {errorModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-2xl w-full max-w-sm">

            <h2 className="text-lg font-bold text-red-500 mb-3">
              Error
            </h2>

            <p>{errorMensaje}</p>

            <div className="flex justify-end mt-6">

              <button
                onClick={() => setErrorModal(false)}
                className="px-4 py-2 bg-(--color-pagina) text-white rounded-lg"
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default GestionCategorias;