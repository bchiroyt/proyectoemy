import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NAV_GUARD_BACK, useNavigationStore } from "@/context/useNavigationStore";

/**
 * Bloquea navegación (sidebar, volver, atrás del navegador) cuando hay datos sin guardar.
 */
export function useSalidaSinGuardar({ enabled = true, tieneDatos, rutaFallback }) {
  const navigate = useNavigate();
  const setUnsavedChangesGuard = useNavigationStore((s) => s.setUnsavedChangesGuard);
  const attemptNavigation = useNavigationStore((s) => s.attemptNavigation);
  const confirmExitOpen = useNavigationStore((s) => s.confirmExitOpen);
  const cancelExit = useNavigationStore((s) => s.cancelExit);
  const consumePendingNavigation = useNavigationStore((s) => s.consumePendingNavigation);

  const hayDatosPendientes = useCallback(() => {
    if (!enabled) return false;
    return tieneDatos();
  }, [enabled, tieneDatos]);

  useEffect(() => {
    if (!enabled) {
      setUnsavedChangesGuard(null);
      return;
    }
    setUnsavedChangesGuard(() => hayDatosPendientes);
    return () => setUnsavedChangesGuard(null);
  }, [enabled, hayDatosPendientes, setUnsavedChangesGuard]);

  useEffect(() => {
    if (!enabled) return;

    const onPopState = () => {
      if (!hayDatosPendientes()) return;
      window.history.pushState(null, "", window.location.href);
      useNavigationStore.setState({ confirmExitOpen: true, pendingNav: NAV_GUARD_BACK });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [enabled, hayDatosPendientes]);

  useEffect(() => {
    if (!enabled || !hayDatosPendientes()) return;
    window.history.pushState(null, "", window.location.href);
  }, [enabled, hayDatosPendientes]);

  const permitirSalida = useCallback(() => {
    setUnsavedChangesGuard(null);
  }, [setUnsavedChangesGuard]);

  const salirSinGuardar = useCallback(() => {
    setUnsavedChangesGuard(null);
    const destino = consumePendingNavigation();
    if (destino === NAV_GUARD_BACK) {
      navigate(-1);
      return;
    }
    if (destino) {
      navigate(destino);
      return;
    }
    if (rutaFallback) {
      navigate(rutaFallback);
    }
  }, [consumePendingNavigation, navigate, rutaFallback, setUnsavedChangesGuard]);

  const intentarNavegar = useCallback(
    (to) => {
      if (!attemptNavigation(to)) return false;
      navigate(to);
      return true;
    },
    [attemptNavigation, navigate]
  );

  return {
    confirmExitOpen,
    cancelExit,
    salirSinGuardar,
    intentarNavegar,
    permitirSalida,
  };
}
