const ACCION_LABEL = {
  READ: "ver",
  CREATE: "crear",
  UPDATE: "editar",
  DELETE: "eliminar",
  WRITE: "modificar",
};

const RECURSO_LABEL = {
  DEUDAS: "Deudas",
  GASTOS: "Gastos",
  PAGOS: "Pagos",
  COMPRAS: "Compras",
  PRODUCTOS: "Productos",
  VENTAS: "Ventas",
  CAJAS: "Cajas",
  USUARIOS: "Usuarios",
  ROLES: "Roles",
  PROVEEDORES: "Proveedores",
  AJUSTES: "Ajustes",
  COTIZACIONES: "Cotizaciones",
  REEMBOLSOS: "Reembolsos",
  INVENTARIO: "Inventario",
  MARCAS: "Marcas",
  CATEGORIAS: "Categorías",
  TALLAS: "Tallas",
  PRESENTACIONES: "Presentaciones",
  UBICACIONES: "Ubicaciones",
};

const PERMISO_PATTERNS = [
  /no tiene permiso/i,
  /sin permiso/i,
  /acceso denegado/i,
  /no autorizado/i,
  /forbidden/i,
  /unauthorized/i,
  /permiso insuficiente/i,
  /no cuenta con permiso/i,
  /ejecutar\s+(READ|CREATE|UPDATE|DELETE|WRITE)\b/i,
];

function extraerMensajeCrudo(errorOrMessage) {
  if (errorOrMessage == null) return "";
  if (typeof errorOrMessage === "string") return errorOrMessage;

  const data = errorOrMessage?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    const msg =
      data.mensaje ||
      data.Mensaje ||
      data.message ||
      data.Message ||
      data.title ||
      data.Title;
    if (msg) return String(msg);
  }
  if (errorOrMessage?.message) return String(errorOrMessage.message);
  return "";
}

/**
 * Detecta si un error (objeto axios/Error o string) es de permisos / 403.
 */
export function esErrorPermiso(errorOrMessage) {
  if (errorOrMessage == null) return false;

  const status = errorOrMessage?.response?.status ?? errorOrMessage?.status;
  if (status === 403) return true;

  const message = extraerMensajeCrudo(errorOrMessage);
  if (!message) return false;
  return PERMISO_PATTERNS.some((re) => re.test(message));
}

function etiquetaRecurso(raw) {
  const key = String(raw || "").trim().toUpperCase();
  if (!key) return "este módulo";
  return RECURSO_LABEL[key] || key.charAt(0) + key.slice(1).toLowerCase();
}

function etiquetaAccion(raw) {
  const key = String(raw || "").trim().toUpperCase();
  return ACCION_LABEL[key] || "usar";
}

/**
 * Convierte mensajes técnicos (ej. "READ en DEUDAS") a texto amigable.
 */
export function mensajePermisoAmigable(errorOrMessage, fallbackModulo = "este módulo") {
  const raw = extraerMensajeCrudo(errorOrMessage);

  const matchEjecutar = raw.match(
    /ejecutar\s+(READ|CREATE|UPDATE|DELETE|WRITE)\s+en\s+([A-ZÁÉÍÓÚÑ_]+)/i
  );
  if (matchEjecutar) {
    const accion = etiquetaAccion(matchEjecutar[1]);
    const recurso = etiquetaRecurso(matchEjecutar[2]);
    return `Tu rol no incluye permiso para ${accion} ${recurso}.`;
  }

  const matchAsigne = raw.match(/asigne\s+([A-ZÁÉÍÓÚÑ_]+)\s*[·•\-]\s*([A-Za-zÁÉÍÓÚáéíóúñ]+)/i);
  if (matchAsigne) {
    const recurso = etiquetaRecurso(matchAsigne[1]);
    const accionRaw = matchAsigne[2].toUpperCase();
    const accionMap = {
      LEER: "ver",
      CREAR: "crear",
      ACTUALIZAR: "editar",
      ELIMINAR: "eliminar",
      READ: "ver",
      CREATE: "crear",
      UPDATE: "editar",
      DELETE: "eliminar",
    };
    const accion = accionMap[accionRaw] || accionRaw.toLowerCase();
    return `Tu rol no incluye permiso para ${accion} ${recurso}.`;
  }

  if (/sin permiso|no tiene permiso|acceso denegado|forbidden/i.test(raw)) {
    return `No tienes acceso a ${fallbackModulo}. Si crees que es un error, contacta al administrador.`;
  }

  return raw || `No tienes acceso a ${fallbackModulo}.`;
}

/**
 * Presentación unificada para pantallas de carga fallida.
 */
export function resolverEstadoErrorCarga(errorOrMessage, {
  fallbackGenerico = "No se pudo cargar la información.",
  nombreModulo = "este módulo",
} = {}) {
  const mensajeCrudo = extraerMensajeCrudo(errorOrMessage) || fallbackGenerico;
  const esPermiso = esErrorPermiso(errorOrMessage) || esErrorPermiso(mensajeCrudo);

  if (esPermiso) {
    return {
      tipo: "permiso",
      titulo: "No tienes acceso a este módulo",
      mensaje: mensajePermisoAmigable(mensajeCrudo, nombreModulo),
      detalleTecnico: mensajeCrudo,
      mostrarReintentar: false,
    };
  }

  return {
    tipo: "error",
    titulo: "No se pudo cargar",
    mensaje: mensajeCrudo || fallbackGenerico,
    detalleTecnico: null,
    mostrarReintentar: true,
  };
}
