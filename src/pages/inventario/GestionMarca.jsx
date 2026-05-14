import { useState, useEffect, useCallback } from "react";
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ModalNuevaMarca from "./components/ModalNuevaMarca";
import ModalConfirmacion from "./components/ModalConfirmacion";

import {
  obtenerMarcas,
  eliminarMarca,
} from "@/services/marcas";

const GestionMarcas = () => {
  const navigate = useNavigate();

  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [marcaEditar, setMarcaEditar] = useState(null);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [marcaAEliminar, setMarcaAEliminar] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // CARGAR MARCAS
  const fetchMarcas = useCallback(async () => {
    try {
      setLoading(true);

      const data = await obtenerMarcas({
        Page: 1,
        PageSize: 50,
      });

      setMarcas(data.items || []);
    } catch (error) {
      console.error("Error al cargar marcas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarcas();
  }, [fetchMarcas]);

  // GUARDAR
  const handleGuardar = async () => {
    await fetchMarcas();

    setMarcaEditar(null);
    setOpenModal(false);
  };

  // EDITAR
  const handleEditar = (marca) => {
    setMarcaEditar(marca);
    setOpenModal(true);
  };

  // ELIMINAR CLICK
  const handleEliminarClick = (marca) => {
    setMarcaAEliminar(marca);
    setOpenConfirm(true);
  };

  // ELIMINAR CONFIRMADO
  const handleEliminarConfirmado = async () => {
    if (!marcaAEliminar) return;

    try {
      setLoadingDelete(true);

      await eliminarMarca(marcaAEliminar.idMarca);

      await fetchMarcas();

      setOpenConfirm(false);
      setMarcaAEliminar(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold text-(--color-pagina)">
        Gestión de Marcas
      </h1>

      <div className="flex justify-between items-center">

        <button
          onClick={() => {
            setMarcaEditar(null);
            setOpenModal(true);
          }}
          className="bg-(--color-pagina) text-white px-5 py-2 rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          + Crear Marca
        </button>

        <button
          onClick={() => navigate("/inventario")}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-2xl hover:bg-green-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>

      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

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
                <td
                  colSpan="5"
                  className="p-10 text-center text-gray-400"
                >
                  Cargando marcas...
                </td>
              </tr>
            ) : marcas.length > 0 ? (
              marcas.map((m) => (
                <tr
                  key={m.idMarca}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-medium">
                    {m.idMarca}
                  </td>

                  <td className="p-4">
                    {m.nombre}
                  </td>

                  <td className="p-4 text-gray-500">
                    {m.descripcion || "Sin descripción"}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        m.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {m.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="p-4 flex justify-center gap-2">

                    <button
                      onClick={() => handleEditar(m)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEliminarClick(m)}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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
                  No hay marcas disponibles.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

      <ModalNuevaMarca
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setMarcaEditar(null);
        }}
        onSave={handleGuardar}
        marcaEditar={marcaEditar}
      />

      <ModalConfirmacion
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleEliminarConfirmado}
        loading={loadingDelete}
        titulo="Eliminar marca"
        mensaje={`¿Seguro que quieres eliminar "${marcaAEliminar?.nombre}"?`}
      />

    </div>
  );
};

export default GestionMarcas;