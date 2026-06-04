import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Search, Loader2, X, CheckCircle, AlertCircle, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

// IMPORTAMOS TU CLIENTE CONFIGURADO
import { apiClient } from "@/lib/apiClient";

const Deudas = () => {
  const navigate = useNavigate();

  // ESTADOS PRINCIPALES
  const [deudas, setDeudas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  // SISTEMA DE TOAST
  const [notificacion, setNotificacion] = useState({ mostrar: false, tipo: "", mensaje: "" });

  // ESTADOS DEL MODAL (CREAR / EDITAR)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [idDeudaSeleccionada, setIdDeudaSeleccionada] = useState(null);
  const [guardando, setGuardando] = useState(false);
  
  // FORMULARIO ADAPTADO A LAS DEUDAS
  const [formDeuda, setFormDeuda] = useState({
    acreedor: "", // Cliente / Proveedor / Entidad
    descripcion: "",
    montoTotal: "",
    fechaVencimiento: new Date().toISOString().split('T')[0],
    estado: "Pendiente" // Pendiente / Cancelado
  });

  // FUNCIÓN PARA DISPARAR AVISOS FLOTANTES
  const mostrarAviso = (tipo, mensaje) => {
    setNotificacion({ mostrar: true, tipo, mensaje });
    if (tipo === "exito") {
      setTimeout(() => {
        setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
      }, 3000);
    }
  };

  // GET: CARGAR DEUDAS DESDE EL BACKEND
  const cargarDeudas = async () => {
    try {
      setCargando(true);
      const { data: res } = await apiClient.get("/api/Deudas", {
        params: { page: 1, pageSize: 200 }
      });
      
      if (res?.exito) {
        setDeudas(Array.isArray(res.data) ? res.data : res.data?.items || []);
      }
    } catch (error) {
      console.error("Error al cargar deudas:", error);
      mostrarAviso("error", "No se pudo conectar con el servidor para cargar las deudas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDeudas();
  }, []);

  // POST / PATCH: GUARDAR O ACTUALIZAR DEUDA
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (formularioInvalido()) return;

    try {
      setGuardando(true);
      const payload = {
        ...formDeuda,
        montoTotal: parseFloat(formDeuda.montoTotal)
      };
      
      if (modoEditar) {
        const { data } = await apiClient.patch(`/api/Deudas/${idDeudaSeleccionada}`, payload);
        if (data?.exito) {
          mostrarAviso("exito", "¡Compromiso financiero actualizado!");
          cerrarYLimpiarModal();
          await cargarDeudas();
        } else {
          mostrarAviso("error", data?.mensaje || "Error al actualizar registro");
        }
      } else {
        const { data } = await apiClient.post("/api/Deudas", payload);
        if (data?.exito) {
          mostrarAviso("exito", "¡Deuda / Saldo registrado correctamente!");
          cerrarYLimpiarModal();
          await cargarDeudas();
        } else {
          mostrarAviso("error", data?.mensaje || "Error al registrar la obligación");
        }
      }
    } catch (error) {
      console.error("Error en la operación de deudas:", error);
      mostrarAviso("error", "Error interno al procesar la solicitud.");
    } finally {
      setGuardando(false);
    }
  };

  // PREPARAR EDICIÓN
  const abrirEditar = (deuda) => {
    setIdDeudaSeleccionada(deuda.idDeuda || deuda.id);
    setFormDeuda({
      acreedor: deuda.acreedor || "",
      descripcion: deuda.descripcion || "",
      montoTotal: deuda.montoTotal || "",
      fechaVencimiento: deuda.fechaVencimiento ? deuda.fechaVencimiento.split('T')[0] : "",
      estado: deuda.estado || "Pendiente",
    });
    setModoEditar(true);
    setModalAbierto(true);
  };

  const cerrarYLimpiarModal = () => {
    setModalAbierto(false);
    setModoEditar(false);
    setIdDeudaSeleccionada(null);
    setFormDeuda({
      acreedor: "",
      descripcion: "",
      montoTotal: "",
      fechaVencimiento: new Date().toISOString().split('T')[0],
      estado: "Pendiente"
    });
  };

  // FILTRADO LOCAL POR ACREEDOR O CONCEPTO
  const deudasFiltradas = deudas.filter((d) =>
    d.acreedor?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formularioInvalido = () => {
    return !formDeuda.acreedor.trim() || !formDeuda.montoTotal || !formDeuda.fechaVencimiento;
  };

  return (
    <div className="p-6 space-y-6 relative bg-(--color-pagina-4) min-h-full w-full">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-(--color-pagina)">Deudas y Compromisos</h1>
          <p className="text-(--color-gris-letra) text-sm mt-1">
            Administra los saldos pendientes de cobro, cuentas corrientes y pasivos operativos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/contabilidad")}
          className="flex items-center gap-2 bg-(--color-pagina-2) text-(--color-blanco) px-4 py-2 rounded-xl hover:bg-(--color-esmeralda-hover) transition-colors cursor-pointer text-sm font-medium shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>
      </div>

      {/* ACCIONES DE BÚSQUEDA Y CREACIÓN */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-gris-claro)" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, proveedor o concepto..."
            className="w-full bg-(--color-blanco) border border-(--color-gris-claro-2) rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm text-(--color-negro)"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setModoEditar(false);
            setModalAbierto(true);
          }}
          className="flex items-center gap-2 bg-(--color-pagina) border border-(--color-borde-button) text-(--color-blanco) px-5 py-3 rounded-xl hover:bg-(--color-rosa-hover) hover:text-(--color-negro) transition-colors cursor-pointer text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Obligación
        </button>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-(--color-blanco) rounded-2xl shadow-md border border-(--color-gris-claro-2) overflow-hidden">
        {cargando ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-(--color-pagina)" />
            <p className="text-xs text-(--color-gris-claro) font-medium">Consultando deudas vigentes...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-(--color-pagina-3) text-(--color-gris-letra) uppercase text-[11px] tracking-wider font-bold border-b border-(--color-gris-claro-2)">
              <tr>
                <th className="p-4 text-left">Acreedor / Contacto</th>
                <th className="p-4 text-left">Descripción u Origen</th>
                <th className="p-4 text-left">Límite / Vencimiento</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-right">Saldo Original</th>
                <th className="p-4 text-center w-28">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-(--color-gris-claro-2)">
              {deudasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-(--color-gris-claro) font-medium">
                    No se registran obligaciones financieras pendientes.
                  </td>
                </tr>
              ) : (
                deudasFiltradas.map((deuda) => (
                  <tr key={deuda.idDeuda || deuda.id} className="hover:bg-(--color-pagina-4) transition-colors text-(--color-negro)">
                    <td className="p-4 font-semibold">
                      {deuda.acreedor}
                    </td>
                    <td className="p-4 max-w-xs truncate text-(--color-gris-letra) font-medium">
                      {deuda.descripcion || "---"}
                    </td>
                    <td className="p-4 whitespace-nowrap text-(--color-gris-letra) font-medium">
                      {deuda.fechaVencimiento ? deuda.fechaVencimiento.split('T')[0] : "---"}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        deuda.estado === "Cancelado" 
                          ? "bg-(--color-pagina-3) border-(--color-pos-scan-ok-borde) text-(--color-verde)" 
                          : "bg-(--color-blanco) border-(--color-rojo) text-(--color-rojo-obscuro)"
                      }`}>
                        {deuda.estado || "Pendiente"}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-(--color-rojo)">
                      Q {parseFloat(deuda.montoTotal || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEditar(deuda)}
                          className="p-2 text-(--color-celeste) hover:bg-(--color-pagina-3) rounded-lg transition-colors cursor-pointer"
                          title="Actualizar / Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: REGISTRAR / EDITAR DEUDA */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-(--color-negro)/40 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-(--color-blanco) w-full max-w-xl rounded-2xl shadow-lg flex flex-col max-h-[90vh] border-t-4 border-(--color-pagina) relative">
            
            {/* TOAST INTERNO */}
            {notificacion.mostrar && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all max-w-md w-11/12 animate-bounce ${
                notificacion.tipo === "exito" ? "bg-(--color-blanco) border-(--color-pos-scan-ok-borde) text-(--color-verde)" : "bg-(--color-blanco) border-(--color-rojo) text-(--color-rojo-obscuro)"
              }`}>
                {notificacion.tipo === "exito" ? <CheckCircle className="w-5 h-5 text-(--color-verde) shrink-0" /> : <AlertCircle className="w-5 h-5 text-(--color-rojo) shrink-0" />}
                <span className="flex-1">{notificacion.mensaje}</span>
                <button type="button" onClick={() => setNotificacion({ ...notificacion, mostrar: false })} className="text-(--color-gris-claro) hover:text-(--color-gris-letra) ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* CABECERA MODAL */}
            <div className="flex justify-between items-center p-6 border-b border-(--color-gris-claro-2)">
              <div className="w-9" />
              <h2 className="text-lg font-semibold text-(--color-negro)">
                {modoEditar ? "Gestionar Compromiso de Pago" : "Registrar Nueva Obligación"}
              </h2>
              <button type="button" onClick={cerrarYLimpiarModal} className="p-1.5 hover:bg-(--color-pagina-3) rounded-lg text-(--color-gris-letra)">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleGuardar} className="p-6 overflow-y-auto flex-1 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Cliente / Proveedor / Entidad *</label>
                  <input
                    type="text"
                    required
                    value={formDeuda.acreedor}
                    onChange={(e) => setFormDeuda({ ...formDeuda, acreedor: e.target.value })}
                    placeholder="Ej. Distribuidora Central S.A."
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Fecha de Vencimiento *</label>
                  <input
                    type="date"
                    value={formDeuda.fechaVencimiento}
                    onChange={(e) => setFormDeuda({ ...formDeuda, fechaVencimiento: e.target.value })}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Monto Total Adquirido *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-gris-claro) text-sm font-semibold">Q</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formDeuda.montoTotal}
                      onChange={(e) => setFormDeuda({ ...formDeuda, montoTotal: e.target.value })}
                      placeholder="0.00"
                      className="w-full border border-(--color-gris-claro-2) pl-8 pr-3 p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm font-semibold bg-(--color-blanco) text-(--color-negro)"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Estado del Saldo</label>
                  <select
                    value={formDeuda.estado}
                    onChange={(e) => setFormDeuda({ ...formDeuda, estado: e.target.value })}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-(--color-gris-letra) block">Descripción / Detalles de la Deuda</label>
                <textarea
                  rows="3"
                  value={formDeuda.descripcion}
                  onChange={(e) => setFormDeuda({ ...formDeuda, descripcion: e.target.value })}
                  placeholder="Ej. Saldo de mercadería por pagar según factura cambiaría No. 4410..."
                  className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm resize-none bg-(--color-blanco) text-(--color-negro)"
                />
              </div>

              {/* ACCIONES FORMULARIO */}
              <div className="flex justify-end gap-3 pt-4 border-t border-(--color-gris-claro-2) mt-4">
                <button
                  type="button"
                  onClick={cerrarYLimpiarModal}
                  className="border border-(--color-gris-claro-2) px-6 py-2.5 rounded-xl text-(--color-gris-letra) hover:bg-(--color-pagina-3) text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || formularioInvalido()}
                  className="bg-(--color-pagina) text-(--color-blanco) border border-(--color-borde-button) px-6 py-3 rounded-xl font-medium hover:bg-(--color-rosa-hover) hover:text-(--color-negro) transition-all text-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? "Guardando..." : modoEditar ? "Actualizar Registro" : "Guardar Obligación"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Deudas;