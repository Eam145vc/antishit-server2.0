import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [players, setPlayers] = useState([
    {
      _id: 'testeo',
      activisionId: 'testeo',
      isOnline: true,
      isGameRunning: false,
      currentChannelId: 1,
      lastSeen: new Date(),
      suspiciousActivity: false
    },
    {
      _id: 'parchado',
      activisionId: 'parchado',
      isOnline: false,
      isGameRunning: false,
      currentChannelId: 0,
      lastSeen: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      suspiciousActivity: false
    },
    {
      _id: 'testei',
      activisionId: 'testei',
      isOnline: false,
      isGameRunning: false,
      currentChannelId: 0,
      lastSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      suspiciousActivity: false
    },
    {
      _id: 'zKaos#241238',
      activisionId: 'zKaos#241238',
      isOnline: false,
      isGameRunning: false,
      currentChannelId: 0,
      lastSeen: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      suspiciousActivity: false
    }
  ]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Formatear tiempo transcurrido
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
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

  return (
    <div className="p-4">
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Jugadores Activos</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="p-2">Jugador</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Canal</th>
              <th className="p-2">Última Actividad</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr 
                key={player._id} 
                className="border-b hover:bg-gray-50"
                onMouseEnter={() => setSelectedPlayer(player)}
                onMouseLeave={() => setSelectedPlayer(null)}
              >
                <td className="p-2 flex items-center">
                  <span 
                    className={`h-2 w-2 rounded-full mr-2 ${
                      player.isOnline ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  ></span>
                  <span>{player.activisionId}</span>
                  {player.suspiciousActivity && (
                    <span className="ml-2 text-red-500">⚠️</span>
                  )}
                </td>
                <td className="p-2">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs ${
                      !player.isOnline
                        ? 'bg-gray-100 text-gray-800'
                        : player.isGameRunning
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {!player.isOnline ? 'Desconectado' : (player.isGameRunning ? 'Jugando' : 'Conectado')}
                  </span>
                </td>
                <td className="p-2">Canal {player.currentChannelId}</td>
                <td className="p-2">{formatTimeAgo(player.lastSeen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Información detallada del jugador al pasar el ratón */}
      {selectedPlayer && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-64">
          <h3 className="text-lg font-semibold mb-2">{selectedPlayer.activisionId}</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-500">Estado:</span>{' '}
              {!selectedPlayer.isOnline ? 'Desconectado' : (selectedPlayer.isGameRunning ? 'Jugando' : 'Conectado')}
            </div>
            <div>
              <span className="text-gray-500">Canal:</span>{' '}
              {selectedPlayer.currentChannelId}
            </div>
            <div>
              <span className="text-gray-500">Última Actividad:</span>{' '}
              {formatTimeAgo(selectedPlayer.lastSeen)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
