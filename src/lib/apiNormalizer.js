/**
 * Normaliza respuestas de ASP.NET (PascalCase o camelCase) a un solo shape camelCase
 * para el frontend. Ajusta los pick() si tus DTO usan otros nombres.
 */
export function pick(obj, ...keys) {
  if (obj == null) return undefined;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) {
      return obj[k];
    }
  }
  return undefined;
}

export function toNumberOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapUsuario(raw) {
  if (!raw) return null;
  const idUsuario =
    toNumberOrNull(pick(raw, "idUsuario", "id_usuario", "IdUsuario")) ??
    toNumberOrNull(pick(raw, "id", "Id"));
  const rolesRaw = pick(raw, "roles", "Roles") ?? [];
  const roles = Array.isArray(rolesRaw) ? rolesRaw.map(mapRolMini).filter(Boolean) : [];
  const nombreRol = pick(raw, "nombreRol", "NombreRol", "rol", "Rol");
  const nombres = pick(raw, "nombres", "Nombres") ?? pick(raw, "nombre", "Nombre") ?? "";
  const apellidos = pick(raw, "apellidos", "Apellidos") ?? pick(raw, "apellido", "Apellido") ?? "";
  const activoRaw = pick(raw, "activo", "Activo");
  const estadoRaw = pick(raw, "estado", "Estado");
  const activo =
    activoRaw !== undefined && activoRaw !== null ? Boolean(activoRaw) : Boolean(estadoRaw ?? true);
  return {
    idUsuario,
    username: pick(raw, "username", "Username") ?? "",
    email: pick(raw, "email", "Email") ?? "",
    nombres,
    apellidos,
    telefono: pick(raw, "telefono", "Telefono") ?? "",
    activo,
    idTipoUsuario: toNumberOrNull(pick(raw, "idTipoUsuario", "id_tipo_usuario", "IdTipoUsuario")),
    nombreTipoUsuario: pick(raw, "nombreTipoUsuario", "NombreTipoUsuario", "tipoUsuarioNombre", "TipoUsuarioNombre"),
    roles,
    nombreRol,
  };
}

function mapRolMini(raw) {
  if (!raw) return null;
  const idRol = toNumberOrNull(pick(raw, "idRol", "id_rol", "IdRol"));
  if (idRol == null) return null;
  return {
    idRol,
    codigo: pick(raw, "codigo", "Codigo") ?? "",
    nombre: pick(raw, "nombre", "Nombre") ?? "",
  };
}

export function mapRol(raw) {
  if (!raw) return null;
  const idRol = toNumberOrNull(pick(raw, "idRol", "id_rol", "IdRol"));
  if (idRol == null) return null;
  return {
    idRol,
    codigo: pick(raw, "codigo", "Codigo") ?? "",
    nombre: pick(raw, "nombre", "Nombre") ?? "",
    descripcion: pick(raw, "descripcion", "Descripcion") ?? "",
    activo: Boolean(pick(raw, "activo", "Activo") ?? true),
  };
}

export function mapModulo(raw) {
  if (!raw) return null;
  const idModulo = toNumberOrNull(pick(raw, "idModulo", "id_modulo", "IdModulo"));
  if (idModulo == null) return null;
  const subs = pick(raw, "submodulos", "Submodulos") ?? [];
  return {
    idModulo,
    codigo: pick(raw, "codigo", "Codigo") ?? "",
    nombre: pick(raw, "nombre", "Nombre") ?? "",
    submodulos: Array.isArray(subs) ? subs.map(mapSubmodulo).filter(Boolean) : [],
  };
}

function mapSubmodulo(raw) {
  if (!raw) return null;
  const idSubmodulo = toNumberOrNull(pick(raw, "idSubmodulo", "id_submodulo", "IdSubmodulo"));
  if (idSubmodulo == null) return null;
  return {
    idSubmodulo,
    codigo: pick(raw, "codigo", "Codigo") ?? "",
    nombre: pick(raw, "nombre", "Nombre") ?? "",
    idModulo: toNumberOrNull(pick(raw, "idModulo", "id_modulo", "IdModulo")),
  };
}

export function mapAccion(raw) {
  if (!raw) return null;
  const idAccion = toNumberOrNull(pick(raw, "idAccion", "id_accion", "IdAccion"));
  if (idAccion == null) return null;
  return {
    idAccion,
    codigo: pick(raw, "codigo", "Codigo") ?? "",
    nombre: pick(raw, "nombre", "Nombre") ?? "",
  };
}

export function mapRolPermiso(raw) {
  if (!raw) return null;
  return {
    idRolPermiso: toNumberOrNull(pick(raw, "idRolPermiso", "id_rol_permiso", "IdRolPermiso")),
    idRol: toNumberOrNull(pick(raw, "idRol", "id_rol", "IdRol")),
    idModulo: toNumberOrNull(pick(raw, "idModulo", "id_modulo", "IdModulo")),
    idSubmodulo: toNumberOrNull(pick(raw, "idSubmodulo", "id_submodulo", "IdSubmodulo")),
    idAccion: toNumberOrNull(pick(raw, "idAccion", "id_accion", "IdAccion")),
    permitido: Boolean(pick(raw, "permitido", "Permitido") ?? false),
  };
}

export function buildSessionUser(raw) {
  const u = mapUsuario(raw) || {};
  const nombreMostrar =
    [u.nombres, u.apellidos].filter(Boolean).join(" ").trim() ||
    u.username ||
    u.email ||
    "Usuario";
  const rolesEtiqueta =
    (u.roles?.length ? u.roles.map((r) => r.nombre).filter(Boolean).join(", ") : "") ||
    u.nombreRol ||
    u.nombreTipoUsuario ||
    "Usuario";
  return { ...u, nombreMostrar, rolesEtiqueta };
}

export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const envelope = pick(payload, "data", "Data");
  if (envelope != null && typeof envelope === "object") {
    if (Array.isArray(envelope)) return envelope;
    const paged = pick(envelope, "items", "Items");
    if (Array.isArray(paged)) return paged;
  }
  const inner = pick(payload, "items", "Items", "result", "Result", "value", "Value");
  if (Array.isArray(inner)) return inner;
  return [];
}

/**
 * ASP.NET devuelve a veces { exito: false, mensaje } con HTTP 200.
 * Lanza para que React Query marque error.
 */
export function throwIfEnvelopeFailed(data, fallback = "La operación no se completó.") {
  const failed = data && typeof data === "object" && (data.exito === false || data.Exito === false);
  if (failed) {
    const msg = pick(data, "mensaje", "Mensaje") || fallback;
    const err = new Error(String(msg));
    err.response = { data };
    throw err;
  }
}
