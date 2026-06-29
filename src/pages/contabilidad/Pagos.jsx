import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, Loader2, X, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { obtenerFechaGuatemala, validateCrearDeudaAbono } from "@/lib/deudaAbonoValidations";
import { Skeleton } from "@/components/ui/skeleton";
import Paginacion from "@/components/shared/Paginacion";

const PAGE_SIZE = 15;

const formatoMoneda = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

const formatearMoneda = (valor) => formatoMoneda.format(Number(valor) || 0);
const formatearFecha = (valor) => (valor ? String(valor).split("T")[0] : "---");
const obtenerObservacionesAbono = (abono) =>
  abono?.observaciones ??
  abono?.Observaciones ??
  abono?.observacion ??
  abono?.Observacion ??
  "";

const estadoInicialAbono = {
  fechaAbono: obtenerFechaGuatemala(),
  idMetodoPago: "",
  monto: "",
  observaciones: "",
};

const Pagos = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((state) => state.setTitulo);

  const [deudas, setDeudas] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");

  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [deudaHistorial, setDeudaHistorial] = useState(null);
  const [abonosHistorial, setAbonosHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");

  const [modalAbonoAbierto, setModalAbonoAbierto] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null);
  const [formAbono, setFormAbono] = useState(estadoInicialAbono);
  const [fieldErrors, setFieldErrors] = useState({});
  const [localError, setLocalError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [notificacion, setNotificacion] = useState({ mostrar: false, tipo: "", mensaje: "" });

  const mostrarAviso = (tipo, mensaje) => {
    setNotificacion({ mostrar: true, tipo, mensaje });
    if (tipo === "exito") {
      setTimeout(() => {
        setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
      }, 3000);
    }
  };

  const cargarPreparacion = async () => {
    try {
      setCargando(true);
      setErrorCarga("");
      const { data: res } = await apiClient.get("/api/deudas/abonos/preparacion");

      if (!res?.exito) {
        throw new Error(res?.mensaje || "No se pudieron cargar las deudas disponibles.");
      }

      setDeudas(Array.isArray(res.data?.deudas) ? res.data.deudas : []);
      setMetodosPago(Array.isArray(res.data?.metodosPago) ? res.data.metodosPago : []);
    } catch (error) {
      console.error("Error al cargar preparacion de abonos:", error);
      setDeudas([]);
      setMetodosPago([]);
      setErrorCarga(getApiErrorMessage(error, "No se pudieron cargar las deudas disponibles."));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setTitulo("Contabilidad > pagos");
  }, [setTitulo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPreparacion();
  }, []);

  const cargarHistorialAbonos = async (deuda) => {
    try {
      setModalHistorialAbierto(true);
      setCargandoHistorial(true);
      setErrorHistorial("");
      setDeudaHistorial(deuda);
      setAbonosHistorial([]);

      const { data: res } = await apiClient.get(`/api/deudas/${deuda.idDeuda}/abonos`);
      if (!res?.exito) {
        throw new Error(res?.mensaje || "No se pudo cargar el historial de abonos.");
      }

      setDeudaHistorial(res.data?.deuda || deuda);
      setAbonosHistorial(Array.isArray(res.data?.abonos) ? res.data.abonos : []);
    } catch (error) {
      console.error("Error al cargar historial de abonos:", error);
      setErrorHistorial(getApiErrorMessage(error, "No se pudo cargar el historial de abonos."));
    } finally {
      setCargandoHistorial(false);
    }
  };

  const cerrarHistorial = () => {
    setModalHistorialAbierto(false);
    setDeudaHistorial(null);
    setAbonosHistorial([]);
    setErrorHistorial("");
  };

  const abrirRegistrarAbono = (deuda) => {
    const metodoEfectivo = metodosPago.find((metodo) =>
      String(metodo.nombre ?? "").trim().toLowerCase() === "efectivo"
    );
    const metodoPorDefecto = metodoEfectivo?.idMetodoPago ?? metodosPago[0]?.idMetodoPago;
    setDeudaSeleccionada(deuda);
    setFormAbono({
      ...estadoInicialAbono,
      fechaAbono: obtenerFechaGuatemala(),
      idMetodoPago: metodoPorDefecto ? String(metodoPorDefecto) : "",
    });
    setFieldErrors({});
    setLocalError("");
    setModalAbonoAbierto(true);
  };

  const cerrarAbono = () => {
    setModalAbonoAbierto(false);
    setDeudaSeleccionada(null);
    setFormAbono(estadoInicialAbono);
    setFieldErrors({});
    setLocalError("");
  };

  const actualizarCampoAbono = (campo, valor) => {
    setFormAbono((actual) => ({ ...actual, [campo]: valor }));
    setFieldErrors((actuales) => {
      if (!actuales[campo]) return actuales;
      const siguientes = { ...actuales };
      delete siguientes[campo];
      return siguientes;
    });
    setLocalError("");
  };

  const registrarAbono = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setLocalError("");

    const parsed = validateCrearDeudaAbono({
      idDeuda: deudaSeleccionada?.idDeuda,
      idMetodoPago: formAbono.idMetodoPago,
      fechaAbono: formAbono.fechaAbono,
      monto: formAbono.monto,
      observaciones: formAbono.observaciones,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      setLocalError("Complete correctamente los campos indicados antes de registrar el abono.");
      return;
    }

    const abono = parsed.data;
    const erroresCatalogo = {};

    if (!metodosPago.some((metodo) => Number(metodo.idMetodoPago) === abono.idMetodoPago)) {
      erroresCatalogo.idMetodoPago = ["Seleccione un metodo de pago disponible"];
    }

    const montoPendiente = Number(deudaSeleccionada?.montoPendiente ?? deudaSeleccionada?.saldoRestante ?? 0);
    if (Number.isFinite(montoPendiente) && montoPendiente > 0 && abono.monto > montoPendiente) {
      erroresCatalogo.monto = [`El monto no puede superar el saldo pendiente (${formatearMoneda(montoPendiente)})`];
    }

    const fechaOperacion = deudaSeleccionada?.fechaOperacion || deudaSeleccionada?.fechaInicio;
    if (fechaOperacion && abono.fechaAbono < formatearFecha(fechaOperacion)) {
      erroresCatalogo.fechaAbono = ["La fecha del abono no puede ser anterior a la deuda"];
    }

    if (Object.keys(erroresCatalogo).length > 0) {
      setFieldErrors(erroresCatalogo);
      setLocalError("Los datos seleccionados no son validos para esta deuda.");
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        idMetodoPago: abono.idMetodoPago,
        fechaAbono: abono.fechaAbono,
        monto: abono.monto,
        observaciones: abono.observaciones || null,
      };

      const { data } = await apiClient.post(`/api/deudas/${abono.idDeuda}/abonos`, payload);
      if (!data?.exito) {
        setLocalError(data?.mensaje || "No se pudo registrar el abono.");
        return;
      }

      mostrarAviso("exito", data.mensaje || "Abono registrado correctamente.");
      cerrarAbono();
      await cargarPreparacion();
    } catch (error) {
      console.error("Error al registrar abono:", error);
      setLocalError(getApiErrorMessage(error, "No se pudo registrar el abono. Verifique los datos e intente nuevamente."));
    } finally {
      setGuardando(false);
    }
  };

  const deudasFiltradas = useMemo(() => {
    const terminoBusqueda = busqueda.trim().toLowerCase();
    if (!terminoBusqueda) return deudas;

    return deudas.filter((deuda) =>
      [
        deuda.idDeuda,
        deuda.numeroDeuda,
        deuda.nombreAcreedor,
        deuda.tipo,
        deuda.fechaOperacion,
        deuda.fechaVencimiento,
        deuda.estado,
        deuda.montoPendiente,
      ].some((valor) => String(valor ?? "").toLowerCase().includes(terminoBusqueda))
    );
  }, [deudas, busqueda]);

  const totalRegistros = deudasFiltradas.length;
  const totalPages = Math.max(1, Math.ceil(totalRegistros / PAGE_SIZE));
  const paginaActual = Math.min(page, totalPages);
  const from = totalRegistros === 0 ? 0 : (paginaActual - 1) * PAGE_SIZE + 1;
  const to = Math.min(from + PAGE_SIZE - 1, totalRegistros);
  const deudasPagina = deudasFiltradas.slice(from === 0 ? 0 : from - 1, to);

  return (
    <div className="p-6 space-y-6 relative bg-(--color-pagina-4) min-h-full w-full">
      <div className="flex justify-between items-center">
        <p className="text-(--color-gris-letra) text-sm mt-1">
          Consulta las deudas disponibles para registrar abonos y sus metodos de pago.
        </p>

        <button
          type="button"
          onClick={() => navigate("/contabilidad")}
          className="flex items-center gap-2 bg-(--color-pagina-2) text-(--color-blanco) px-4 py-2 rounded-xl hover:bg-(--color-esmeralda-hover) transition-colors cursor-pointer text-sm font-medium shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-gris-claro)" />
          <input
            value={busqueda}
            onChange={(event) => {
              setBusqueda(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por acreedor, tipo, estado o deuda..."
            className="w-full bg-(--color-blanco) border border-(--color-gris-claro-2) rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm text-(--color-negro)"
          />
        </div>

        <Paginacion
          from={from}
          to={to}
          total={totalRegistros}
          onPrev={() => setPage(Math.max(1, paginaActual - 1))}
          onNext={() => setPage(Math.min(totalPages, paginaActual + 1))}
          disablePrev={paginaActual <= 1}
          disableNext={paginaActual >= totalPages}
          isLoading={cargando}
        />
      </div>

      {!cargando && !errorCarga ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-(--color-gris-claro-2) bg-(--color-blanco) p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-(--color-gris-letra)">Deudas disponibles</p>
            <p className="mt-1 text-lg font-bold text-(--color-negro)">{deudas.length}</p>
          </div>
          <div className="rounded-2xl border border-(--color-gris-claro-2) bg-(--color-blanco) p-4 shadow-sm md:col-span-2">
            <p className="text-xs font-semibold uppercase text-(--color-gris-letra)">Metodos de pago</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {metodosPago.length === 0 ? (
                <span className="text-sm text-(--color-gris-letra)">Sin metodos disponibles</span>
              ) : (
                metodosPago.map((metodo) => (
                  <span
                    key={metodo.idMetodoPago}
                    className="rounded-full border border-(--color-gris-claro-2) bg-(--color-pagina-3) px-3 py-1 text-xs font-semibold text-(--color-pagina)"
                  >
                    {metodo.nombre}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-(--color-blanco) rounded-2xl shadow-md border border-(--color-gris-claro-2) overflow-x-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-(--color-pagina-3) text-(--color-gris-letra) uppercase text-[11px] tracking-wider font-bold border-b border-(--color-gris-claro-2)">
            <tr>
              <th className="p-4 text-left">ID deuda</th>
              <th className="p-4 text-left">No. deuda</th>
              <th className="p-4 text-left">Acreedor</th>
              <th className="p-4 text-left">Tipo</th>
              <th className="p-4 text-left">Fecha operacion</th>
              <th className="p-4 text-left">Fecha vencimiento</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-right">Monto pendiente</th>
              <th className="p-4 text-center">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-gris-claro-2)">
            {cargando ? (
              Array.from({ length: 6 }).map((_, fila) => (
                <tr key={`pago-skeleton-${fila}`}>
                  {Array.from({ length: 9 }).map((__, columna) => (
                    <td key={`pago-skeleton-${fila}-${columna}`} className="p-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : errorCarga ? (
              <tr>
                <td colSpan="9" className="p-10 text-center">
                  <div className="mx-auto flex max-w-lg flex-col items-center gap-3 text-(--color-rojo-obscuro)">
                    <AlertCircle className="h-7 w-7 text-(--color-rojo)" />
                    <p className="text-sm">{errorCarga}</p>
                    <button
                      type="button"
                      onClick={cargarPreparacion}
                      className="rounded-xl border border-(--color-borde-button) bg-(--color-pagina) px-4 py-2 text-sm font-medium text-(--color-blanco) hover:bg-(--color-rosa-hover) hover:text-(--color-negro)"
                    >
                      Reintentar
                    </button>
                  </div>
                </td>
              </tr>
            ) : deudasPagina.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-12 text-center text-(--color-gris-claro) font-medium">
                  No hay deudas disponibles para abonar.
                </td>
              </tr>
            ) : (
              deudasPagina.map((deuda) => (
                <tr key={deuda.idDeuda} className="hover:bg-(--color-pagina-4) transition-colors text-(--color-negro)">
                  <td className="p-4 font-semibold">#{deuda.idDeuda}</td>
                  <td className="p-4 font-semibold text-(--color-gris-letra)">{deuda.numeroDeuda ?? "---"}</td>
                  <td className="p-4 font-medium">{deuda.nombreAcreedor || "---"}</td>
                  <td className="p-4 text-(--color-gris-letra) font-medium">{deuda.tipo || "---"}</td>
                  <td className="p-4 whitespace-nowrap text-(--color-gris-letra) font-medium">
                    {formatearFecha(deuda.fechaOperacion)}
                  </td>
                  <td className="p-4 whitespace-nowrap text-(--color-gris-letra) font-medium">
                    {formatearFecha(deuda.fechaVencimiento)}
                  </td>
                  <td className="p-4 text-center">
                    <span className="rounded-full border border-(--color-gris-claro-2) bg-(--color-pagina-3) px-2.5 py-1 text-xs font-semibold text-(--color-pagina)">
                      {deuda.estado || "---"}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-(--color-verde)">
                    {formatearMoneda(deuda.montoPendiente)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => cargarHistorialAbonos(deuda)}
                        className="rounded-lg p-2 text-(--color-celeste) transition-colors hover:bg-(--color-pagina-3)"
                        title="Ver historial de abonos"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirRegistrarAbono(deuda)}
                        className="rounded-lg p-2 text-(--color-pagina) transition-colors hover:bg-(--color-pagina-3)"
                        title="Registrar abono"
                        aria-label="Registrar abono"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

      {modalHistorialAbierto && (
        <div className="fixed inset-0 bg-(--color-negro)/40 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-(--color-blanco) w-full max-w-6xl rounded-2xl shadow-lg flex flex-col max-h-[90vh] border-t-4 border-(--color-pagina)">
            <div className="flex items-center justify-between border-b border-(--color-gris-claro-2) p-6">
              <div>
                <h2 className="text-lg font-semibold text-(--color-negro)">Historial de abonos</h2>
                <p className="mt-1 text-sm text-(--color-gris-letra)">
                  Deuda #{deudaHistorial?.numeroDeuda ?? deudaHistorial?.idDeuda ?? "---"} - {deudaHistorial?.nombreAcreedor || "---"}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarHistorial}
                className="p-1.5 hover:bg-(--color-pagina-3) rounded-lg text-(--color-gris-letra)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-6">
              {deudaHistorial ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-4) p-4">
                    <p className="text-xs font-semibold uppercase text-(--color-gris-letra)">Monto total</p>
                    <p className="mt-1 text-base font-bold text-(--color-negro)">{formatearMoneda(deudaHistorial.montoTotal)}</p>
                  </div>
                  <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-4) p-4">
                    <p className="text-xs font-semibold uppercase text-(--color-gris-letra)">Total abonado</p>
                    <p className="mt-1 text-base font-bold text-(--color-verde)">{formatearMoneda(deudaHistorial.totalAbonado)}</p>
                  </div>
                  <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-4) p-4">
                    <p className="text-xs font-semibold uppercase text-(--color-gris-letra)">Saldo restante</p>
                    <p className="mt-1 text-base font-bold text-(--color-rojo)">
                      {formatearMoneda(deudaHistorial.saldoRestante ?? deudaHistorial.montoPendiente)}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-2xl border border-(--color-gris-claro-2)">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-(--color-pagina-3) text-(--color-gris-letra) uppercase text-[11px] tracking-wider font-bold">
                    <tr>
                      <th className="p-4 text-left">No. abono</th>
                      <th className="p-4 text-left">Fecha abono</th>
                      <th className="p-4 text-left">Metodo pago</th>
                      <th className="p-4 text-left">Observaciones</th>
                      <th className="p-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--color-gris-claro-2)">
                    {cargandoHistorial ? (
                      Array.from({ length: 4 }).map((_, fila) => (
                        <tr key={`historial-skeleton-${fila}`}>
                          {Array.from({ length: 5 }).map((__, columna) => (
                            <td key={`historial-skeleton-${fila}-${columna}`} className="p-4">
                              <Skeleton className="h-4 w-full" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : errorHistorial ? (
                      <tr>
                        <td colSpan="5" className="p-10 text-center">
                          <div className="mx-auto flex max-w-lg flex-col items-center gap-3 text-(--color-rojo-obscuro)">
                            <AlertCircle className="h-7 w-7 text-(--color-rojo)" />
                            <p className="text-sm">{errorHistorial}</p>
                            {deudaHistorial?.idDeuda ? (
                              <button
                                type="button"
                                onClick={() => cargarHistorialAbonos(deudaHistorial)}
                                className="rounded-xl border border-(--color-borde-button) bg-(--color-pagina) px-4 py-2 text-sm font-medium text-(--color-blanco) hover:bg-(--color-rosa-hover) hover:text-(--color-negro)"
                              >
                                Reintentar
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : abonosHistorial.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-10 text-center text-(--color-gris-claro) font-medium">
                          Esta deuda no tiene abonos registrados.
                        </td>
                      </tr>
                    ) : (
                      abonosHistorial.map((abono) => {
                        const observaciones = obtenerObservacionesAbono(abono);
                        return (
                          <tr key={abono.idDeudaAbono} className="text-(--color-negro)">
                            <td className="p-4 font-semibold">#{abono.idDeudaAbono}</td>
                            <td className="p-4 text-(--color-gris-letra) font-medium">{formatearFecha(abono.fechaAbono)}</td>
                            <td className="p-4">
                              <span className="rounded-full border border-(--color-gris-claro-2) bg-(--color-pagina-3) px-2.5 py-1 text-xs font-semibold text-(--color-pagina)">
                                {abono.metodoPago || "---"}
                              </span>
                            </td>
                            <td className="max-w-[18rem] p-4 text-(--color-gris-letra)">
                              <span className="line-clamp-2" title={observaciones || "Sin observaciones"}>
                                {observaciones || "---"}
                              </span>
                            </td>
                            <td className="p-4 text-right font-bold text-(--color-verde)">{formatearMoneda(abono.monto)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalAbonoAbierto && (
        <div className="fixed inset-0 bg-(--color-negro)/40 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-(--color-blanco) w-full max-w-xl rounded-2xl shadow-lg flex flex-col max-h-[90vh] border-t-4 border-(--color-pagina) relative">
            <div className="flex justify-between items-center p-6 border-b border-(--color-gris-claro-2)">
              <div className="w-9" />
              <h2 className="text-lg font-semibold text-(--color-negro)">Registrar abono</h2>
              <button type="button" onClick={cerrarAbono} className="p-1.5 hover:bg-(--color-pagina-3) rounded-lg text-(--color-gris-letra)">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={registrarAbono} className="p-6 overflow-y-auto flex-1 space-y-4">
              {localError ? (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-(--color-rojo)/30 bg-(--color-pagina-4) p-3 text-sm text-(--color-rojo-obscuro)">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-(--color-rojo)" />
                  <span>{localError}</span>
                </div>
              ) : null}

              <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-4) p-4">
                <p className="text-xs font-semibold uppercase text-(--color-gris-letra)">Deuda seleccionada</p>
                <p className="mt-1 font-semibold text-(--color-negro)">
                  #{deudaSeleccionada?.numeroDeuda ?? deudaSeleccionada?.idDeuda ?? "---"} - {deudaSeleccionada?.nombreAcreedor || "---"}
                </p>
                <p className="mt-1 text-sm text-(--color-gris-letra)">
                  Saldo pendiente: <span className="font-bold text-(--color-verde)">{formatearMoneda(deudaSeleccionada?.montoPendiente)}</span>
                </p>
                {fieldErrors.idDeuda?.[0] ? <p className="mt-2 text-xs text-(--color-rojo)">{fieldErrors.idDeuda[0]}</p> : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Fecha de abono *</label>
                  <input
                    type="date"
                    max={obtenerFechaGuatemala()}
                    value={formAbono.fechaAbono}
                    onChange={(event) => actualizarCampoAbono("fechaAbono", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.fechaAbono)}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  />
                  {fieldErrors.fechaAbono?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.fechaAbono[0]}</p> : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Metodo de pago *</label>
                  <select
                    value={formAbono.idMetodoPago}
                    onChange={(event) => actualizarCampoAbono("idMetodoPago", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.idMetodoPago)}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  >
                    <option value="">Seleccione un metodo</option>
                    {metodosPago.map((metodo) => (
                      <option key={metodo.idMetodoPago} value={metodo.idMetodoPago}>
                        {metodo.nombre}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.idMetodoPago?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.idMetodoPago[0]}</p> : null}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-(--color-gris-letra) block">Monto *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-gris-claro) text-sm font-semibold">Q</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formAbono.monto}
                    onChange={(event) => actualizarCampoAbono("monto", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.monto)}
                    placeholder="0.00"
                    className="w-full border border-(--color-gris-claro-2) pl-8 pr-3 p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm font-semibold bg-(--color-blanco) text-(--color-negro)"
                  />
                </div>
                {fieldErrors.monto?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.monto[0]}</p> : null}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-(--color-gris-letra) block">Observaciones</label>
                <textarea
                  rows="3"
                  value={formAbono.observaciones}
                  onChange={(event) => actualizarCampoAbono("observaciones", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.observaciones)}
                  placeholder="Ej. Pago parcial por transferencia"
                  className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm resize-none bg-(--color-blanco) text-(--color-negro)"
                />
                {fieldErrors.observaciones?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.observaciones[0]}</p> : null}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-(--color-gris-claro-2) mt-4">
                <button
                  type="button"
                  onClick={cerrarAbono}
                  className="border border-(--color-gris-claro-2) px-6 py-2.5 rounded-xl text-(--color-gris-letra) hover:bg-(--color-pagina-3) text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-(--color-pagina) text-(--color-blanco) border border-(--color-borde-button) px-6 py-3 rounded-xl font-medium hover:bg-(--color-rosa-hover) hover:text-(--color-negro) transition-all text-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? "Guardando..." : "Registrar abono"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
