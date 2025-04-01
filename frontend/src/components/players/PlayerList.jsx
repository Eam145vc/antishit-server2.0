import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cargar jugadores
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/players');
        setPlayers(response.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar jugadores');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
  }, []);
  
  // Filtrar jugadores
  useEffect(() => {
    const filtered = players.filter((player) => {
      const matchesSearch = !searchTerm || 
        player.activisionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filterStatus || 
        (filterStatus === 'online' && player.isOnline) ||
        (filterStatus === 'offline' && !player.isOnline) ||
        (filterStatus === 'playing' && player.isGameRunning);
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredPlayers(filtered);
  }, [players, searchTerm, filterStatus]);
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando jugadores...</p>
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
              Error al cargar jugadores
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
        <h2 className="text-2xl font-bold text-gray-900">Jugadores</h2>
        <p className="mt-1 text-sm text-gray-500">
          Lista de todos los jugadores registrados
        </p>
      </div>
      
      {/* Controles de filtro */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pr-10"
            />
          </div>
          
          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input"
          >
            <option value="">Todos los estados</option>
            <option value="online">En línea</option>
            <option value="offline">Desconectados</option>
            <option value="playing">Jugando</option>
          </select>
        </div>
        
        <div className="text-right text-sm text-gray-500">
          {filteredPlayers.length} jugadores
        </div>
      </div>
      
      {/* Lista de jugadores */}
      {filteredPlayers.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No hay jugadores que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Activision ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Nickname
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
              {filteredPlayers.map((player) => (
                <tr key={player._id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${player.isOnline ? 'bg-success-500' : 'bg-gray-300'}`}></div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          <Link to={`/players/${player._id}`} className="hover:text-primary-600">
                            {player.activisionId}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {player.nickname || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlayerList;