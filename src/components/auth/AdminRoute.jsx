import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/context/useAuthStore";
import { esUsuarioAdmin } from "@/lib/authz";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/** Ruta protegida visible solo para usuarios con rol Administrador. */
export default function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);

  return (
    <ProtectedRoute>
      {esUsuarioAdmin(user) ? children : <Navigate to="/panel-control" replace />}
    </ProtectedRoute>
  );
}
