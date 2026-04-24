import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

const GestionCategorias = () => {
  const [categorias, setCategorias] = useState([
    { id: 1, nombre: "Ropa", descripcion: "Productos textiles", estado: "Activo" },
    { id: 2, nombre: "Calzado", descripcion: "Zapatos y sandalias", estado: "Activo" },
  ]);

  const [openModal, setOpenModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const handleGuardar = (data) => {
    if (editando) {
      setCategorias(categorias.map(c =>
        c.id === editando.id ? { ...c, ...data } : c
      ));
    } else {
      setCategorias([
        ...categorias,
        { id: Date.now(), ...data }
      ]);
    }

    setOpenModal(false);
    setEditando(null);
  };

  const handleEditar = (categoria) => {
    setEditando(categoria);
    setOpenModal(true);
  };

  const handleEliminar = (id) => {
    setCategorias(categorias.filter(c => c.id !== id));
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold text-(--color-pagina)">
        Gestión de Categorías
      </h1>

      {/* BOTÓN DE REGRESAR */}
      <div className="flex justify-between items-center"></div>

      <button
        onClick={() => {
          setEditando(null);
          setOpenModal(true);
        }}
        className="bg-(--color-pagina) text-white px-5 py-2 rounded-xl"
      >
        + Crear Categoría
      </button>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {categorias.map((cat) => (
              <tr key={cat.id} className="border-t">

                <td className="p-3">{cat.id}</td>
                <td className="p-3">{cat.nombre}</td>
                <td className="p-3">{cat.descripcion}</td>
                <td className="p-3">{cat.estado}</td>

                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleEditar(cat)}
                    className="p-2 bg-gray-100 rounded-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleEliminar(cat.id)}
                    className="p-2 bg-red-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      <ModalCategoria
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleGuardar}
        data={editando}
      />

    </div>
  );
};

export default GestionCategorias;



const ModalCategoria = ({ open, onClose, onSave, data }) => {
  const [nombre, setNombre] = useState(data?.nombre || "");
  const [descripcion, setDescripcion] = useState(data?.descripcion || "");
  const [estado, setEstado] = useState(data?.estado || "Activo");

  if (!open) return null;

  const handleSave = () => {
    onSave({ nombre, descripcion, estado });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-md rounded-2xl p-6 border-t-4 border-(--color-pagina)">

        <h2 className="text-lg font-semibold mb-4">
          {data ? "Editar Categoría" : "Nueva Categoría"}
        </h2>

        <div className="space-y-4">

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="w-full border p-3 rounded-lg"
          />

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción"
            className="w-full border p-3 rounded-lg"
          />

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full border p-3 rounded-lg"
          >
            <option>Activo</option>
            <option>Inactivo</option>
          </select>

          <div className="flex justify-end gap-2 pt-4">

            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              className="bg-(--color-pagina) text-white px-4 py-2 rounded-lg"
            >
              Guardar
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};