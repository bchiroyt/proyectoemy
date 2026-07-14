import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle, CreditCard, Loader2, Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { apiClient, getApiErrorMessage, API_BASE_URL } from "@/lib/apiClient";
import { obtenerFechaGuatemala } from "@/lib/deudaAbonoValidations";
import { Skeleton } from "@/components/ui/skeleton";
import Paginacion from "@/components/shared/Paginacion";
import { EstadoErrorCarga } from "@/components/shared/EstadoErrorCarga";

const PAGE_SIZE = 15;

const formatoMoneda = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

const formatearMoneda = (valor) => formatoMoneda.format(Number(valor) || 0);

const formatearFecha = (valor, incluirHora = false) => {
  if (!valor) return "---";
  if (!incluirHora) return String(valor).split("T")[0];

  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? String(valor)
    : fecha.toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" });
};

const obtenerCampo = (objeto, ...campos) => {
  if (!objeto || typeof objeto !== "object") return undefined;
  const campo = campos.find((nombre) => Object.prototype.hasOwnProperty.call(objeto, nombre));
  return campo ? objeto[campo] : undefined;
};

const crearFormularioVacio = () => {
  const hoy = obtenerFechaGuatemala();
  return {
    entidadFinanciera: "",
    montoTotal: "",
    fechaRegistro: hoy,
    fechaVencimiento: hoy,
    descripcion: "",
  };
};

const construirPayloadDeuda = (deuda) => {
  return {
    entidadFinanciera: String(deuda.entidadFinanciera ?? "").trim(),
    montoTotal: Number(deuda.montoTotal),
    fechaRegistro: deuda.fechaRegistro,
    fechaVencimiento: deuda.fechaVencimiento,
    descripcion: String(deuda.descripcion ?? "").trim(),
  };
};

const obtenerNombreEntidad = (deuda) =>
  obtenerCampo(
    deuda,
    "entidadFinanciera",
    "EntidadFinanciera",
    "nombreAcreedor",
    "NombreAcreedor",
    "acreedor",
    "Acreedor"
  ) || "";

const obtenerFechaRegistroDeuda = (deuda) =>
  obtenerCampo(
    deuda,
    "fechaRegistro",
    "FechaRegistro",
    "fechaOperacion",
    "FechaOperacion",
    "fechaInicio",
    "FechaInicio"
  );

const obtenerEstadoDeuda = (deuda) => {
  const estado = obtenerCampo(deuda, "estado", "Estado");
  if (estado) return estado;

  const restante = Number(
    obtenerCampo(deuda, "totalRestante", "TotalRestante", "saldoPendiente", "SaldoPendiente") ?? 0
  );
  return restante <= 0 ? "PAGADA" : "PENDIENTE";
};

const obtenerTotalAbonos = (deuda) =>
  obtenerCampo(deuda, "totalAbonos", "TotalAbonos", "montoAbonado", "MontoAbonado");

const obtenerTotalRestante = (deuda) =>
  obtenerCampo(
    deuda,
    "totalRestante",
    "TotalRestante",
    "saldoPendiente",
    "SaldoPendiente",
    "montoPendiente",
    "MontoPendiente"
  );

const obtenerTokenLocal = () => {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (!authStorage) return "";

    const auth = JSON.parse(authStorage);
    return auth?.state?.token || auth?.token || "";
  } catch {
    return "";
  }
};

const Deudas = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((state) => state.setTitulo);

  const [deudas, setDeudas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");

  const [notificacion, setNotificacion] = useState({ mostrar: false, tipo: "", mensaje: "" });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formDeuda, setFormDeuda] = useState(crearFormularioVacio);

  const [modalPostmanAbierto, setModalPostmanAbierto] = useState(false);
  const [guardandoPostman, setGuardandoPostman] = useState(false);
  const [respuestaPostman, setRespuestaPostman] = useState("");
  const [postmanDeuda, setPostmanDeuda] = useState({
    entidadFinanciera: "Banco Industrial",
    montoTotal: "5000.00",
    fechaRegistro: "2026-06-21",
    fechaVencimiento: "2027-06-21",
    descripcion: "Préstamo para capital de trabajo",
  });

  const mostrarAviso = (tipo, mensaje) => {
    setNotificacion({ mostrar: true, tipo, mensaje });
    if (tipo === "exito") {
      setTimeout(() => {
        setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
      }, 3000);
    }
  };

  const cargarDeudas = async () => {
    try {
      setCargando(true);
      setErrorCarga("");
      const { data: res } = await apiClient.get("/api/deudas", {
        params: { page: 1, pageSize: 100 },
      });

      if (res?.exito) {
        setDeudas(Array.isArray(res.data) ? res.data : res.data?.items || []);
      } else {
        throw new Error(res?.mensaje || "No se pudieron cargar las deudas.");
      }
    } catch (error) {
      console.error("Error al cargar deudas:", error);
      setDeudas([]);
      setErrorCarga(getApiErrorMessage(error, "No se pudieron cargar las deudas."));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setTitulo("Contabilidad > deudas");
  }, [setTitulo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDeudas();
  }, []);

  const actualizarCampo = (campo, valor) => {
    setFormDeuda((actual) => ({ ...actual, [campo]: valor }));
  };

  const actualizarCampoDesdeInput = (e) => {
    console.log("[Deudas] input capturado", {
      campo: e.target.name,
      valor: e.target.value,
    });
    actualizarCampo(e.target.name, e.target.value);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);
      const payload = construirPayloadDeuda(formDeuda);
      console.log("[Deudas] POST /api/Deudas payload", payload);
      const { data } = await apiClient.post("/api/Deudas", payload);
      if (data?.exito) {
        mostrarAviso("exito", "Deuda registrada correctamente.");
        cerrarYLimpiarModal();
        await cargarDeudas();
      } else {
        mostrarAviso("error", data?.mensaje || "No se pudo registrar la deuda.");
      }
    } catch (error) {
      console.error("Error en la operacion de deudas:", error);
      mostrarAviso(
        "error",
        getApiErrorMessage(error, "No se pudo procesar la deuda. Verifique los datos e intente nuevamente.")
      );
    } finally {
      setGuardando(false);
    }
  };

  const cerrarYLimpiarModal = () => {
    setModalAbierto(false);
    setFormDeuda(crearFormularioVacio());
  };

  const abrirNueva = () => {
    setFormDeuda(crearFormularioVacio());
    setModalAbierto(true);
  };

  const actualizarCampoPostman = (e) => {
    setPostmanDeuda((actual) => ({ ...actual, [e.target.name]: e.target.value }));
  };

  const enviarPostmanDirecto = async (e) => {
    e.preventDefault();
    setGuardandoPostman(true);
    setRespuestaPostman("");

    try {
      const payload = {
        entidadFinanciera: postmanDeuda.entidadFinanciera,
        montoTotal: Number(postmanDeuda.montoTotal),
        fechaRegistro: postmanDeuda.fechaRegistro,
        fechaVencimiento: postmanDeuda.fechaVencimiento,
        descripcion: postmanDeuda.descripcion,
      };
      const token = obtenerTokenLocal();

      const response = await fetch(`${API_BASE_URL}/api/Deudas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const texto = await response.text();
      setRespuestaPostman(`HTTP ${response.status}${texto ? ` - ${texto}` : ""}`);
    } catch (error) {
      setRespuestaPostman(error?.message || "Error al enviar la deuda.");
    } finally {
      setGuardandoPostman(false);
    }
  };

  const deudasFiltradas = useMemo(() => {
    const terminoBusqueda = busqueda.trim().toLowerCase();
    if (!terminoBusqueda) return deudas;

    return deudas.filter((deuda) =>
      [
        obtenerNombreEntidad(deuda),
        obtenerCampo(deuda, "descripcion", "Descripcion"),
        obtenerEstadoDeuda(deuda),
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
        <div>
          <p className="text-(--color-gris-letra) text-sm mt-1">
            Administra los saldos pendientes de cobro, cuentas corrientes y pasivos operativos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/pagos")}
            className="flex items-center gap-2 bg-(--color-pagina) border border-(--color-borde-button) text-(--color-blanco) px-4 py-2 rounded-xl hover:bg-(--color-rosa-hover) hover:text-(--color-negro) transition-colors cursor-pointer text-sm font-medium shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            Gestionar abonos
          </button>

          <button
            type="button"
            onClick={() => navigate("/contabilidad")}
            className="flex items-center gap-2 bg-(--color-pagina-2) text-(--color-blanco) px-4 py-2 rounded-xl hover:bg-(--color-esmeralda-hover) transition-colors cursor-pointer text-sm font-medium shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-gris-claro)" />
          <input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por entidad, descripcion o estado..."
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={abrirNueva}
            className="flex items-center gap-2 bg-(--color-pagina) border border-(--color-borde-button) text-(--color-blanco) px-5 py-3 rounded-xl hover:bg-(--color-rosa-hover) hover:text-(--color-negro) transition-colors cursor-pointer text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Obligacion
          </button>

          {/*
          <button
            type="button"
            onClick={() => {
              setRespuestaPostman("");
              setModalPostmanAbierto(true);
            }}
            className="flex items-center gap-2 bg-(--color-pagina-2) border border-(--color-borde-button) text-(--color-blanco) px-5 py-3 rounded-xl hover:bg-(--color-esmeralda-hover) transition-colors cursor-pointer text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Obligacion Fetch
          </button>
          */}
        </div>
      </div>

      <div className="bg-(--color-blanco) rounded-2xl shadow-md border border-(--color-gris-claro-2) overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-(--color-pagina-3) text-(--color-gris-letra) uppercase text-[11px] tracking-wider font-bold border-b border-(--color-gris-claro-2)">
            <tr>
              <th className="p-4 text-left">No. deuda</th>
              <th className="p-4 text-left">Entidad financiera</th>
              <th className="p-4 text-left">Descripcion</th>
              <th className="p-4 text-left">Fecha registro</th>
              <th className="p-4 text-left">Fecha vencimiento</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-right">Monto total</th>
              <th className="p-4 text-right">Total abonado</th>
              <th className="p-4 text-right">Total restante</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-(--color-gris-claro-2)">
            {cargando ? (
              Array.from({ length: 6 }).map((_, fila) => (
                <tr key={`deuda-skeleton-${fila}`}>
                  {Array.from({ length: 9 }).map((__, columna) => (
                    <td key={`deuda-skeleton-${fila}-${columna}`} className="p-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : errorCarga ? (
              <EstadoErrorCarga
                colSpan={9}
                mensaje={errorCarga}
                nombreModulo="Deudas"
                fallbackGenerico="No se pudieron cargar las deudas."
                onReintentar={cargarDeudas}
              />
            ) : deudasPagina.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-12 text-center text-(--color-gris-claro) font-medium">
                  No se registran obligaciones financieras pendientes.
                </td>
              </tr>
            ) : (
              deudasPagina.map((deuda) => (
                <tr key={deuda.idDeuda || deuda.id} className="hover:bg-(--color-pagina-4) transition-colors text-(--color-negro)">
                  <td className="p-4 font-semibold">#{deuda.idDeuda ?? deuda.id ?? "---"}</td>
                  <td className="p-4 font-semibold">{obtenerNombreEntidad(deuda) || "---"}</td>
                  <td className="p-4 text-(--color-gris-letra) font-medium">
                    {obtenerCampo(deuda, "descripcion", "Descripcion") || "---"}
                  </td>
                  <td className="p-4 whitespace-nowrap text-(--color-gris-letra) font-medium">
                    {formatearFecha(obtenerFechaRegistroDeuda(deuda), true)}
                  </td>
                  <td className="p-4 whitespace-nowrap text-(--color-gris-letra) font-medium">
                    {formatearFecha(obtenerCampo(deuda, "fechaVencimiento", "FechaVencimiento"))}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        obtenerEstadoDeuda(deuda) === "PAGADA"
                          ? "bg-(--color-pagina-3) border-(--color-pos-scan-ok-borde) text-(--color-verde)"
                          : "bg-(--color-blanco) border-(--color-rojo) text-(--color-rojo-obscuro)"
                      }`}
                    >
                      {obtenerEstadoDeuda(deuda)}
                    </span>
                  </td>
                  <td className="p-4 text-right font-semibold">
                    {formatearMoneda(obtenerCampo(deuda, "montoTotal", "MontoTotal"))}
                  </td>
                  <td className="p-4 text-right text-(--color-gris-letra)">
                    {obtenerTotalAbonos(deuda) == null ? "---" : formatearMoneda(obtenerTotalAbonos(deuda))}
                  </td>
                  <td className="p-4 text-right font-bold text-(--color-rojo)">
                    {formatearMoneda(obtenerTotalRestante(deuda))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-(--color-negro)/40 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-(--color-blanco) w-full max-w-xl rounded-2xl shadow-lg flex flex-col max-h-[90vh] border-t-4 border-(--color-pagina) relative">
            {notificacion.mostrar && (
              <div
                className={`absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all max-w-md w-11/12 animate-bounce ${
                  notificacion.tipo === "exito"
                    ? "bg-(--color-blanco) border-(--color-pos-scan-ok-borde) text-(--color-verde)"
                    : "bg-(--color-blanco) border-(--color-rojo) text-(--color-rojo-obscuro)"
                }`}
              >
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

            <div className="flex justify-between items-center p-6 border-b border-(--color-gris-claro-2)">
              <div className="w-9" />
              <h2 className="text-lg font-semibold text-(--color-negro)">
                Registrar Nueva Obligacion
              </h2>
              <button
                type="button"
                onClick={cerrarYLimpiarModal}
                className="p-1.5 hover:bg-(--color-pagina-3) rounded-lg text-(--color-gris-letra)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} noValidate className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">
                    Entidad financiera *
                  </label>
                  <input
                    type="text"
                    name="entidadFinanciera"
                    value={formDeuda.entidadFinanciera}
                    onChange={actualizarCampoDesdeInput}
                    placeholder="Ej. Banco Industrial"
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">
                    Fecha de registro *
                  </label>
                  <input
                    type="date"
                    name="fechaRegistro"
                    value={formDeuda.fechaRegistro}
                    onChange={actualizarCampoDesdeInput}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Monto total *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-gris-claro) text-sm font-semibold">
                      Q
                    </span>
                    <input
                      type="number"
                      name="montoTotal"
                      step="0.01"
                      value={formDeuda.montoTotal}
                      onChange={actualizarCampoDesdeInput}
                      placeholder="0.00"
                      className="w-full border border-(--color-gris-claro-2) pl-8 pr-3 p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm font-semibold bg-(--color-blanco) text-(--color-negro)"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">
                    Fecha de vencimiento *
                  </label>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    value={formDeuda.fechaVencimiento}
                    onChange={actualizarCampoDesdeInput}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-(--color-gris-letra) block">Descripcion *</label>
                <textarea
                  name="descripcion"
                  rows="3"
                  value={formDeuda.descripcion}
                  onChange={actualizarCampoDesdeInput}
                  placeholder="Ej. Prestamo para capital de trabajo"
                  className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm resize-none bg-(--color-blanco) text-(--color-negro)"
                />
              </div>

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
                  disabled={guardando}
                  className="bg-(--color-pagina) text-(--color-blanco) border border-(--color-borde-button) px-6 py-3 rounded-xl font-medium hover:bg-(--color-rosa-hover) hover:text-(--color-negro) transition-all text-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? "Guardando..." : "Guardar Obligacion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalPostmanAbierto && (
        <div className="fixed inset-0 bg-(--color-negro)/40 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-(--color-blanco) w-full max-w-xl rounded-2xl shadow-lg flex flex-col max-h-[90vh] border-t-4 border-(--color-pagina-2) relative">
            <div className="flex justify-between items-center p-6 border-b border-(--color-gris-claro-2)">
              <div className="w-9" />
              <h2 className="text-lg font-semibold text-(--color-negro)">Nueva Obligacion Fetch</h2>
              <button
                type="button"
                onClick={() => setModalPostmanAbierto(false)}
                className="p-1.5 hover:bg-(--color-pagina-3) rounded-lg text-(--color-gris-letra)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={enviarPostmanDirecto} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-(--color-gris-letra) block">Entidad financiera</label>
                <input
                  type="text"
                  name="entidadFinanciera"
                  value={postmanDeuda.entidadFinanciera}
                  onChange={actualizarCampoPostman}
                  className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Monto total</label>
                  <input
                    type="number"
                    name="montoTotal"
                    step="0.01"
                    value={postmanDeuda.montoTotal}
                    onChange={actualizarCampoPostman}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-(--color-gris-letra) block">Fecha registro</label>
                  <input
                    type="date"
                    name="fechaRegistro"
                    value={postmanDeuda.fechaRegistro}
                    onChange={actualizarCampoPostman}
                    className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-(--color-gris-letra) block">Fecha vencimiento</label>
                <input
                  type="date"
                  name="fechaVencimiento"
                  value={postmanDeuda.fechaVencimiento}
                  onChange={actualizarCampoPostman}
                  className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm bg-(--color-blanco) text-(--color-negro)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-(--color-gris-letra) block">Descripcion</label>
                <textarea
                  name="descripcion"
                  rows="3"
                  value={postmanDeuda.descripcion}
                  onChange={actualizarCampoPostman}
                  className="w-full border border-(--color-gris-claro-2) p-3 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm resize-none bg-(--color-blanco) text-(--color-negro)"
                />
              </div>

              {respuestaPostman && (
                <p className="text-sm text-(--color-gris-letra) break-words">{respuestaPostman}</p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-(--color-gris-claro-2) mt-4">
                <button
                  type="button"
                  onClick={() => setModalPostmanAbierto(false)}
                  className="border border-(--color-gris-claro-2) px-6 py-2.5 rounded-xl text-(--color-gris-letra) hover:bg-(--color-pagina-3) text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPostman}
                  className="bg-(--color-pagina-2) text-(--color-blanco) border border-(--color-borde-button) px-6 py-3 rounded-xl font-medium hover:bg-(--color-esmeralda-hover) transition-all text-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {guardandoPostman && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardandoPostman ? "Enviando..." : "Enviar Fetch"}
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
