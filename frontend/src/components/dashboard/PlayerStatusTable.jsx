// src/components/dashboard/PlayerStatusTable.jsx
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PlayerStatusTable = ({ players }) => {
  const { requestScreenshot } = useSocket();
  
  // Manejar solicitud de captura
  const handleRequestScreenshot = (playerId, activisionId, channelId) => {
    requestScreenshot(activisionId, channelId);
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
            players.map((player) => (
              <tr key={player._id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        <Link to={`/players/${player._id}`} className="hover:text-primary-600">
                          {player.activisionId}
                        </Link>
                      </div>
                      {player.nickname && (
                        <div className="text-xs text-gray-500">{player.nickname}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      player.isGameRunning
                        ? 'bg-success-100 text-success-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {player.isGameRunning ? 'Jugando' : 'Conectado'}
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
                  <button
                    onClick={() => 
                      handleRequestScreenshot(
                        player._id, 
                        player.activisionId, 
                        player.currentChannelId
                      )
                    }
                    className="text-primary-600 hover:text-primary-900"
                  >
                    Capturar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerStatusTable;