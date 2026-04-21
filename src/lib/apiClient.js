import axios from "axios";
import { useAuthStore } from "@/context/useAuthStore";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7199";

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
  return (
    data.mensaje ||
    data.Mensaje ||
    data.message ||
    data.Message ||
    data.title ||
    data.Title ||
    (Array.isArray(data.errors) && data.errors.join?.(", ")) ||
    null
  );
}
