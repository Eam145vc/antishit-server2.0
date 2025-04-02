import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  DeviceTabletIcon, 
  ComputerDesktopIcon, 
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';

const PlayerStatusTable = ({ players }) => {
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
    <div className="overflow-hidden">
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
                <tr key={player._id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-success-500' : 'bg-gray-300'}`}></div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <Link 
                            to={`/players/${player._id}`} 
                            className="hover:text-primary-600 mr-2"
                          >
                            {player.activisionId}
                          </Link>
                          {player.suspiciousActivity && (
                            <ShieldExclamationIcon 
                              className="h-4 w-4 text-danger-500" 
                              title="Jugador marcado como sospechoso" 
                            />
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
                      ? formatDistanceToNow(new Date(player.lastSeen), {
                          addSuffix: true,
                          locale: es
                        })
                      : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      to={`/players/${player._id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Detalles
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerStatusTable;
