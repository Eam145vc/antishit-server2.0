import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  UsersIcon,
  DeviceTabletIcon,
  CameraIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import StatsCard from './StatsCard';
import PlayerStatusTable from './PlayerStatusTable';
import DeviceStatusPanel from './DeviceStatusPanel';
import RecentAlertsList from './RecentAlertsList';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [suspiciousDevices, setSuspiciousDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener estadísticas
        const statsResponse = await api.get('/monitor/stats');
        setStats(statsResponse.data);
        
        // Obtener jugadores activos
        const playersResponse = await api.get('/players');
        setPlayers(playersResponse.data);
        
        // Obtener alertas recientes
        const alertsResponse = await api.get('/alerts?limit=5');
        setRecentAlerts(alertsResponse.data);
        
        // Obtener dispositivos sospechosos
        const devicesResponse = await api.get('/devices/suspicious');
        setSuspiciousDevices(devicesResponse.data);
        
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos del dashboard');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Recargar datos cada 60 segundos
    const intervalId = setInterval(fetchDashboardData, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Datos para el gráfico de dispositivos
  const deviceChartData = {
    labels: ['Confiables', 'Desconocidos', 'Externos', 'Sospechosos'],
    datasets: [
      {
        data: stats ? [
          stats.devices.byTrustLevel.trusted,
          stats.devices.byTrustLevel.unknown,
          stats.devices.byTrustLevel.external,
          stats.devices.byTrustLevel.suspicious
        ] : [0, 0, 0, 0],
        backgroundColor: [
          '#22c55e', // Verde (confiable)
          '#f59e0b', // Amarillo (desconocido)
          '#ef4444', // Rojo (externo)
          '#7f1d1d'  // Rojo oscuro (sospechoso)
        ],
        borderWidth: 0,
      },
    ],
  };
  
  // Configuración para el gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    },
    cutout: '70%'
  };
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-danger-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon 
              className="h-5 w-5 text-danger-400" 
              aria-hidden="true" 
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-danger-800">
              Error al cargar el dashboard
            </h3>
            <div className="mt-2 text-sm text-danger-700">{error}</div>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-danger-50 px-2 py-1.5 text-sm font-medium text-danger-800 hover:bg-danger-100"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Resumen del sistema de monitoreo Anti-Cheat
        </p>
      </div>
      
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatsCard
          title="Jugadores Activos"
          value={stats?.players.online || 0}
          total={stats?.players.total || 0}
          icon={UsersIcon}
          color="primary"
          href="/players"
        />
        <StatsCard
          title="Jugando Ahora"
          value={stats?.players.playing || 0}
          total={stats?.players.online || 0}
          icon={ShieldCheckIcon}
          color="success"
          href="/live-monitor"
        />
        <StatsCard
          title="Dispositivos"
          value={stats?.devices.total || 0}
          valueDetail={`${stats?.devices.byTrustLevel.suspicious || 0} sospechosos`}
          icon={DeviceTabletIcon}
          color={stats?.devices.byTrustLevel.suspicious > 0 ? "warning" : "primary"}
          href="/devices"
        />
        <StatsCard
          title="Capturas"
          value={stats?.screenshots.last24h || 0}
          valueDetail="últimas 24h"
          icon={CameraIcon}
          color="primary"
          href="/screenshots"
        />
        <StatsCard
          title="Alertas"
          value={recentAlerts.length}
          valueDetail="recientes"
          icon={BellAlertIcon}
          color={recentAlerts.length > 0 ? "danger" : "primary"}
          href="/alerts"
        />
      </div>
      
      {/* Contenido principal del dashboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Panel izquierdo */}
        <div className="space-y-6">
          {/* Jugadores activos */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Jugadores Activos
              </h3>
              <Link
                to="/players"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Ver todos
              </Link>
            </div>
            <div className="card-body p-0">
              <PlayerStatusTable players={players.slice(0, 5)} />
            </div>
          </div>
          
          {/* Dispositivos sospechosos */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Dispositivos Sospechosos
              </h3>
              <Link
                to="/devices/suspicious"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Ver todos
              </Link>
            </div>
            <div className="card-body">
              <DeviceStatusPanel devices={suspiciousDevices.slice(0, 5)} />
            </div>
          </div>
        </div>
        
        {/* Panel derecho */}
        <div className="space-y-6">
          {/* Distribución de dispositivos */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Distribución de Dispositivos
              </h3>
            </div>
            <div className="card-body">
              <div className="h-64">
                <Doughnut data={deviceChartData} options={chartOptions} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">
                    {stats?.devices.byTrustLevel.trusted || 0}
                  </div>
                  <div className="text-xs text-gray-500">Confiables</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600">
                    {stats?.devices.byTrustLevel.unknown || 0}
                  </div>
                  <div className="text-xs text-gray-500">Desconocidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger-600">
                    {stats?.devices.byTrustLevel.external || 0}
                  </div>
                  <div className="text-xs text-gray-500">Externos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger-800">
                    {stats?.devices.byTrustLevel.suspicious || 0}
                  </div>
                  <div className="text-xs text-gray-500">Sospechosos</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alertas recientes */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Alertas Recientes
              </h3>
              <Link
                to="/alerts"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Ver todas
              </Link>
            </div>
            <div className="card-body">
              <RecentAlertsList alerts={recentAlerts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
