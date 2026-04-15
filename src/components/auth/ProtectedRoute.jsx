import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/context/useAuthStore";

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        // Si no está logueado, lo mandamos al login
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;