import { apiClient } from "@/lib/apiClient";
import { pick, throwIfEnvelopeFailed, toNumberOrNull } from "@/lib/apiNormalizer";

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

/** PUT /api/credenciales-caja/{idUsuario}/nip */
export async function actualizarNipCredencialCaja(idUsuario, body) {
  const { data } = await apiClient.put(`/api/credenciales-caja/${idUsuario}/nip`, body);
  throwIfEnvelopeFailed(data, "No se pudo actualizar el NIP de caja.");
  const inner = pick(data, "data", "Data");
  return mapCredencialCaja(inner ?? data);
}

/** PATCH /api/credenciales-caja/{idUsuario}/estado */
export async function actualizarEstadoCredencialCaja(idUsuario, activo) {
  const { data } = await apiClient.patch(`/api/credenciales-caja/${idUsuario}/estado`, { activo });
  throwIfEnvelopeFailed(data, "No se pudo actualizar el estado de la credencial.");
  const inner = pick(data, "data", "Data");
  return mapCredencialCaja(inner ?? data);
}
