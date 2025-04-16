import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import PlayerList from './components/players/PlayerList';
import PlayerDetail from './components/players/PlayerDetail';
import PlayerHistory from './components/players/PlayerHistory';
import DeviceList from './components/devices/DeviceList';
import DeviceDetail from './components/devices/DeviceDetail';
import ScreenshotGallery from './components/screenshots/ScreenshotGallery';
import ScreenshotDetail from './components/screenshots/ScreenshotDetail';
import LiveMonitor from './components/monitor/LiveMonitor';
import Alerts from './components/alerts/Alerts';
import NotFound from './components/layout/NotFound';
import Profile from './components/auth/Profile';
import UserManagement from './components/admin/UserManagement';

// Rutas Protegidas
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  // Mostrar carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Si requiere admin y no es admin, redirigir a dashboard
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/players" 
        element={
          <ProtectedRoute>
            <PlayerList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/players/history" 
        element={
          <ProtectedRoute>
            <PlayerHistory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/players/:id" 
        element={
          <ProtectedRoute>
            <PlayerDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/devices" 
        element={
          <ProtectedRoute>
            <DeviceList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/devices/by-type/:type" 
        element={
          <ProtectedRoute>
            <DeviceList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/devices/:id" 
        element={
          <ProtectedRoute>
            <DeviceDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/screenshots" 
        element={
          <ProtectedRoute>
            <ScreenshotGallery />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/screenshots/:id" 
        element={
          <ProtectedRoute>
            <ScreenshotDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/live-monitor" 
        element={
          <ProtectedRoute>
            <LiveMonitor />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/live-monitor/:channelId" 
        element={
          <ProtectedRoute>
            <LiveMonitor />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/alerts" 
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute adminOnly={true}>
            <UserManagement />
          </ProtectedRoute>
        } 
      />
      {/* Ruta para capturar todas las rutas no definidas */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
