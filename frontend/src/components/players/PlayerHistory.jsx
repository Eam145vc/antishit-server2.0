import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PlayerHistory = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Cargar todos los jugadores
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        
        const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Sesión expirada');
          return;
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        
        // Forma directa de hacer la solicitud para evitar problemas con interceptores
        console.log('Solicitando jugadores desde URL:', `${apiUrl}/players`);
        const response = await axios({
          method: 'GET',
          url: `${apiUrl}/players`,
          headers
        });
        
        console.log('Respuesta de jugadores:', response);
        
        if (!response.data) {
          throw new Error('No se recibieron datos de jugadores');
        }
        
        setPlayers(response.data);
        setFilteredPlayers(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar jugadores:', err);
        setError(`Error al cargar jugadores: ${err.message}`);
        toast.error('Error al cargar lista de jugadores');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
  }, []);

  // Cargar historial de sesiones de un jugador específico
  const fetchPlayerSessions = async (playerId) => {
    if (!playerId) return;
    
    try {
      setIsSessionLoading(true);
      setSessionError(null);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        setSessionError('Sesión expirada');
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      console.log('Solicitando historial desde URL:', `${apiUrl}/players/${playerId}/history`);
      
      // Forma directa de hacer la solicitud para evitar problemas con interceptores
      const response = await axios({
        method: 'GET',
        url: `${apiUrl}/players/${playerId}/history`,
        headers
      });
      
      console.log('Respuesta de historial:', response);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Formato de respuesta inválido para historial');
      }
      
      // Procesar datos para mostrar sesiones
      const sessionData = response.data.map(data => {
        // Verificar si los campos necesarios existen para evitar errores
        return {
          _id: data._id || `temp-${Date.now()}`,
          timestamp: data.timestamp || new Date().toISOString(),
          isGameRunning: data.isGameRunning || false,
          channelId: data.channelId || 0,
          processes: Array.isArray(data.processes) ? data.processes.length : 0,
          usbDevices: Array.isArray(data.usbDevices) ? data.usbDevices.length : 0
        };
      });
      
      setSessions(sessionData);
      setSessionError(null);
    } catch (err) {
      console.error('Error al cargar historial del jugador:', err);
      setSessionError(`Error al cargar historial: ${err.message}`);
      setSessions([]);
      toast.error('Error al cargar historial del jugador');
    } finally {
      setIsSessionLoading(false);
      setIsRefreshing(false);
    }
  };

  // Aplicar filtros a la lista de jugadores
  useEffect(() => {
    let filtered = [...players];
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(player => 
        player.activisionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por fecha de última actividad
    if (dateFilter.startDate) {
      const startDate = new Date(dateFilter.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(player => new Date(player.lastSeen) >= startDate);
    }
    
    if (dateFilter.endDate) {
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(player => new Date(player.lastSeen) <= endDate);
    }
    
    setFilteredPlayers(filtered);
  }, [players, searchTerm, dateFilter]);

  // Manejar selección de jugador
  const handleSelectPlayer = (player) => {
    console.log('Jugador seleccionado:', player);
    setSelectedPlayer(player);
    fetchPlayerSessions(player._id);
  };

  // Manejar actualización de datos
  const handleRefresh = () => {
    if (selectedPlayer) {
      setIsRefreshing(true);
      fetchPlayerSessions(selectedPlayer._id);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: es });
    } catch (err) {
      console.error('Error al formatear fecha:', err);
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Historial de Jugadores</h2>
        <p className="mt-1 text-sm text-gray-500">
          Consulta el historial de actividad para análisis forense
        </p>
      </div>
      
      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por ID</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar jugador..."
              className="form-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
              className="form-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
              className="form-input"
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="rounded-md bg-danger-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-danger-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-danger-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Grid de contenido principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lista de jugadores */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">Jugadores</h3>
              <span className="text-xs text-gray-500">{filteredPlayers.length} jugadores</span>
            </div>
            <div className="card-body p-0">
              {isLoading ? (
                <div className="p-6 flex justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No se encontraron jugadores
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                  {filteredPlayers.map(player => (
                    <button
                      key={player._id}
                      className={`w-full block text-left px-4 py-3 hover:bg-gray-50 ${
                        selectedPlayer?._id === player._id ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => handleSelectPlayer(player)}
                    >
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          player.isOnline ? 'bg-success-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{player.activisionId}</div>
                          <div className="text-xs text-gray-500">
                            Última actividad: {formatDate(player.lastSeen)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Historial de sesiones */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">
                {selectedPlayer ? `Historial de ${selectedPlayer.activisionId}` : 'Historial de Sesiones'}
              </h3>
              <button
                onClick={handleRefresh}
                disabled={!selectedPlayer || isRefreshing || isSessionLoading}
                className={`text-sm text-primary-600 hover:text-primary-800 flex items-center ${
                  !selectedPlayer ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 ${isRefreshing || isSessionLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
            <div className="card-body p-0">
              {!selectedPlayer ? (
                <div className="p-6 text-center text-gray-500">
                  Selecciona un jugador para ver su historial
                </div>
              ) : isSessionLoading ? (
                <div className="p-6 flex justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                </div>
              ) : sessionError ? (
                <div className="p-6 text-center text-danger-600">
                  {sessionError}
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay datos de sesión disponibles
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procesos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USB Dispositivos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.map(session => (
                        <tr key={session._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(session.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Canal {session.channelId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              session.isGameRunning 
                                ? 'bg-success-100 text-success-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.isGameRunning ? 'Jugando' : 'Conectado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.processes}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.usbDevices}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              to={`/monitor/${session._id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Ver detalles
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHistory;
