import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import HomePage from "./pages/dashboard/HomePage";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PanelControl from "./pages/dashboard/PanelControl";
import Usuarios from "./pages/usuarios/usuarios";
import Inventario from "./pages/inventario/Inventario";
import POS from "./pages/pos/Pos";
import Apertura from "./pages/pos/AperturaCaja";
import Ventas from "./pages/pos/VentasPos";
import Contabilidad from "./pages/contabilidad/Contabilidad";
import Compras from "./pages/compras/Compras";
import NuevaCompra from "./pages/compras/NuevaCompra";
import NuevoProducto from "./pages/producto/NuevoProducto";
import { useAuthStore } from "./context/useAuthStore";

function DefaultRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return (
    <Navigate to={isAuthenticated ? "/panel-control" : "/login"} replace />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <HomePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel-control"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PanelControl />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Usuarios />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Inventario />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nuevo-producto"
          element={
            <ProtectedRoute>
              <MainLayout>
                <NuevoProducto />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <MainLayout>
                <POS />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apertura"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Apertura />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Ventas />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/compras"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Compras />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/compras/nueva"
          element={
            <ProtectedRoute>
              <MainLayout>
                <NuevaCompra />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contabilidad"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Contabilidad />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
