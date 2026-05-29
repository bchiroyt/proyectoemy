import { apiClient } from "@/lib/apiClient";
import { pick, throwIfEnvelopeFailed } from "@/lib/apiNormalizer";

/**
 * POST /api/auth/login
 * Body backend: { usernameOrEmail, password } (AuthLoginRequest).
 * Respuesta: { exito, mensaje, data: { token, usuario, expiraEn, tipoToken } }
 */
export async function loginRequest({ email, password }) {
  const { data } = await apiClient.post("/api/auth/login", {
    usernameOrEmail: email,
    password,
  });
  throwIfEnvelopeFailed(data, "No se pudo iniciar sesión.");
  const inner = data?.data && typeof data.data === "object" ? data.data : data;
  const token =
    pick(inner, "accessToken", "AccessToken", "token", "Token") ??
    pick(data, "accessToken", "AccessToken", "token", "Token");
  const usuario =
    pick(inner, "usuario", "Usuario", "user", "User") ??
    pick(data, "usuario", "Usuario", "user", "User") ??
    inner;
  const tokenExpiraEn = pick(inner, "expiraEn", "ExpiraEn") ?? null;
  return { token, usuario, tokenExpiraEn };
}

/**
 * POST /api/auth/login-nip — cambio rápido de operador (requiere sesión válida del terminal).
 * Body: { idUsuario, nip }. Respuesta igual a login: { token, usuario, expiraEn }.
 */
export async function loginNipRequest({ idUsuario, nip }) {
  const { data } = await apiClient.post("/api/auth/login-nip", { idUsuario, nip });
  throwIfEnvelopeFailed(data, "No se pudo cambiar de operador.");
  const inner = data?.data && typeof data.data === "object" ? data.data : data;
  const token =
    pick(inner, "accessToken", "AccessToken", "token", "Token") ??
    pick(data, "accessToken", "AccessToken", "token", "Token");
  const usuario =
    pick(inner, "usuario", "Usuario", "user", "User") ??
    pick(data, "usuario", "Usuario", "user", "User") ??
    inner;
  const tokenExpiraEn = pick(inner, "expiraEn", "ExpiraEn") ?? null;
  return { token, usuario, tokenExpiraEn };
}
