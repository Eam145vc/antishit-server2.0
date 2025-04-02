import { useState } from 'react';
import PlayerDetailsHoverCard from './PlayerDetailsHoverCard';

// Date formatting utility
const formatDistanceToNow = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'hace menos de un minuto';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(diffInSeconds / 86400);
  return `hace ${days} día${days !== 1 ? 's' : ''}`;
};

const PlayerStatusTable = ({ players, onPlayerSelect }) => {
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  // Verificar si el jugador realmente está conectado
  const isPlayerOnline = (player) => {
    const lastSeenDate = new Date(player.lastSeen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return player.isOnline && lastSeenDate > fiveMinutesAgo;
  };

  // Obtener estado del jugador
  const getPlayerStatus = (player) => {
    if (!isPlayerOnline(player)) return 'Desconectado';
    return player.isGameRunning ? 'Jugando' : 'Conectado';
  };

  // Obtener clase de estado
  const getStatusClass = (player) => {
    const status = getPlayerStatus(player);
    switch (status) {
      case 'Desconectado':
        return 'bg-gray-100 text-gray-800';
      case 'Jugando':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-warning-100 text-warning-800';
    }
  };

  return (
    <div className="relative">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Jugador
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Estado
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Canal
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Última Actividad
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {players.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                No hay jugadores activos
              </td>
            </tr>
          ) : (
            players.map((player) => {
              const isOnline = isPlayerOnline(player);
              const status = getPlayerStatus(player);
              
              return (
                <tr 
                  key={player._id} 
                  onMouseEnter={() => {
                    setHoveredPlayer(player);
                    onPlayerSelect && onPlayerSelect(player);
                  }}
                  onMouseLeave={() => {
                    setHoveredPlayer(null);
                    onPlayerSelect && onPlayerSelect(null);
                  }}
                  className="relative hover:bg-gray-50 transition-colors"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-success-500' : 'bg-gray-300'}`}></div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {player.activisionId}
                          {player.suspiciousActivity && (
                            <span 
                              className="text-danger-500 ml-2" 
                              title="Jugador marcado como sospechoso"
                            >
                              ⚠️
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusClass(player)}`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    Canal {player.currentChannelId}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {player.lastSeen
                      ? formatDistanceToNow(new Date(player.lastSeen))
                      : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <span className="text-primary-600 hover:text-primary-900">
                      Detalles
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Hover Details Card */}
      {hoveredPlayer && (
        <div className="absolute z-50 top-full left-0 mt-2 w-full pointer-events-none">
          <div className="flex justify-center">
            <PlayerDetailsHoverCard player={hoveredPlayer} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStatusTable;
