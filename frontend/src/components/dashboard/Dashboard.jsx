import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { UserIcon, UsersIcon, DeviceTabletIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import StatsCard from './StatsCard';

const Dashboard = () => {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState({
    players: { total: 0, online: 0, playing: 0 },
    devices: { total: 0, byTrustLevel: {}, byType: {} },
    screenshots: { total: 0, last24h: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar estadísticas y jugadores activos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener estadísticas generales
        const statsResponse = await axios.get('/api/monitor/stats');
        setStats(statsResponse.data);
        
        // Obtener jugadores activos
        const playersResponse = await axios.get('/api/players');
        const activePlayers = playersResponse.data.filter(player => {
          // Verificar si el jugador está realmente online
          const lastSeenDate = new Date(player.lastSeen);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          return player.isOnline && lastSeenDate > fiveMinutesAgo;
        });
        
        setPlayers(activePlayers);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar datos del dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Actualizar datos cada 60 segundos
    const intervalId = setInterval(fetchData, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general del sistema Anti-Cheat
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
          title="Dispositivos"
          value={stats.devices.total}
          valueDetail={`${stats.devices.byTrustLevel.suspicious || 0} sospechosos`}
          icon={DeviceTabletIcon}
          color="warning"
          href="/devices"
        />
        <StatsCard
          title="Alertas"
          value={stats.alerts?.total || 0}
          valueDetail={`${stats.alerts?.high || 0} críticas`}
          icon={BellAlertIcon}
          color="danger"
          href="/alerts"
        />
      </div>
      
      {/* Jugadores activos */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Jugadores Activos</h3>
          <Link to="/players" className="text-sm text-blue-600 hover:underline">Ver todos</Link>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Cargando jugadores...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-danger-600">
            {error}
          </div>
        ) : players.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay jugadores activos en este momento
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="p-2">JUGADOR</th>
                <th className="p-2">ESTADO</th>
                <th className="p-2">CANAL</th>
                <th className="p-2">ÚLTIMA ACTIVIDAD</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => {
                // Calcular tiempo relativo de última actividad
                const lastSeen = new Date(player.lastSeen);
                const now = new Date();
                const diffInSeconds = Math.floor((now - lastSeen) / 1000);
                
                let lastActivity = 'hace menos de un minuto';
                if (diffInSeconds >= 60 && diffInSeconds < 3600) {
                  const minutes = Math.floor(diffInSeconds / 60);
                  lastActivity = `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
                } else if (diffInSeconds >= 3600 && diffInSeconds < 86400) {
                  const hours = Math.floor(diffInSeconds / 3600);
                  lastActivity = `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
                } else if (diffInSeconds >= 86400) {
                  const days = Math.floor(diffInSeconds / 86400);
                  lastActivity = `hace ${days} día${days !== 1 ? 's' : ''}`;
                }
                
                return (
                  <tr key={player._id} className="border-b hover:bg-gray-50">
                    <td className="p-2 flex items-center">
                      <span 
                        className={`h-2 w-2 rounded-full mr-2 ${
                          player.isOnline ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      ></span>
                      <Link to={`/players/${player._id}`} className="hover:text-primary-600">
                        {player.activisionId}
                      </Link>
                    </td>
                    <td className="p-2">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs ${
                          !player.isOnline
                            ? 'bg-gray-100 text-gray-800'
                            : player.isGameRunning
                            ? 'bg-success-100 text-success-800'
                            : 'bg-warning-100 text-warning-800'
                        }`}
                      >
                        {!player.isOnline
                          ? 'Desconectado'
                          : player.isGameRunning
                          ? 'Jugando'
                          : 'Conectado'}
                      </span>
                    </td>
                    <td className="p-2">Canal {player.currentChannelId}</td>
                    <td className="p-2">{lastActivity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
