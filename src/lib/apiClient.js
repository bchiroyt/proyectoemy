import axios from "axios";
import { useAuthStore } from "@/context/useAuthStore";

const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim?.() ?? "";

const baseURL = fromEnv;
if (!baseURL) {
  throw new Error(
    "Falta VITE_API_BASE_URL. Crea frontendemy/.env con VITE_API_BASE_URL=https://tu-api (sin barra final)."
  );
}
if (import.meta.env.DEV && !fromEnv) {
  console.warn(
    "[apiClient] VITE_API_BASE_URL no está en .env; usando URL por defecto solo en desarrollo."
  );
}

export const API_BASE_URL = baseURL;

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = String(err.config?.url ?? "");
    const isLoginCall =
      url.includes("/api/Auth/login") ||
      url.includes("/api/auth/login") ||
      url.endsWith("/api/auth/login");
    if (err.response?.status === 401 && !isLoginCall) {
      const path = window.location.pathname;
      useAuthStore.getState().logout();
      if (path !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

export function getApiErrorMessage(err, fallback = "Error de conexión con el servidor.") {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  const msg =
    pickMessage(data) ||
    err?.message ||
    fallback;
  return String(msg);
}

function pickMessage(data) {
  if (!data || typeof data !== "object") return null;
  const errorsMessage = pickErrorsMessage(data.errors || data.Errors || data.errores || data.Errores);
  return (
    data.mensaje ||
    data.Mensaje ||
    data.message ||
    data.Message ||
    errorsMessage ||
    data.title ||
    data.Title ||
    null
  );
}

function pickErrorsMessage(errors) {
  if (!errors) return null;
  if (Array.isArray(errors)) return errors.filter(Boolean).join(", ") || null;
  if (typeof errors === "string") return errors.trim() || null;
  if (typeof errors !== "object") return null;

  const messages = Object.values(errors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .map(String);

  return messages.length > 0 ? messages.join(", ") : null;
}
