import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/context/useAuthStore";
import { useLoginNipMutation } from "@/hooks/queries/useSeguridadQueries";
import {
  useCredencialesCajaQuery,
} from "@/hooks/queries/useCredencialCajaQueries";
import { useActivarCajaMutation, QK_MI_CAJA } from "@/hooks/queries/useCajaQueries";
import { buildSessionUser } from "@/lib/apiNormalizer";
import { getApiErrorMessage } from "@/lib/apiClient";

/**
 * Cambio rápido de operador sobre la misma caja abierta.
 * El cajero entrante se selecciona y confirma con su NIP; se intercambia el token
 * conservando la caja del terminal. Las ventas siguientes quedan a nombre del nuevo operador.
 */
export function CambiarCajeroDialog({ open, onOpenChange, idCaja, onChanged }) {
  const setLogin = useAuthStore((s) => s.setLogin);
  const currentUserId = useAuthStore((s) => s.user?.idUsuario);

  const credencialesQ = useCredencialesCajaQuery({ enabled: open });
  const loginNipMut = useLoginNipMutation();
  const activarMut = useActivarCajaMutation();
  const qc = useQueryClient();

  const [selected, setSelected] = useState(null);
  const [nip, setNip] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setNip("");
      setError("");
    }
  }, [open]);

  const operadores = useMemo(
    () =>
      (credencialesQ.data ?? []).filter(
        (c) => c.activo && c.usuarioActivo && c.idUsuario !== currentUserId
      ),
    [credencialesQ.data, currentUserId]
  );

  const procesando = loginNipMut.isPending || activarMut.isPending;

  const nombreOperador = (c) =>
    c.nombreCompleto?.trim() ||
    [c.nombres, c.apellidos].filter(Boolean).join(" ").trim() ||
    c.username ||
    `Usuario #${c.idUsuario}`;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!selected || !nip.trim() || procesando) return;
    setError("");

    try {
      const { token, usuario, tokenExpiraEn } = await loginNipMut.mutateAsync({
        idUsuario: selected.idUsuario,
        nip: nip.trim(),
      });

      setLogin(buildSessionUser(usuario), token, { tokenExpiraEn });

      if (idCaja) {
        try {
          await activarMut.mutateAsync({ idCaja, body: { nip: nip.trim() } });
        } catch {
          // best-effort: si no puede activar, igual se refresca la caja activa abajo
        }
      }

      qc.invalidateQueries({ queryKey: QK_MI_CAJA });
      onChanged?.(buildSessionUser(usuario));
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cambiar de cajero."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="size-4 text-(--color-pagina)" />
            Cambiar cajero
          </DialogTitle>
          <DialogDescription>
            {selected
              ? `Ingrese el NIP de ${nombreOperador(selected)} para tomar la caja.`
              : "Seleccione el cajero que tomará el control de esta caja."}
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {credencialesQ.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : credencialesQ.isError ? (
              <p className="text-sm text-(--color-rojo)">
                {getApiErrorMessage(credencialesQ.error, "No se pudieron cargar los operadores.")}
              </p>
            ) : operadores.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay otros operadores con credencial de caja activa.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {operadores.map((c) => (
                  <li key={c.idUsuario}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(c);
                        setNip("");
                        setError("");
                      }}
                      className="flex w-full items-center gap-3 rounded-lg border border-border bg-(--color-blanco) px-3 py-2.5 text-left transition-colors hover:bg-(--color-pagina)/5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--color-pagina-3) text-(--color-pagina)">
                        <UserRound className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-foreground">
                          {nombreOperador(c)}
                        </span>
                        {c.username ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {c.username}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <form onSubmit={handleConfirm}>
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-(--color-pagina-3)/40 px-3 py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--color-pagina) text-(--color-blanco)">
                  <UserRound className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">
                    {nombreOperador(selected)}
                  </span>
                  {selected.username ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {selected.username}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setNip("");
                    setError("");
                  }}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-(--color-pagina) hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  Cambiar
                </button>
              </div>

              <div>
                <Label htmlFor="nip-cajero" className="text-(--color-negro)">
                  NIP de caja
                </Label>
                <Input
                  id="nip-cajero"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  value={nip}
                  onChange={(e) => setNip(e.target.value.replace(/\D/g, ""))}
                  className="mt-1.5 border-(--color-gris-claro-2) focus-visible:ring-(--color-pagina)"
                  placeholder="••••"
                  autoFocus
                />
              </div>

              {error ? <p className="text-sm text-(--color-rojo)">{error}</p> : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={procesando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!nip.trim() || procesando}
                className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
              >
                <Lock className="mr-1.5 size-4" />
                {procesando ? "Cambiando…" : "Tomar caja"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
