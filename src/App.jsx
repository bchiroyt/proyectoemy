import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import GestionCategorias from "./pages/inventario/GestionCategoria";// --- Importaciones de la versión antigua ---
import GestionMarcas from "./pages/inventario/GestionMarca";
import Gestionubicaciones from "./pages/inventario/GestionUbicacion";
import Gestiontallas from "./pages/inventario/GestionTalla";
import Gestionpresentaciones from "./pages/inventario/GestionPresentacion";
import ReporteStock from "./pages/inventario/ReporteStock";
import Proveedores from "./pages/inventario/Proveedores";

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
        {/* Ruta Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas con Layout */}
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
                <Outlet />
              </MainLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<POS />} />
          <Route path="apertura" element={<Apertura />} />
          <Route path="ventas" element={<Ventas />} />
        </Route>
        <Route
          path="/apertura"
          element={<Navigate to="/pos/apertura" replace />}
        />
        <Route
          path="/ventas"
          element={<Navigate to="/pos/ventas" replace />}
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

        {/* --- Rutas Integradas de la versión antigua --- */}
        <Route
          path="/inventario/categorias"
          element={
            <ProtectedRoute>
              <MainLayout>
                <GestionCategorias />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario/marcas"
          element={
            <ProtectedRoute>
              <MainLayout>
                <GestionMarcas />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario/ubicaciones"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Gestionubicaciones />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario/tallas"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Gestiontallas />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario/presentaciones"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Gestionpresentaciones />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario/reporte-stock"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReporteStock />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario/proveedores"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Proveedores />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;