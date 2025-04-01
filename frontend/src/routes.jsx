import { Navigate } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import PlayerList from './components/players/PlayerList';
import PlayerDetail from './components/players/PlayerDetail';
import DeviceList from './components/devices/DeviceList';
import DeviceDetail from './components/devices/DeviceDetail';
import ScreenshotGallery from './components/screenshots/ScreenshotGallery';
import ScreenshotDetail from './components/screenshots/ScreenshotDetail';
import LiveMonitor from './components/monitor/LiveMonitor';
import Alerts from './components/alerts/Alerts';
import TournamentList from './components/tournaments/TournamentList';
import TournamentDetail from './components/tournaments/TournamentDetail';
import UserManagement from './components/admin/UserManagement';
import NotFound from './components/layout/NotFound';
import HWIDAnalyzer from './components/players/HWIDAnalyzer';
import DevicesByType from './components/devices/DevicesByType';
import Profile from './components/auth/Profile';

// Rutas Protegidas
const ProtectedRoute = ({ children, adminOnly = false }) => {
  // Implementación simplificada, la autenticación real usará el contexto
  const isAuthenticated = true; // localStorage.getItem('token') !== null;
  const userRole = 'admin'; // obtener de localStorage o mejor del contexto
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && userRole !== 'admin') {
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
    path: '/players/hwid-analysis',
    element: (
      <ProtectedRoute>
        <HWIDAnalyzer />
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
    path: '/devices/by-type/:type',
    element: (
      <ProtectedRoute>
        <DevicesByType />
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
    path: '/screenshots/:id',
    element: (
      <ProtectedRoute>
        <ScreenshotDetail />
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
    path: '/tournaments',
    element: (
      <ProtectedRoute>
        <TournamentList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tournaments/:id',
    element: (
      <ProtectedRoute>
        <TournamentDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute adminOnly>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <NotFound /> },
];

export default routes;