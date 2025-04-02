import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import PlayerList from './components/players/PlayerList';
import PlayerDetail from './components/players/PlayerDetail';
import DeviceList from './components/devices/DeviceList';
import DeviceDetail from './components/devices/DeviceDetail';
import ScreenshotGallery from './components/screenshots/ScreenshotGallery';
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

// Definición de rutas de la aplicación
const routes = [
  { path: '/', element: <Navigate to="/dashboard" /> },
  { path: '/login', element: <Login /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/players',
    element: (
      <ProtectedRoute>
        <PlayerList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/players/:id',
    element: (
      <ProtectedRoute>
        <PlayerDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/devices',
    element: (
      <ProtectedRoute>
        <DeviceList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/devices/:id',
    element: (
      <ProtectedRoute>
        <DeviceDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/screenshots',
    element: (
      <ProtectedRoute>
        <ScreenshotGallery />
      </ProtectedRoute>
    ),
  },
  {
    path: '/live-monitor',
    element: (
      <ProtectedRoute>
        <LiveMonitor />
      </ProtectedRoute>
    ),
  },
  {
    path: '/live-monitor/:channelId',
    element: (
      <ProtectedRoute>
        <LiveMonitor />
      </ProtectedRoute>
    ),
  },
  {
    path: '/alerts',
    element: (
      <ProtectedRoute>
        <Alerts />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute adminOnly={true}>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <NotFound /> },
];

export default routes;
