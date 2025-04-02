import { useState } from 'react';

const Dashboard = () => {
  const [players] = useState([
    {
      _id: 'testeo',
      activisionId: 'testeo',
      status: 'Conectado',
      channel: 1,
      lastActivity: 'hace menos de un minuto'
    },
    {
      _id: 'parchado',
      activisionId: 'parchado',
      status: 'Desconectado',
      channel: 0,
      lastActivity: 'hace 4 días'
    },
    {
      _id: 'testei',
      activisionId: 'testei',
      status: 'Desconectado',
      channel: 0,
      lastActivity: 'hace 5 días'
    },
    {
      _id: 'zKaos#241238',
      activisionId: 'zKaos#241238',
      status: 'Desconectado',
      channel: 0,
      lastActivity: 'hace 6 días'
    }
  ]);

  return (
    <div className="p-4">
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Jugadores Activos</h3>
          <a href="#" className="text-sm text-blue-600 hover:underline">Ver todos</a>
        </div>
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
            {players.map(player => (
              <tr key={player._id} className="border-b hover:bg-gray-50">
                <td className="p-2 flex items-center">
                  <span 
                    className={`h-2 w-2 rounded-full mr-2 ${
                      player.status === 'Conectado' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  ></span>
                  <span>{player.activisionId}</span>
                </td>
                <td className="p-2">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs ${
                      player.status === 'Conectado'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {player.status}
                  </span>
                </td>
                <td className="p-2">Canal {player.channel}</td>
                <td className="p-2">{player.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
