import { useState, useEffect, useCallback } from "react";
import { Check, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import ModalCatalogoInventario from "./components/ModalCatalogoInventario";
import Paginacion from "@/components/shared/Paginacion";
import { EstadoErrorCarga } from "@/components/shared/EstadoErrorCarga";

import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "@/services/categorias";

const PAGE_SIZE = 10;

const GestionCategorias = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((s) => s.setTitulo);

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [accionEstado, setAccionEstado] = useState("eliminar");

  const [errorModal, setErrorModal] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [estadoFiltro, setEstadoFiltro] = useState("activos");

  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(from + PAGE_SIZE - 1, totalRecords);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);

    try {
      setErrorCarga(null);

      const data = await obtenerCategorias({
        Page: page,
        PageSize: PAGE_SIZE,
        Activo: estadoFiltro === "activos",
      });

      setCategorias(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.totalRecords || 0);
    } catch (error) {
      console.error(error);
      setErrorCarga(error);
      setCategorias([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [page, estadoFiltro]);

  useEffect(() => {
    setTitulo("Categorías");
  }, [setTitulo]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const handleGuardar = async (form) => {
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        estado: form.activo,
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
    setAccionEstado("eliminar");
    setDeleteModal(true);
  };

  const handleActivarClick = (cat) => {
    setCategoriaAEliminar(cat);
    setAccionEstado("activar");
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (accionEstado === "activar") {
        await actualizarCategoria(categoriaAEliminar.idCategoria, {
          nombre: categoriaAEliminar.nombre,
          descripcion: categoriaAEliminar.descripcion,
          estado: true,
        });
      } else {
        await eliminarCategoria(categoriaAEliminar.idCategoria);
      }

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

  const handleEstadoFiltroChange = (event) => {
    setEstadoFiltro(event.target.value);
    setPage(1);
  };

  return (
    <div className="flex h-full flex-col">

      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-1 border-b border-border bg-(--color-blanco) p-2 shadow-sm">
        <div className="flex flex-1 justify-start gap-2">
          <button
            onClick={() => {
              setEditando(null);
              setOpenModal(true);
            }}
            className="bg-(--color-pagina) text-(--color-blanco) px-5 py-2 rounded-xl hover:opacity-90"
          >
            + Crear Categoría
          </button>
        </div>
        <div className="flex flex-1 justify-end items-center gap-3">
          <select
            value={estadoFiltro}
            onChange={handleEstadoFiltroChange}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-(--color-pagina)"
          >
            <option value="activos">Activos</option>
            <option value="eliminados">Eliminados</option>
          </select>
          <Paginacion
            from={from}
            to={to}
            total={totalRecords}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            disablePrev={page <= 1}
            disableNext={page >= totalPages}
            isLoading={loading}
          />
          <button
            onClick={() => navigate("/inventario")}
            className="flex items-center gap-2 bg-green-600 text-(--color-blanco) px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>
        </div>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="bg-(--color-blanco) rounded-xl shadow-sm border overflow-hidden">

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
              ) : errorCarga ? (
                <EstadoErrorCarga
                  colSpan={5}
                  error={errorCarga}
                  nombreModulo="Categorías"
                  fallbackGenerico="No se pudieron cargar las categorías."
                  onReintentar={fetchCategorias}
                />
              ) : categorias.length > 0 ? (
                categorias.map((cat, index) => {
                  const esActivo = (cat.estado ?? cat.activo ?? true) !== false;

                  return (
                  <tr
                    key={`categoria-${cat.idCategoria ?? "sin-id"}-${index}`}
                    className={`border-t ${
                      esActivo ? "hover:bg-gray-50" : "bg-gray-100/60 opacity-75 hover:bg-gray-100"
                    }`}
                  >

                    <td className="p-4">
                      {cat.idCategoria}
                    </td>

                    <td className="p-4">
                      <span className={esActivo ? "" : "text-gray-400 line-through"}>{cat.nombre}</span>
                    </td>

                    <td className="p-4">
                      {cat.descripcion || "Sin descripción"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${esActivo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {esActivo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="p-4 flex justify-center gap-2">

                      <button
                        onClick={() => handleEditar(cat)}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {esActivo ? (
                        <button
                          onClick={() => handleEliminarClick(cat)}
                          className="p-2 bg-red-50 rounded-lg hover:bg-red-100"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivarClick(cat)}
                          className="p-2 bg-green-50 rounded-lg hover:bg-green-100"
                          title="Reactivar categoría"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                      )}

                    </td>

                  </tr>
                  );
                })
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
      </div>

      <ModalCatalogoInventario
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditando(null);
        }}
        onSave={handleGuardar}
        data={editando}
        tituloNuevo="Nueva Categoría"
        tituloEditar="Editar Categoría"
      />

      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-2xl w-full max-w-sm">

            <h2 className="text-lg font-bold mb-3">
              {accionEstado === "activar" ? "Reactivar Categoría" : "Eliminar Categoría"}
            </h2>

            <p>
              {accionEstado === "activar" ? "¿Seguro que deseas reactivar " : "¿Seguro que deseas eliminar "}
              "{categoriaAEliminar?.nombre}"?
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
                className={`px-4 py-2 text-white rounded-lg ${
                  accionEstado === "activar" ? "bg-green-600" : "bg-red-500"
                }`}
              >
                {accionEstado === "activar" ? "Reactivar" : "Eliminar"}
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
