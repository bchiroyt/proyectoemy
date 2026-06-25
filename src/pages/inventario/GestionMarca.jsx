import { useState, useEffect, useCallback } from "react";
import { Check, Trash2, ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";

import ModalCatalogoInventario from "./components/ModalCatalogoInventario";
import ModalConfirmacion from "./components/ModalConfirmacion";
import Paginacion from "@/components/shared/Paginacion";

import {
  obtenerMarcas,
  crearMarca,
  actualizarMarca,
  eliminarMarca,
} from "@/services/marcas";

const PAGE_SIZE = 10;

const GestionMarcas = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((s) => s.setTitulo);

  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [marcaEditar, setMarcaEditar] = useState(null);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [marcaAEliminar, setMarcaAEliminar] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [accionEstado, setAccionEstado] = useState("eliminar");
  const [estadoFiltro, setEstadoFiltro] = useState("activos");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(from + PAGE_SIZE - 1, totalRecords);

  // CARGAR MARCAS
  const fetchMarcas = useCallback(async () => {
    try {
      setLoading(true);

      const data = await obtenerMarcas({
        Page: page,
        PageSize: PAGE_SIZE,
        Activo: estadoFiltro === "activos",
      });

      setMarcas(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.totalRecords || 0);
    } catch (error) {
      console.error("Error al cargar marcas:", error);
    } finally {
      setLoading(false);
    }
  }, [page, estadoFiltro]);

  useEffect(() => {
    setTitulo("Marcas");
  }, [setTitulo]);

  useEffect(() => {
    fetchMarcas();
  }, [fetchMarcas]);

  const handleGuardar = async (form) => {
    try {
      if (marcaEditar) {
        await actualizarMarca(marcaEditar.idMarca, form);
      } else {
        await crearMarca(form);
      }

      await fetchMarcas();
      setMarcaEditar(null);
      setOpenModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  // EDITAR
  const handleEditar = (marca) => {
    setMarcaEditar(marca);
    setOpenModal(true);
  };

  // ELIMINAR CLICK
  const handleEliminarClick = (marca) => {
    setMarcaAEliminar(marca);
    setAccionEstado("eliminar");
    setOpenConfirm(true);
  };

  const handleActivarClick = (marca) => {
    setMarcaAEliminar(marca);
    setAccionEstado("activar");
    setOpenConfirm(true);
  };

  const handleCambiarEstadoConfirmado = async () => {
    if (!marcaAEliminar) return;

    try {
      setLoadingDelete(true);

      if (accionEstado === "activar") {
        await actualizarMarca(marcaAEliminar.idMarca, {
          ...marcaAEliminar,
          activo: true,
        });
      } else {
        await eliminarMarca(marcaAEliminar.idMarca);
      }

      await fetchMarcas();

      setOpenConfirm(false);
      setMarcaAEliminar(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDelete(false);
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
              setMarcaEditar(null);
              setOpenModal(true);
            }}
            className="bg-(--color-pagina) text-(--color-blanco) px-5 py-2 rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            + Crear Marca
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

            <thead className="bg-(--color-gris-claro-2) text-(--color-gris-letra) font-medium">
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
                  <td
                    colSpan="5"
                    className="p-10 text-center text-gray-400"
                  >
                    Cargando marcas...
                  </td>
                </tr>
              ) : marcas.length > 0 ? (
                marcas.map((m, index) => (
                  <tr
                    key={`marca-${m.idMarca ?? "sin-id"}-${index}`}
                    className={`transition-colors ${
                      m.activo ? "hover:bg-gray-50" : "bg-gray-100/60 opacity-75 hover:bg-gray-100"
                    }`}
                  >
                    <td className="p-4 font-medium">
                      {m.idMarca}
                    </td>

                    <td className="p-4">
                      <span className={m.activo ? "" : "text-gray-400 line-through"}>{m.nombre}</span>
                    </td>

                    <td className="p-4 text-gray-500">
                      {m.descripcion || "Sin descripción"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${m.activo
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

                      {m.activo ? (
                        <button
                          onClick={() => handleEliminarClick(m)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                          title="Eliminar marca"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivarClick(m)}
                          className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors cursor-pointer"
                          title="Reactivar marca"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

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
      </div>

      <ModalCatalogoInventario
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setMarcaEditar(null);
        }}
        onSave={handleGuardar}
        data={marcaEditar}
        tituloNuevo="Nueva Marca"
        tituloEditar="Editar Marca"
      />

      <ModalConfirmacion
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleCambiarEstadoConfirmado}
        loading={loadingDelete}
        titulo={accionEstado === "activar" ? "Reactivar marca" : "Eliminar marca"}
        confirmLabel={accionEstado === "activar" ? "Reactivar" : "Eliminar"}
        loadingLabel={accionEstado === "activar" ? "Reactivando..." : "Eliminando..."}
        confirmClassName={accionEstado === "activar" ? "bg-green-600 hover:bg-green-700" : undefined}
        mensaje={
          accionEstado === "activar"
            ? `¿Seguro que quieres reactivar "${marcaAEliminar?.nombre}"?`
            : `¿Seguro que quieres eliminar "${marcaAEliminar?.nombre}"?`
        }
      />

    </div>
  );
};

export default GestionMarcas;
