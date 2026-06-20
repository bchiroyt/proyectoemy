const Acciones = () => {
  return (
    <div className="flex flex-wrap gap-4">
      <button className="bg-(--color-pagina-2) hover:bg-(--color-borde-button) text-(--color-blanco) px-6 py-3 rounded-xl shadow-md transition w-full sm:w-auto">
        + Crear Nuevo Producto
      </button>

      <button className="bg-(--color-pagina-2) hover:bg-(--color-borde-button) text-(--color-blanco) px-6 py-3 rounded-xl shadow-md transition w-full sm:w-auto">
        Nueva Compra
      </button>
    </div>
  );
};

export default Acciones;