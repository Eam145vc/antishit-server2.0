import { useState, useEffect } from 'react';
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
import PlayerStatusTable from './PlayerStatusTable';
import PlayerDetailsHoverCard from './PlayerDetailsHoverCard';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener estadísticas globales
        const statsResponse = await api.get('/monitor/stats');
        setStats(statsResponse.data);
        
        // Obtener jugadores
        const playersResponse = await api.get('/players');
        setPlayers(playersResponse.data);
        
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
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Anti-Cheat</h2>
        <p className="mt-1 text-sm text-gray-500">
          Monitoreo en tiempo real de jugadores y dispositivos
        </p>
      </div>
      
      {/* Estadísticas globales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="card">
          <div className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
              <UsersIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-base font-medium text-gray-900">Jugadores Activos</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.players.online || 0} <span className="text-sm text-gray-500">de {stats?.players.total || 0}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-100">
              <ShieldCheckIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-base font-medium text-gray-900">Jugando Ahora</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.players.playing || 0} <span className="text-sm text-gray-500">de {stats?.players.online || 0}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
              <DeviceTabletIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-base font-medium text-gray-900">Dispositivos</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.devices.total || 0} <span className="text-sm text-danger-500">{stats?.devices.byTrustLevel.suspicious || 0} sospechosos</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
              <CameraIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-base font-medium text-gray-900">Capturas</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.screenshots.last24h || 0} <span className="text-sm text-gray-500">últimas 24h</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
              <BellAlertIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-base font-medium text-gray-900">Alertas</h3>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Panel izquierdo */}
        <div className="space-y-6">
          {/* Distribución de dispositivos */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Dispositivos por Confiabilidad
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
        </div>
        
        {/* Panel derecho */}
        <div className="space-y-6">
          {/* Jugadores activos */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Jugadores Activos
              </h3>
            </div>
            <div className="card-body p-0">
              <PlayerStatusTable 
                players={players} 
                onPlayerSelect={setSelectedPlayer} 
              />
            </div>
          </div>
          
          {/* Detalles de jugador al pasar el ratón */}
          {selectedPlayer && (
            <div className="card">
              <PlayerDetailsHoverCard player={selectedPlayer} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
