import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Search, Phone, Mail, MapPin, Loader2, X, CheckCircle, AlertCircle, Pencil, Trash2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";

// IMPORTAMOS TU CLIENTE CONFIGURADO
import { apiClient } from "@/lib/apiClient";

const Proveedores = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((state) => state.setTitulo);

  // ESTADOS PRINCIPALES
  
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  // SISTEMA DE TOAST IDÉNTICO A MODALNUEVOPRODUCTO
  const [notificacion, setNotificacion] = useState({ mostrar: false, tipo: "", mensaje: "" });

  // ESTADOS DEL MODAL (CREAR / EDITAR)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [idProveedorSeleccionado, setIdProveedorSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  
  const [formProveedor, setFormProveedor] = useState({
    nombre: "",
    telefono: "",
    telefono2: "",
    correo: "",
    direccion: "",
  });

  // ESTADOS PARA EL SUB-MODAL DE CONFIRMACIÓN (ACTIVAR / DESACTIVAR)
  const [openConfirmarEstado, setOpenConfirmarEstado] = useState(false);
  const [procesandoEstado, setProcesandoEstado] = useState(false);
  const [nuevoEstadoAccion, setNuevoEstadoAccion] = useState(true); // true = Activar, false = Desactivar

  // FUNCIÓN IDÉNTICA PARA DISPARAR AVISOS
  const mostrarAviso = (tipo, mensaje) => {
    setNotificacion({ mostrar: true, tipo, mensaje });
    if (tipo === "exito") {
      setTimeout(() => {
        setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
      }, 3000);
    }
  };

  // GET: CARGAR PROVEEDORES
  const cargarProveedores = async () => {
    try {
      setCargando(true);
      
      // NOTA: Agregamos parámetros comunes (ej. todos: true, o activo: null) 
      // para que el backend sepa que queremos ver la lista completa sin filtrar.
      const { data: respuestaBackend } = await apiClient.get("/api/Proveedores", {
        params: { 
          page: 1, 
          pageSize: 200
        }
      });
      
      if (respuestaBackend?.exito) {
        const contenido = respuestaBackend.data;
        const listaMapeada = Array.isArray(contenido) ? contenido : contenido?.items || [];
        setProveedores(listaMapeada);
      }
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      mostrarAviso("error", "No se pudo conectar con el servidor para cargar los proveedores.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    setTitulo("Gestión de proveedores");
  }, [setTitulo]);

  // POST / PATCH: ENVIAR FORMULARIO (GUARDAR O ACTUALIZAR)
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (formularioInvalido()) return;

    try {
      setGuardando(true);
      
      if (modoEditar) {
        // PATCH /api/Proveedores/{idProveedor} -> ACTUALIZAR DATOS
        const { data } = await apiClient.patch(`/api/Proveedores/${idProveedorSeleccionado}`, formProveedor);
        
        if (data?.exito) {
          mostrarAviso("exito", "¡Proveedor actualizado exitosamente!");
          cerrarYLimpiarModal();
          await cargarProveedores();
        } else {
          mostrarAviso("error", data?.mensaje || "Error al actualizar el proveedor");
        }
      } else {
        // POST /api/Proveedores -> CREAR NUEVO
        const { data } = await apiClient.post("/api/Proveedores", formProveedor);
        
        if (data?.exito) {
          mostrarAviso("exito", "¡Proveedor registrado exitosamente!");
          cerrarYLimpiarModal();
          await cargarProveedores();
        } else {
          mostrarAviso("error", data?.mensaje || "Error al registrar el proveedor");
        }
      }
    } catch (error) {
      console.error("Error en la operación del proveedor:", error);
      mostrarAviso("error", "Error interno al procesar la solicitud.");
    } finally {
      setGuardando(false);
    }
  };

  // PATCH: CAMBIAR ESTADO (ACTIVAR O DESACTIVAR)
  const handleCambiarEstado = async () => {
    try {
      setProcesandoEstado(true);
      
      const { data } = await apiClient.patch(`/api/Proveedores/${idProveedorSeleccionado}`, {
        estado: nuevoEstadoAccion
      });

      if (data?.exito) {
        const mensajeToast = nuevoEstadoAccion 
          ? "¡Proveedor activado exitosamente!" 
          : "¡Proveedor desactivado correctamente!";
        
        mostrarAviso("exito", mensajeToast);
        setOpenConfirmarEstado(false);
        setIdProveedorSeleccionado(null);
        
        // Volvemos a traer los datos actualizados del servidor
        await cargarProveedores();
      } else {
        mostrarAviso("error", data?.mensaje || "Error al cambiar el estado del proveedor");
      }
    } catch (error) {
      console.error("Error al cambiar estado del proveedor:", error);
      mostrarAviso("error", "Error interno al intentar modificar el estado.");
    } finally {
      setProcesandoEstado(false);
    }
  };

  // PREPARAR EDICIÓN
  const abrirEditar = (proveedor) => {
    const id = proveedor.idProveedor || proveedor.id;
    setIdProveedorSeleccionado(id);
    setFormProveedor({
      nombre: proveedor.nombre || "",
      telefono: proveedor.telefono || "",
      telefono2: proveedor.telefono2 || "",
      correo: proveedor.correo || "",
      direccion: proveedor.direccion || "",
    });
    setModoEditar(true);
    setModalAbierto(true);
  };

  // PREPARAR CAMBIO DE ESTADO
  const abrirConfirmarEstado = (proveedor, haciaEstado) => {
    const id = proveedor.idProveedor || proveedor.id;
    setIdProveedorSeleccionado(id);
    setNuevoEstadoAccion(haciaEstado);
    setOpenConfirmarEstado(true);
  };

  const cerrarYLimpiarModal = () => {
    setModalAbierto(false);
    setModoEditar(false);
    setIdProveedorSeleccionado(null);
    setFormProveedor({ nombre: "", telefono: "", telefono2: "", correo: "", direccion: "" });
  };

  // CORRECCIÓN AQUÍ: Ya no excluimos basándonos en 'p.estado !== false'.
  // Ahora el filtro permite mostrar tanto activos como inactivos que coincidan con la caja de búsqueda.
  const proveedoresFiltrados = proveedores.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formularioInvalido = () => {
    return !formProveedor.nombre.trim();
  };

  return (
    <div className="p-6 space-y-6 relative">

      {/* ACCIONES */}
      <div className="flex justify-between items-center gap-4">
      <button
          type="button"
          onClick={() => {
            setModoEditar(false);
            setModalAbierto(true);
          }}
          className="flex items-center gap-2 bg-(--color-pagina) text-(--color-blanco) px-5 py-3 rounded-xl hover:bg-(--color-pagina) transition-colors cursor-pointer text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo proveedor
        </button>

        <div className="relative w-full max-w-md">
          <BuscadorPrincipal />
        </div>

        <button
          type="button"
          onClick={() => navigate("/inventario")}
          className="flex items-center gap-2 bg-(--color-pagina-2) text-(--color-blanco) px-4 py-2 rounded-xl hover:bg-(--color-pagina) transition-colors cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>


        
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-green-600" />
            <p className="text-xs text-gray-400 font-medium">Consultando proveedores con el servidor...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-bold">
              <tr>
                <th className="p-4 text-left">Proveedor</th>
                <th className="p-4 text-left">Teléfonos</th>
                <th className="p-4 text-left">Correo Electrónico</th>
                <th className="p-4 text-left">Dirección</th>
                <th className="p-4 text-center w-28">Estado</th>
                <th className="p-4 text-center w-28">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400 font-medium">
                    No se encontraron proveedores registrados.
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((proveedor) => {
                  const esActivo = proveedor.estado !== false;
                  return (
                    <tr
                      key={proveedor.idProveedor || proveedor.id}
                      className={`transition-colors text-gray-700 ${
                        esActivo ? "hover:bg-gray-50/50" : "bg-gray-100/50 opacity-65 hover:bg-gray-100/80"
                      }`}
                    >
                      {/* Nombre con tachado condicional si está inactivo */}
                      <td className={`p-4 font-semibold ${esActivo ? "text-gray-800" : "text-gray-400 line-through"}`}>
                        {proveedor.nombre}
                      </td>

                      <td className="p-4 text-xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{proveedor.telefono || "---"}</span>
                          </div>
                          {proveedor.telefono2 && (
                            <div className="flex items-center gap-1.5 text-gray-400 pl-5">
                              <span>{proveedor.telefono2}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {proveedor.correo ? (
                          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span>{proveedor.correo}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">---</span>
                        )}
                      </td>

                      <td className="p-4 max-w-xs truncate">
                        {proveedor.direccion ? (
                          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{proveedor.direccion}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">---</span>
                        )}
                      </td>

                      {/* ESTADO VISUAL */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          esActivo 
                            ? "bg-green-50 text-green-700 border border-green-200" 
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {esActivo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* ACCIONES */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditar(proveedor)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Proveedor"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          
                          {esActivo ? (
                            <button
                              type="button"
                              onClick={() => abrirConfirmarEstado(proveedor, false)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Desactivar Proveedor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => abrirConfirmarEstado(proveedor, true)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                              title="Activar Proveedor"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL PRINCIPAL: NUEVO / EDITAR PROVEEDOR */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-lg flex flex-col max-h-[90vh] border-t-4 border-(--color-pagina) relative">
            
            {/* TOAST FLOTANTE SUPERIOR */}
            {notificacion.mostrar && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all max-w-md w-11/12 animate-bounce ${
                notificacion.tipo === "exito" 
                  ? "bg-green-50 border-green-200 text-green-800" 
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
                {notificacion.tipo === "exito" ? (
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span className="flex-1">{notificacion.mensaje}</span>
                <button 
                  type="button"
                  onClick={() => setNotificacion({ mostrar: false, tipo: "", mensaje: "" })} 
                  className="text-gray-400 hover:text-gray-600 ml-2 p-0.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* CABECERA */}
            <div className="flex justify-between items-center p-6 border-b">
              <div className="w-9" />
              <h2 className="text-lg font-semibold text-gray-800">
                {modoEditar ? "Modificar Proveedor" : "Registrar Nuevo Proveedor"}
              </h2>
              <button 
                type="button"
                onClick={cerrarYLimpiarModal} 
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800 cursor-pointer group"
              >
                <X className="group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleGuardar} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 block">Nombre Comercial *</label>
                <input
                  type="text"
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                  placeholder="Ej. Distribuidora del Norte"
                  className="w-full border p-3 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 block">Teléfono Principal</label>
                  <input
                    type="text"
                    value={formProveedor.telefono}
                    onChange={(e) => setFormProveedor({ ...formProveedor, telefono: e.target.value })}
                    placeholder="5555-5555"
                    className="w-full border p-3 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 block">Teléfono Secundario</label>
                  <input
                    type="text"
                    value={formProveedor.telefono2}
                    onChange={(e) => setFormProveedor({ ...formProveedor, telefono2: e.target.value })}
                    placeholder="2222-2222"
                    className="w-full border p-3 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 block">Correo Electrónico</label>
                <input
                  type="email"
                  value={formProveedor.correo}
                  onChange={(e) => setFormProveedor({ ...formProveedor, correo: e.target.value })}
                  placeholder="proveedor@empresa.com"
                  className="w-full border p-3 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 block">Dirección Física</label>
                <textarea
                  rows="2"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
                  placeholder="Calle principal, zona 10..."
                  className="w-full border p-3 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors text-sm resize-none min-h-[80px]"
                />
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={cerrarYLimpiarModal}
                  className="border px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-all cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || formularioInvalido()}
                  className="bg-(--color-pagina-2) text-white px-6 py-3 rounded-xl font-medium hover:brightness-90 active:scale-95 transition-all shadow-sm text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 flex items-center gap-2"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? "Guardando..." : modoEditar ? "Actualizar" : "Registrar"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* SUB-MODAL DE CONFIRMACIÓN DE CAMBIO DE ESTADO (ACTIVAR O DESACTIVAR) */}
      {openConfirmarEstado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className={`bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col border-t-4 p-6 space-y-4 ${
            nuevoEstadoAccion ? "border-green-500" : "border-red-500"
          }`}>
            <div className={`mx-auto p-3 rounded-full w-fit ${nuevoEstadoAccion ? "bg-green-50" : "bg-red-50"}`}>
              <AlertCircle className={`w-6 h-6 ${nuevoEstadoAccion ? "text-green-600" : "text-red-600"}`} />
            </div>
            
            <h4 className="text-md font-semibold text-gray-800 text-center">
              {nuevoEstadoAccion ? "¿Activar este proveedor?" : "¿Desactivar este proveedor?"}
            </h4>
            
            <p className="text-sm text-gray-500 text-center">
              {nuevoEstadoAccion 
                ? "El proveedor volverá a estar disponible en las listas de selección y en todo el sistema."
                : "El proveedor será marcado como inactivo en el catálogo, resguardando todo su historial existente."}
            </p>
            
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleCambiarEstado}
                disabled={procesandoEstado}
                className={`w-full text-white py-2.5 rounded-xl font-medium active:scale-[0.99] transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${
                  nuevoEstadoAccion ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {procesandoEstado && <Loader2 className="w-4 h-4 animate-spin" />}
                {nuevoEstadoAccion ? "Sí, Activar" : "Sí, Desactivar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenConfirmarEstado(false);
                  setIdProveedorSeleccionado(null);
                }}
                disabled={procesandoEstado}
                className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Proveedores;