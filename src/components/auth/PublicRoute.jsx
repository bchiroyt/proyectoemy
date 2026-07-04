import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/context/useAuthStore";

const PublicRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (isAuthenticated) {
        // Si ya está logueado, lo mandamos al panel principal en lugar del login
        return <Navigate to="/panel-control" replace />;
    }

    return children;
};

export default PublicRoute;
