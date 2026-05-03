import { useState, useEffect } from "react";
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModalNuevaMarca from "./components/ModalNuevaMarca";
import ModalConfirmacion from "./components/ModalConfirmacion";
import { obtenerMarcas, eliminarMarca } from "@/services/marcas";

const GestionMarcas = () => {
  const navigate = useNavigate();

  const [marcas, setMarcas] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  // 🔥 EDITAR
  const [marcaEditar, setMarcaEditar] = useState(null);

  // 🔥 ELIMINAR
  const [openConfirm, setOpenConfirm] = useState(false);
  const [marcaAEliminar, setMarcaAEliminar] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // 🔥 CARGAR (Original)
  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const data = await obtenerMarcas();
        setMarcas(data || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMarcas();
  }, []);

  // 🔥 GUARDAR / ACTUALIZAR
  const handleGuardar = (marca) => {
    if (marcaEditar) {
      setMarcas((prev) =>
        prev.map((m) => (m.idMarca === marca.idMarca ? marca : m))
      );
    } else {
      setMarcas((prev) => [...prev, marca]);
    }

    setMarcaEditar(null);
    setOpenModal(false);
  };

  // 🔥 EDITAR CLICK
  const handleEditar = (marca) => {
    setMarcaEditar(marca);
    setOpenModal(true);
  };

  // 🔥 ELIMINAR CLICK
  const handleEliminarClick = (marca) => {
    setMarcaAEliminar(marca);
    setOpenConfirm(true);
  };

  // 🔥 ELIMINAR CONFIRMADO
  const handleEliminarConfirmado = async () => {
    if (!marcaAEliminar) return;

    try {
      setLoadingDelete(true);
      await eliminarMarca(marcaAEliminar.idMarca);

      setMarcas((prev) =>
        prev.filter((m) => m.idMarca !== marcaAEliminar.idMarca)
      );

      setOpenConfirm(false);
      setMarcaAEliminar(null);
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
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
          className="bg-(--color-pagina) text-white px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          + Crear Marca
        </button>

        {/* BOTÓN REGRESAR AÑADIDO Y CORREGIDO */}
        <button
          onClick={() => navigate("/inventario")}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 font-medium">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Descripción</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {marcas.length > 0 ? (
              marcas.map((m) => (
                <tr key={m.idMarca} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{m.idMarca}</td>
                  <td className="p-4">{m.nombre}</td>
                  <td className="p-4 text-gray-500">{m.descripcion || "Sin descripción"}</td>

                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEditar(m)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEliminarClick(m)}
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
                <td colSpan="4" className="p-10 text-center text-gray-400">
                  No hay marcas disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR / EDITAR */}
      <ModalNuevaMarca
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setMarcaEditar(null);
        }}
        onSave={handleGuardar}
        marcaEditar={marcaEditar}
      />

      {/* MODAL ELIMINAR */}
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