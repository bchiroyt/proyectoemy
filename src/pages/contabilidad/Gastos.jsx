import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Search, Loader2, X, CheckCircle, AlertCircle, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";

// IMPORTAMOS TU CLIENTE CONFIGURADO
import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { validateCrearGasto } from "@/lib/gastoValidations";

const obtenerCampo = (objeto, ...campos) => {
  if (!objeto || typeof objeto !== "object") return undefined;
  const campo = campos.find((nombre) => Object.prototype.hasOwnProperty.call(objeto, nombre));
  return campo ? objeto[campo] : undefined;
};

const normalizarCatalogo = (lista, camposId) => {
  if (!Array.isArray(lista)) return [];

  return lista
    .map((item) => ({
      id: obtenerCampo(item, ...camposId),
      nombre: obtenerCampo(item, "nombre", "Nombre", "descripcion", "Descripcion") || "",
    }))
    .filter((item) => item.id != null);
};

const CampoSkeleton = () => (
  <div className="space-y-2">
    <div className="h-3 w-28 rounded bg-(--color-gris-claro-2)" />
    <div className="h-11 w-full rounded-lg bg-(--color-pagina-3)" />
  </div>
);

const FormularioGastoSkeleton = () => (
  <div
    role="status"
    aria-label="Cargando datos del formulario"
    className="animate-pulse space-y-4"
  >
    <span className="sr-only">Cargando datos del formulario...</span>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <CampoSkeleton />
      <CampoSkeleton />
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <CampoSkeleton />
      <CampoSkeleton />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-40 rounded bg-(--color-gris-claro-2)" />
      <div className="h-20 w-full rounded-lg bg-(--color-pagina-3)" />
    </div>
    <div className="flex justify-end gap-3 border-t border-(--color-gris-claro-2) pt-4">
      <div className="h-10 w-24 rounded-xl bg-(--color-pagina-3)" />
      <div className="h-10 w-32 rounded-xl bg-(--color-gris-claro-2)" />
    </div>
  </div>
);

const Gastos = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((state) => state.setTitulo);

  // ESTADOS PRINCIPALES
  const [gastos, setGastos] = useState([]);
  const [tiposGasto, setTiposGasto] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoPreparacion, setCargandoPreparacion] = useState(false);
  const [errorPreparacion, setErrorPreparacion] = useState("");
  const [erroresCampos, setErroresCampos] = useState({});
  const [errorRegistro, setErrorRegistro] = useState("");

  // SISTEMA DE TOAST
  const [notificacion, setNotificacion] = useState({ mostrar: false, tipo: "", mensaje: "" });

  // ESTADOS DEL MODAL (CREAR / EDITAR)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [idGastoSeleccionado, setIdGastoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  
  // FORMULARIO ADAPTADO A TU BASE DE DATOS
  const [formGasto, setFormGasto] = useState({
    fecha: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    idTipoGasto: "",
    descripcion: "",
    monto: "",
    idMetodoPago: "",
    observaciones: "",
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

  // GET: CARGAR GASTOS DESDE EL BACKEND
  const cargarGastos = async () => {
    try {
      setCargando(true);
      const { data: respuestaBackend } = await apiClient.get("/api/Gastos", {
        params: { page: 1, pageSize: 200 }
      });
      
      if (respuestaBackend?.exito) {
        const contenido = respuestaBackend.data;
        const listaMapeada = Array.isArray(contenido) ? contenido : contenido?.items || [];
        setGastos(listaMapeada);
      }
    } catch (error) {
      console.error("Error al cargar gastos:", error);
      mostrarAviso("error", "No se pudo conectar con el servidor para cargar los gastos.");
    } finally {
      setCargando(false);
    }
  };

  // GET: CARGAR DATOS NECESARIOS AL ABRIR EL FORMULARIO
  const cargarPreparacionGasto = async () => {
    try {
      setCargandoPreparacion(true);
      setErrorPreparacion("");
      setTiposGasto([]);
      setMetodosPago([]);
      const { data: respuesta } = await apiClient.get("/api/gastos/preparacion");
      console.info("[Gastos] Datos de preparacion recibidos:", respuesta);
      if (obtenerCampo(respuesta, "exito", "Exito") === false) {
        throw new Error(obtenerCampo(respuesta, "mensaje", "Mensaje") || "No se pudo preparar el formulario.");
      }
      const preparacion = obtenerCampo(respuesta, "data", "Data") || respuesta;
      const tiposRecibidos = obtenerCampo(
        preparacion,
        "tiposGasto",
        "TiposGasto"
      );
      const metodosRecibidos = obtenerCampo(
        preparacion,
        "metodosPago",
        "MetodosPago",
        "metodosDePago",
        "MetodosDePago",
        "formasPago",
        "FormasPago"
      );

      setTiposGasto(normalizarCatalogo(tiposRecibidos, ["idTipoGasto", "IdTipoGasto", "id", "Id"]));
      setMetodosPago(normalizarCatalogo(metodosRecibidos, ["idMetodoPago", "IdMetodoPago", "id", "Id"]));
    } catch (error) {
      console.error("Error al preparar el formulario de gastos:", error);
      setErrorPreparacion(getApiErrorMessage(error, "No se pudieron cargar los datos del formulario."));
    } finally {
      setCargandoPreparacion(false);
    }
  };

  useEffect(() => {
    setTitulo("Contabilidad > gastos");
  }, [setTitulo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarGastos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actualizarCampo = (campo, valor) => {
    setFormGasto((actual) => ({ ...actual, [campo]: valor }));
    setErroresCampos((actuales) => {
      if (!actuales[campo]) return actuales;
      const siguientes = { ...actuales };
      delete siguientes[campo];
      return siguientes;
    });
    setErrorRegistro("");
  };

  // POST / PATCH: GUARDAR O ACTUALIZAR GASTO
  const handleGuardar = async (e) => {
    e.preventDefault();
    setErroresCampos({});
    setErrorRegistro("");

    const validacion = validateCrearGasto(formGasto);
    if (!validacion.success) {
      setErroresCampos(validacion.error.flatten().fieldErrors);
      setErrorRegistro("Complete correctamente los campos indicados antes de registrar el gasto.");
      return;
    }

    const gastoValidado = validacion.data;
    const erroresCatalogo = {};
    if (!tiposGasto.some((tipo) => Number(tipo.id) === gastoValidado.idTipoGasto)) {
      erroresCatalogo.idTipoGasto = ["Seleccione un tipo de gasto disponible"];
    }
    if (
      gastoValidado.idMetodoPago != null &&
      !metodosPago.some((metodo) => Number(metodo.id) === gastoValidado.idMetodoPago)
    ) {
      erroresCatalogo.idMetodoPago = ["Seleccione un método de pago disponible"];
    }
    if (Object.keys(erroresCatalogo).length > 0) {
      setErroresCampos(erroresCatalogo);
      setErrorRegistro("Los datos seleccionados no pertenecen a las opciones disponibles.");
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        idTipoGasto: gastoValidado.idTipoGasto,
        idMetodoPago: gastoValidado.idMetodoPago,
        descripcion: gastoValidado.descripcion,
        monto: gastoValidado.monto,
        fecha: gastoValidado.fecha,
        observaciones: gastoValidado.observaciones || null,
      };
      
      if (modoEditar) {
        const { data } = await apiClient.patch(`/api/Gastos/${idGastoSeleccionado}`, payload);
        if (data?.exito) {
          mostrarAviso("exito", "¡Gasto actualizado correctamente!");
          cerrarYLimpiarModal();
          await cargarGastos();
        } else {
          mostrarAviso("error", data?.mensaje || "Error al actualizar el gasto");
        }
      } else {
        const { data } = await apiClient.post("/api/gastos", payload);
        if (data?.exito) {
          mostrarAviso("exito", data.mensaje || "¡Gasto registrado exitosamente!");
          cerrarYLimpiarModal();
          await cargarGastos();
        } else {
          setErrorRegistro(data?.mensaje || "No se pudo registrar el gasto.");
        }
      }
    } catch (error) {
      console.error("Error en la operación del gasto:", error);
      setErrorRegistro(getApiErrorMessage(error, "No se pudo registrar el gasto. Verifique los datos e intente nuevamente."));
    } finally {
      setGuardando(false);
    }
  };

  const abrirNuevo = () => {
    setModoEditar(false);
    setIdGastoSeleccionado(null);
    setErrorPreparacion("");
    setErroresCampos({});
    setErrorRegistro("");
    setFormGasto({
      fecha: new Date().toISOString().split('T')[0],
      idTipoGasto: "",
      descripcion: "",
      monto: "",
      idMetodoPago: "",
      observaciones: "",
    });
    setModalAbierto(true);
    cargarPreparacionGasto();
  };

  // PREPARAR EDICIÓN
  const abrirEditar = (gasto) => {
    setIdGastoSeleccionado(gasto.idGasto || gasto.id);
    setFormGasto({
      fecha: gasto.fecha ? gasto.fecha.split('T')[0] : "",
      idTipoGasto: gasto.idTipoGasto || "",
      descripcion: gasto.descripcion || "",
      monto: gasto.monto || "",
      idMetodoPago: gasto.idMetodoPago || "",
      observaciones: gasto.observaciones || "",
    });
    setModoEditar(true);
    setModalAbierto(true);
    cargarPreparacionGasto();
  };

  const cerrarYLimpiarModal = () => {
    setModalAbierto(false);
    setModoEditar(false);
    setIdGastoSeleccionado(null);
    setErrorPreparacion("");
    setErroresCampos({});
    setErrorRegistro("");
    setFormGasto({
      fecha: new Date().toISOString().split('T')[0],
      idTipoGasto: "",
      descripcion: "",
      monto: "",
      idMetodoPago: "",
      observaciones: "",
    });
  };

  // FILTRADO LOCAL POR DESCRIPCIÓN
  const gastosFiltrados = gastos.filter((g) =>
    g.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 relative bg-(--color-pagina-4) min-h-full w-full">
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-(--color-gris-letra) text-sm mt-1">
            Visualiza, genera y gestiona los egresos operativos y compras de la empresa.
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
            placeholder="Buscar gasto por descripción..."
            className="w-full bg-(--color-blanco) border border-(--color-gris-claro-2) rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm text-(--color-negro)"
          />
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-(--color-pagina) border border-(--color-borde-button) text-(--color-blanco) px-5 py-3 rounded-xl hover:bg-(--color-rosa-hover) hover:text-(--color-negro) transition-colors cursor-pointer text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Gasto
        </button>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-(--color-blanco) rounded-2xl shadow-md border border-(--color-gris-claro-2) overflow-hidden">
        {cargando ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-(--color-pagina)" />
            <p className="text-xs text-(--color-gris-claro) font-medium">Consultando registros contables...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-(--color-pagina-3) text-(--color-gris-letra) uppercase text-[11px] tracking-wider font-bold border-b border-(--color-gris-claro-2)">
              <tr>
                <th className="p-4 text-left">Fecha</th>
                <th className="p-4 text-left">Tipo de gasto</th>
                <th className="p-4 text-left">Descripción</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-left">Método de Pago</th>
                <th className="p-4 text-center w-28">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-(--color-gris-claro-2)">
              {gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-(--color-gris-claro) font-medium">
                    No se encontraron gastos registrados en este periodo.
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map((gasto) => (
                  <tr key={gasto.idGasto || gasto.id} className="hover:bg-(--color-pagina-4) transition-colors text-(--color-negro)">
                    <td className="p-4 whitespace-nowrap text-(--color-gris-letra) font-medium">
                      {gasto.fecha ? gasto.fecha.split('T')[0] : "---"}
                    </td>
                    <td className="p-4">
                      <span className="bg-(--color-pagina-3) text-(--color-pagina) px-2.5 py-1 rounded-full text-xs font-semibold border border-(--color-gris-claro-2)">
                        {gasto.tipoGastoNombre || gasto.idTipoGasto || "General"}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate font-medium">
                      {gasto.descripcion}
                    </td>
                    <td className="p-4 text-right font-bold text-(--color-rojo)">
                      Q {parseFloat(gasto.monto || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-(--color-gris-letra)">
                      {gasto.metodoPagoNombre || "Sin método de pago"}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEditar(gasto)}
                          className="p-2 text-(--color-celeste) hover:bg-(--color-pagina-3) rounded-lg transition-colors cursor-pointer"
                          title="Editar Registro"
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

      {notificacion.mostrar && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium max-w-md w-11/12 ${
          notificacion.tipo === "exito"
            ? "bg-(--color-blanco) border-(--color-pos-scan-ok-borde) text-(--color-verde)"
            : "bg-(--color-blanco) border-(--color-rojo) text-(--color-rojo-obscuro)"
        }`}>
          {notificacion.tipo === "exito" ? (
            <CheckCircle className="w-5 h-5 text-(--color-verde) shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-(--color-rojo) shrink-0" />
          )}
          <span className="flex-1">{notificacion.mensaje}</span>
          <button
            type="button"
            onClick={() => setNotificacion((actual) => ({ ...actual, mostrar: false }))}
            className="text-(--color-gris-claro) hover:text-(--color-gris-letra) ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL: REGISTRAR / EDITAR GASTO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-(--color-negro)/40 flex items-center justify-center z-50 p-4 transition-all fallback-backdrop">
          <div className="bg-(--color-blanco) w-full max-w-xl rounded-2xl shadow-lg flex flex-col max-h-[90vh] border-t-4 border-(--color-pagina) relative">
            
            {/* CABECERA MODAL */}
            <div className="flex justify-between items-center p-6 border-b border-(--color-gris-claro-2)">
              <div className="w-9" />
              <h2 className="text-lg font-semibold text-(--color-negro)">
                {modoEditar ? "Modificar Registro de Gasto" : "Ingresar Nuevo Gasto"}
              </h2>
              <button 
                type="button" 
                onClick={cerrarYLimpiarModal} 
                className="p-1.5 hover:bg-(--color-pagina-3) rounded-lg text-(--color-gris-letra)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULARIO CONTABLE */}
            <form onSubmit={handleGuardar} className="p-6 overflow-y-auto flex-1 space-y-4">
              {cargandoPreparacion ? (
                <FormularioGastoSkeleton />
              ) : errorPreparacion ? (
                <div
                  role="alert"
                  className="space-y-4 rounded-xl border border-(--color-rojo)/30 bg-(--color-pagina-4) p-5 text-center"
                >
                  <AlertCircle className="mx-auto h-8 w-8 text-(--color-rojo)" />
                  <div className="space-y-1">
                    <p className="font-semibold text-(--color-rojo-obscuro)">
                      No se pudo cargar el formulario
                    </p>
                    <p className="text-sm text-(--color-gris-letra)">{errorPreparacion}</p>
                  </div>
                  <button
                    type="button"
                    onClick={cargarPreparacionGasto}
                    className="rounded-xl border border-(--color-borde-button) bg-(--color-pagina) px-5 py-2.5 text-sm font-medium text-(--color-blanco) transition-colors hover:bg-(--color-rosa-hover) hover:text-(--color-negro)"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
              {errorRegistro ? (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-(--color-rojo)/30 bg-(--color-pagina-4) p-3 text-sm text-(--color-rojo-obscuro)">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-(--color-rojo)" />
                  <span>{errorRegistro}</span>
                </div>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Fecha de Emisión *</label>
                  <input
                    type="date"
                    value={formGasto.fecha}
                    onChange={(e) => actualizarCampo("fecha", e.target.value)}
                    aria-invalid={Boolean(erroresCampos.fecha)}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  />
                  {erroresCampos.fecha?.[0] ? (
                    <p className="text-xs text-(--color-rojo)">{erroresCampos.fecha[0]}</p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Tipo de Gasto *</label>
                  <select
                    value={formGasto.idTipoGasto}
                    onChange={(e) => actualizarCampo("idTipoGasto", e.target.value)}
                    aria-invalid={Boolean(erroresCampos.idTipoGasto)}
                    disabled={cargandoPreparacion}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  >
                    <option value="">Seleccione un tipo de gasto</option>
                    {tiposGasto.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                  </select>
                  {erroresCampos.idTipoGasto?.[0] ? (
                    <p className="text-xs text-(--color-rojo)">{erroresCampos.idTipoGasto[0]}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Monto (Egresado) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-gris-claro) text-sm font-semibold">Q</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formGasto.monto}
                      onChange={(e) => actualizarCampo("monto", e.target.value)}
                      aria-invalid={Boolean(erroresCampos.monto)}
                      placeholder="0.00"
                      className="w-full border border-(--color-gris-claro-2) pl-8 pr-3 p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm font-semibold bg-(--color-blanco) text-(--color-negro)"
                    />
                  </div>
                  {erroresCampos.monto?.[0] ? (
                    <p className="text-xs text-(--color-rojo)">{erroresCampos.monto[0]}</p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Método de Pago</label>
                  <select
                    value={formGasto.idMetodoPago}
                    onChange={(e) => actualizarCampo("idMetodoPago", e.target.value)}
                    aria-invalid={Boolean(erroresCampos.idMetodoPago)}
                    disabled={cargandoPreparacion}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  >
                    <option value="">Seleccione un método de pago</option>
                    {metodosPago.map((metodo) => (
                      <option key={metodo.id} value={metodo.id}>{metodo.nombre}</option>
                    ))}
                  </select>
                  {erroresCampos.idMetodoPago?.[0] ? (
                    <p className="text-xs text-(--color-rojo)">{erroresCampos.idMetodoPago[0]}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-(--color-gris-letra) block">Descripción / Concepto *</label>
                <textarea
                  rows="3"
                  value={formGasto.descripcion}
                  onChange={(e) => actualizarCampo("descripcion", e.target.value)}
                  aria-invalid={Boolean(erroresCampos.descripcion)}
                  maxLength={255}
                  placeholder="Ej. Pago de factura de energía eléctrica correspondiente al mes..."
                  className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm resize-none bg-(--color-blanco) text-(--color-negro)"
                />
                {erroresCampos.descripcion?.[0] ? (
                  <p className="text-xs text-(--color-rojo)">{erroresCampos.descripcion[0]}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-(--color-gris-letra) block">Observaciones</label>
                <textarea
                  rows="2"
                  value={formGasto.observaciones}
                  onChange={(e) => actualizarCampo("observaciones", e.target.value)}
                  placeholder="Información adicional del gasto (opcional)..."
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
                  disabled={guardando || cargandoPreparacion || Boolean(errorPreparacion)}
                  className="bg-(--color-pagina) text-(--color-blanco) border border-(--color-borde-button) px-6 py-3 rounded-xl font-medium hover:bg-(--color-rosa-hover) hover:text-(--color-negro) transition-all text-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? "Guardando..." : modoEditar ? "Actualizar Gasto" : "Aplicar Gasto"}
                </button>
              </div>
                </>
              )}
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Gastos;
