import { apiClient } from "@/lib/apiClient";
import { pick, throwIfEnvelopeFailed, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";

function mapCredencialCaja(raw) {
  if (!raw) return null;
  const idUsuario = toNumberOrNull(pick(raw, "idUsuario", "IdUsuario"));
  if (idUsuario == null) return null;
  return {
    idUsuarioCredencialCaja: toNumberOrNull(
      pick(raw, "idUsuarioCredencialCaja", "IdUsuarioCredencialCaja")
    ),
    idUsuario,
    username: pick(raw, "username", "Username") ?? "",
    email: pick(raw, "email", "Email") ?? "",
    nombres: pick(raw, "nombres", "Nombres") ?? "",
    apellidos: pick(raw, "apellidos", "Apellidos") ?? "",
    nombreCompleto: pick(raw, "nombreCompleto", "NombreCompleto") ?? "",
    usuarioActivo: Boolean(pick(raw, "usuarioActivo", "UsuarioActivo") ?? true),
    activo: Boolean(pick(raw, "activo", "Activo") ?? true),
    fechaCreacion: pick(raw, "fechaCreacion", "FechaCreacion"),
    fechaActualizacion: pick(raw, "fechaActualizacion", "FechaActualizacion"),
  };
}

/** GET /api/credenciales-caja — lista de operadores con credencial de caja (para cambio de cajero). */
export async function fetchCredencialesCaja({ page = 1, pageSize = 100 } = {}) {
  const { data } = await apiClient.get("/api/credenciales-caja", {
    params: { page, pageSize },
  });
  throwIfEnvelopeFailed(data, "No se pudieron cargar las credenciales de caja.");
  return unwrapList(data).map(mapCredencialCaja).filter(Boolean);
}

/** GET /api/credenciales-caja/{idUsuario} — null si no existe (404) */
export async function fetchCredencialCajaPorUsuario(idUsuario) {
  try {
    const { data } = await apiClient.get(`/api/credenciales-caja/${idUsuario}`);
    throwIfEnvelopeFailed(data, "No se pudo cargar la credencial de caja.");
    const inner = pick(data, "data", "Data");
    return mapCredencialCaja(inner ?? data);
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

/** POST /api/credenciales-caja */
export async function crearCredencialCaja(body) {
  const { data } = await apiClient.post("/api/credenciales-caja", body);
  throwIfEnvelopeFailed(data, "No se pudo crear la credencial de caja.");
  const inner = pick(data, "data", "Data");
  return mapCredencialCaja(inner ?? data);
}

/**
 * PUT /api/credenciales-caja/{idUsuario}/nip
 * Admin: asigna NIP nuevo sin pedir el actual (nipNuevo + confirmacionNipNuevo).
 */
export async function asignarNipCredencialCaja(idUsuario, nuevoNip) {
  const { data } = await apiClient.put(`/api/credenciales-caja/${idUsuario}/nip`, {
    nipNuevo: nuevoNip,
    confirmacionNipNuevo: nuevoNip,
  });
  throwIfEnvelopeFailed(data, "No se pudo actualizar el NIP de caja.");
  const inner = pick(data, "data", "Data");
  return mapCredencialCaja(inner ?? data);
}

/**
 * PATCH /api/credenciales-caja/{idUsuario}
 * Requiere NIP actual (flujo “cambiar mi NIP”).
 */
export async function patchCredencialCajaUsuario(idUsuario, body) {
  const { data } = await apiClient.patch(`/api/credenciales-caja/${idUsuario}`, {
    nipActual: body.nipActual,
    nuevoNip: body.nuevoNip,
  });
  throwIfEnvelopeFailed(data, "No se pudo actualizar la credencial de caja.");
  const inner = pick(data, "data", "Data");
  return inner ?? data;
}

/** PATCH /api/credenciales-caja/{idUsuario}/estado */
export async function actualizarEstadoCredencialCaja(idUsuario, activo) {
  const { data } = await apiClient.patch(`/api/credenciales-caja/${idUsuario}/estado`, { activo });
  throwIfEnvelopeFailed(data, "No se pudo actualizar el estado de la credencial.");
  const inner = pick(data, "data", "Data");
  return mapCredencialCaja(inner ?? data);
}
