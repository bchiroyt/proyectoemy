import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import HomePage from "./pages/dashboard/HomePage"; // Tu nueva página de inicio
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PanelControl from "./pages/dashboard/PanelControl";
import Usuarios from "./pages/usuarios/usuarios";
import Inventario from "./pages/inventario/Inventario";
import POS from "./pages/pos/Pos";
import Apertura from "./pages/pos/AperturaCaja";
import Ventas from "./pages/pos/VentasPos";
import Contabilidad from "./pages/contabilidad/Contabilidad";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Privadas (Protegidas y con Layout) */}
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
          path="/contabilidad"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Contabilidad />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;