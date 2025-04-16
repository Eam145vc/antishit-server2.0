import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { UserIcon, UsersIcon, DeviceTabletIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import StatsCard from './StatsCard';
import ChannelPlayersCard from './ChannelPlayersCard';
import RecentAlertsCard from './RecentAlertsCard';
import { useSocket } from '../../context/SocketContext';

const Dashboard = () => {
  const { connected } = useSocket();
  const [stats, setStats] = useState({
    players: { total: 0, online: 0, playing: 0 },
    devices: { total: 0, byTrustLevel: {}, byType: {} },
    screenshots: { total: 0, last24h: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Cargar estadísticas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        
        try {
          const statsResponse = await axios.get(`${apiUrl}/monitor/stats`, { headers });
          
          if (statsResponse.data) {
            setStats(statsResponse.data);
          }
        } catch (statsError) {
          console.warn('No se pudieron cargar estadísticas detalladas', statsError);
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
    
    // Actualizar datos cada 60 segundos
    const intervalId = setInterval(fetchStats, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Monitoreo en tiempo real del sistema Anti-Cheat
        </p>
      </div>
      
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Jugadores"
          value={stats.players.online}
          valueDetail={`de ${stats.players.total}`}
          icon={UsersIcon}
          color="primary"
          href="/players"
        />
        <StatsCard
          title="Jugando"
          value={stats.players.playing}
          valueDetail={`de ${stats.players.online} conectados`}
          icon={UserIcon}
          color="success"
          href="/live-monitor"
        />
        <StatsCard
          title="Capturas"
          value={stats.screenshots.last24h}
          valueDetail={`últimas 24h`}
          icon={DeviceTabletIcon}
          color="warning"
          href="/screenshots"
        />
        <StatsCard
          title="Dispositivos"
          value={stats.devices.byTrustLevel?.suspicious || 0}
          valueDetail="sospechosos"
          icon={BellAlertIcon}
          color="danger"
          href="/alerts"
        />
      </div>
      
      {/* Estado de conexión en tiempo real */}
      {!connected && (
        <div className="rounded-md bg-warning-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <BellAlertIcon className="h-5 w-5 text-warning-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">
                Sin conexión en tiempo real
              </h3>
              <div className="mt-2 text-sm text-warning-700">
                Las actualizaciones en tiempo real no están disponibles. Los datos pueden no estar actualizados.
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido principal del dashboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Jugadores por canal */}
        <div className="lg:col-span-1">
          <ChannelPlayersCard />
        </div>
        
        {/* Alertas recientes */}
        <div className="lg:col-span-1">
          <RecentAlertsCard />
        </div>
      </div>
      
      {/* Enlaces rápidos */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 text-center">
            <UserIcon className="h-8 w-8 mx-auto text-primary-600 mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Monitoreo en Vivo</h3>
            <p className="text-sm text-gray-500 mb-4">Supervisa jugadores en tiempo real</p>
            <Link to="/live-monitor" className="btn-primary text-xs">
              Ir a Monitoreo
            </Link>
          </div>
        </div>
        
        <div className="card shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 text-center">
            <DeviceTabletIcon className="h-8 w-8 mx-auto text-warning-600 mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Historial de Capturas</h3>
            <p className="text-sm text-gray-500 mb-4">Ver capturas de pantalla</p>
            <Link to="/screenshots" className="btn-primary text-xs">
              Ver Capturas
            </Link>
          </div>
        </div>
        
        <div className="card shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 text-center">
            <BellAlertIcon className="h-8 w-8 mx-auto text-danger-600 mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Alertas</h3>
            <p className="text-sm text-gray-500 mb-4">Ver todas las notificaciones</p>
            <Link to="/alerts" className="btn-primary text-xs">
              Ver Alertas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
