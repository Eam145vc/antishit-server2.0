import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    players: {
      total: 4,
      online: 1,
      playing: 0
    },
    devices: {
      total: 265,
      byTrustLevel: {
        trusted: 92,
        unknown: 131,
        external: 42,
        suspicious: 0
      }
    },
    screenshots: {
      last24h: 0
    }
  });
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
  const [suspiciousDevices] = useState([
    {
      name: 'Puerto del conmutador de canal de baja PCI Express',
      type: 'Desconocido',
      player: { activisionId: 'testeo', currentChannelId: 1 }
    },
    {
      name: 'AMD PPM Provisioning File',
      type: 'Desconocido',
      player: { activisionId: 'testeo', currentChannelId: 1 }
    },
    {
      name: 'Concentrador raíz USB (USB 3.0)',
      type: 'Externo',
      player: { activisionId: 'testeo', currentChannelId: 1 }
    },
    {
      name: 'VB-Audio VoiceMeeter VAIO',
      type: 'Desconocido',
      player: { activisionId: 'testeo', currentChannelId: 1 }
    }
  ]);

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

  // Determinar estado del jugador
  const getPlayerStatus = (player) => {
    if (!player.isOnline) return 'Desconectado';
    return player.isGameRunning ? 'Jugando' : 'Conectado';
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Anti-Cheat</h2>
        <p className="mt-1 text-sm text-gray-500">
          Monitoreo en tiempo real de jugadores y dispositivos
        </p>
      </div>
      
      {/* Estadísticas globales */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Jugadores Activos</div>
          <div className="text-2xl font-bold">{stats.players.online} <span className="text-sm text-gray-500">de {stats.players.total}</span></div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Jugando Ahora</div>
          <div className="text-2xl font-bold">{stats.players.playing} <span className="text-sm text-gray-500">de {stats.players.online}</span></div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Dispositivos</div>
          <div className="text-2xl font-bold">{stats.devices.total} <span className="text-sm text-red-500">{stats.devices.byTrustLevel.suspicious} sospechosos</span></div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Capturas</div>
          <div className="text-2xl font-bold">{stats.screenshots.last24h} <span className="text-sm text-gray-500">últimas 24h</span></div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Alertas</div>
          <div className="text-2xl font-bold">0</div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="grid grid-cols-2 gap-6">
        {/* Panel de Distribución de Dispositivos */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Dispositivos por Confiabilidad</h3>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.devices.byTrustLevel.trusted}</div>
              <div className="text-sm text-gray-500">Confiables</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.devices.byTrustLevel.unknown}</div>
              <div className="text-sm text-gray-500">Desconocidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.devices.byTrustLevel.external}</div>
              <div className="text-sm text-gray-500">Externos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800">{stats.devices.byTrustLevel.suspicious}</div>
              <div className="text-sm text-gray-500">Sospechosos</div>
            </div>
          </div>
        </div>
        
        {/* Panel de Jugadores Activos */}
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
                      {getPlayerStatus(player)}
                    </span>
                  </td>
                  <td className="p-2">Canal {player.currentChannelId}</td>
                  <td className="p-2">{formatTimeAgo(player.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Dispositivos Sospechosos */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Dispositivos Sospechosos</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="p-2">Nombre</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Jugador</th>
              <th className="p-2">Canal</th>
            </tr>
          </thead>
          <tbody>
            {suspiciousDevices.map((device, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{device.name}</td>
                <td className="p-2">{device.type}</td>
                <td className="p-2">{device.player.activisionId}</td>
                <td className="p-2">Canal {device.player.currentChannelId}</td>
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
              {getPlayerStatus(selectedPlayer)}
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
