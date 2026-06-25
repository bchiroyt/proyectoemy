import { useState, useEffect, useCallback } from "react";
import { Check, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import ModalCatalogoInventario from "./components/ModalCatalogoInventario";
import Paginacion from "@/components/shared/Paginacion";

import {
  obtenerPresentaciones,
  crearPresentacion,
  actualizarPresentacion,
  eliminarPresentacion,
} from "@/services/presentaciones";

const PAGE_SIZE = 10;

const GestionPresentacion = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((s) => s.setTitulo);

  const [presentaciones, setPresentaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [presentacionAEliminar, setPresentacionAEliminar] = useState(null);
  const [accionEstado, setAccionEstado] = useState("eliminar");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [estadoFiltro, setEstadoFiltro] = useState("activos");

  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(from + PAGE_SIZE - 1, totalRecords);

  const fetchPresentaciones = useCallback(async () => {
    setLoading(true);

    try {
      const data = await obtenerPresentaciones({
        Page: page,
        PageSize: PAGE_SIZE,
        Activo: estadoFiltro === "activos",
      });

      setPresentaciones(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.totalRecords || 0);
    } catch (error) {
      console.error("Error al obtener presentaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [page, estadoFiltro]);

  useEffect(() => {
    setTitulo("Presentación");
  }, [setTitulo]);

  useEffect(() => {
    fetchPresentaciones();
  }, [fetchPresentaciones]);

  const handleGuardar = async (form) => {
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        estado: form.activo,
      };

      if (editando) {
        await actualizarPresentacion(editando.idPresentacion, payload);
      } else {
        await crearPresentacion(payload);
      }

      await fetchPresentaciones();

      setOpenModal(false);
      setEditando(null);
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la presentación.");
    }
  };

  const handleEditar = (p) => {
    setEditando(p);
    setOpenModal(true);
  };

  const handleEliminarClick = (p) => {
    setPresentacionAEliminar(p);
    setAccionEstado("eliminar");
    setDeleteModal(true);
  };

  const handleActivarClick = (p) => {
    setPresentacionAEliminar(p);
    setAccionEstado("activar");
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!presentacionAEliminar) return;

    try {
      if (accionEstado === "activar") {
        await actualizarPresentacion(presentacionAEliminar.idPresentacion, {
          nombre: presentacionAEliminar.nombre,
          descripcion: presentacionAEliminar.descripcion,
          estado: true,
        });
      } else {
        await eliminarPresentacion(presentacionAEliminar.idPresentacion);
      }

      await fetchPresentaciones();
    } catch (error) {
      console.error(error);
      alert("Error al intentar eliminar.");
    } finally {
      setDeleteModal(false);
      setPresentacionAEliminar(null);
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
            className="bg-(--color-pagina) text-(--color-blanco) px-5 py-2 rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            + Crear Presentación
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
            className="flex items-center gap-2 bg-green-600 text-(--color-blanco) px-4 py-2 rounded-2xl hover:bg-green-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="bg-(--color-blanco) rounded-2xl shadow-sm border border-(--color-gris-claro-2) overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-(--color-gris-claro-2) text-(--color-gris-letra) font-medium border-b">
              <tr>
                <th className="p-4">#</th>
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
                presentaciones.map((p, index) => {
                  const esActivo = (p.estado ?? p.activo ?? true) !== false;

                  return (
                  <tr
                    key={p.idPresentacion}
                    className={`transition-colors ${
                      esActivo ? "hover:bg-gray-50" : "bg-gray-100/60 opacity-75 hover:bg-gray-100"
                    }`}
                  >
                    <td className="p-4 font-medium">
                      {index + 1}
                    </td>

                    <td className="p-4">
                      <span className={esActivo ? "" : "text-gray-400 line-through"}>{p.nombre}</span>
                    </td>

                    <td className="p-4 text-gray-500">
                      {p.descripcion || "Sin descripción"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          esActivo
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {esActivo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditar(p)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {esActivo ? (
                          <button
                            onClick={() => handleEliminarClick(p)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                            title="Eliminar presentación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivarClick(p)}
                            className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors cursor-pointer"
                            title="Reactivar presentación"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
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
      </div>

      <ModalCatalogoInventario
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditando(null);
        }}
        onSave={handleGuardar}
        data={editando}
        tituloNuevo="Nueva Presentación"
        tituloEditar="Editar Presentación"
      />

      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {accionEstado === "activar" ? "Reactivar Presentación" : "Confirmar eliminación"}
            </h2>

            <p className="text-gray-500">
              {accionEstado === "activar" ? "Estás a punto de reactivar la presentación " : "Estás a punto de eliminar la presentación "}
              <span className="font-semibold text-gray-700">
                "{presentacionAEliminar?.nombre}"
              </span>
              .
            </p>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmDelete}
                className={`px-4 py-2 text-white rounded-2xl transition-colors cursor-pointer ${
                  accionEstado === "activar" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {accionEstado === "activar" ? "Reactivar" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPresentacion;
