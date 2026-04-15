const Acciones = () => {
    return (
      <div className="flex flex-wrap gap-4">
        <button className="bg-pink-500 hover:bg-(--color-pagina) text-white px-6 py-3 rounded-xl shadow-md transition w-full sm:w-auto">
          + Crear Nuevo Producto
        </button>
  
        <button className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl shadow-md transition w-full sm:w-auto">
          Nueva Compra
        </button>
      </div>
    );
  };
  
  export default Acciones;