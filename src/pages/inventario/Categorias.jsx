import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ModalCategoria from "./components/ModalCategoria";

const Categorias = () => {
  const [categorias, setCategorias] = useState([
    { id: 1, nombre: "Ropa", descripcion: "Prendas de vestir", estado: "Activo" },
    { id: 2, nombre: "Calzado", descripcion: "Zapatos y tenis", estado: "Activo" },
  ]);

  const [openModal, setOpenModal] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState(null);

  const handleGuardar = (data) => {
    if (categoriaEditar) {
      setCategorias((prev) =>
        prev.map((c) =>
          c.id === categoriaEditar.id ? { ...data, id: c.id } : c
        )
      );
    } else {
      setCategorias([
        ...categorias,
        { ...data, id: Date.now() },
      ]);
    }

    setCategoriaEditar(null);
    setOpenModal(false);
  };

  const handleEditar = (cat) => {
    setCategoriaEditar(cat);
    setOpenModal(true);
  };

  const handleEliminar = (id) => {
    setCategorias(categorias.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6 space-y-6 bg-(--color-pagina-4) min-h-full">

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-(--color-pagina)">
          Gestión de Categorías
        </h1>

        <button
          onClick={() => {
            setCategoriaEditar(null);
            setOpenModal(true);
          }}
          className="bg-(--color-pagina) text-white px-5 py-2 rounded-xl"
        >
          + Crear Categoría
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow p-4">

        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {categorias.map((cat) => (
              <tr key={cat.id} className="border-t">

                <td>{cat.id}</td>
                <td>{cat.nombre}</td>
                <td>{cat.descripcion}</td>
                <td>{cat.estado}</td>

                <td className="flex gap-2 py-2">
                  <button
                    onClick={() => handleEditar(cat)}
                    className="p-2 bg-gray-100 rounded"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleEliminar(cat.id)}
                    className="p-2 bg-red-100 text-red-600 rounded"
                  >
                    <Trash2 size={16} />
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
        data={categoriaEditar}
      />

    </div>
  );
};

export default Categorias;