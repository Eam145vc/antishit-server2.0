import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import ChannelSelector from './ChannelSelector';
import PlayerMonitorCard from './PlayerMonitorCard';
import toast from 'react-hot-toast';

const LiveMonitor = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { socket, connected, joinChannel, leaveChannel } = useSocket();
  
  const [players, setPlayers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(channelId ? parseInt(channelId) : null);
  
  // Obtener canales disponibles
  useEffect(() => {
    const fetchChannels = async () => {
      // Usar canales predeterminados en lugar de intentar obtenerlos de la API
      const defaultChannels = [
        { id: 1, name: 'Canal 1' },
        { id: 2, name: 'Canal 2' },
        { id: 3, name: 'Canal 3' },
        { id: 4, name: 'Canal 4' },
        { id: 5, name: 'Canal 5' },
      ];
      
      setChannels(defaultChannels);
      
      // Si no hay canal seleccionado, seleccionar el primero
      if (!selectedChannel) {
        setSelectedChannel(1);
        navigate('/live-monitor/1', { replace: true });
      }
    };
    
    fetchChannels();
  }, [selectedChannel, navigate]);
  
  // Obtener jugadores del canal seleccionado
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!selectedChannel) return;
      
      setIsLoading(true);
      
      try {
        // Usar URL base de la configuración
        const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Sesión expirada, por favor inicie sesión nuevamente');
          navigate('/login');
          return;
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        
        const response = await axios.get(`${apiUrl}/players/channel/${selectedChannel}`, { headers });
        console.log('Jugadores del canal obtenidos:', response.data);
        setPlayers(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar jugadores del canal:', err);
        setError('Error al cargar jugadores del canal');
        setPlayers([]); // Asegurarse de que se muestre "No hay jugadores" si hay error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
    
    // Configurar intervalo para actualización periódica
    const intervalId = setInterval(fetchPlayers, 30000); // Cada 30 segundos
    
    return () => clearInterval(intervalId);
  }, [selectedChannel, navigate]);
  
  // Configurar socket para el canal seleccionado
  useEffect(() => {
    if (!connected || !selectedChannel) return;
    
    // Unirse al canal seleccionado
    joinChannel(selectedChannel);
    
    // Escuchar actualizaciones de monitoreo
    const handleMonitorUpdate = (data) => {
      setPlayers((currentPlayers) => {
        // Buscar si el jugador ya existe en la lista
        const playerIndex = currentPlayers.findIndex(
          (p) => p.activisionId === data.activisionId
        );
        
        // Si existe, actualizar sus datos
        if (playerIndex >= 0) {
          const updatedPlayers = [...currentPlayers];
          updatedPlayers[playerIndex] = {
            ...updatedPlayers[playerIndex],
            isOnline: true,
            isGameRunning: data.isGameRunning,
            lastSeen: data.lastSeen || new Date(),
          };
          return updatedPlayers;
        }
        
        // Si es un jugador nuevo, solicitar los datos completos
        if (data.isNewPlayer) {
          const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
          const token = localStorage.getItem('token');
          
          if (!token) return currentPlayers;
          
          const headers = {
            'Authorization': `Bearer ${token}`
          };
          
          axios
            .get(`${apiUrl}/players/activision/${data.activisionId}`, { headers })
            .then((response) => {
              setPlayers((current) => [...current, response.data]);
            })
            .catch((error) => {
              console.error('Error al obtener detalles del jugador:', error);
            });
        }
        
        return currentPlayers;
      });
    };
    
    // Suscribirse a eventos
    socket.on('monitor-update', handleMonitorUpdate);
    
    // Limpieza al desmontar
    return () => {
      leaveChannel(selectedChannel);
      socket.off('monitor-update', handleMonitorUpdate);
    };
  }, [connected, selectedChannel, socket, joinChannel, leaveChannel]);
  
  // Manejar cambio de canal
  const handleChannelChange = (channelId) => {
    setSelectedChannel(channelId);
    navigate(`/live-monitor/${channelId}`);
  };
  
  // Manejar solicitud de captura de pantalla
  const handleRequestScreenshot = (activisionId) => {
    if (!connected || !selectedChannel) return;
    
    // La solicitud se maneja a través del hook useSocket
    const { requestScreenshot } = useSocket();
    requestScreenshot(activisionId, selectedChannel);
  };
  
  // Manejar cambio de canal para un jugador
  const handleMovePlayer = (activisionId, toChannel) => {
    if (!connected || !selectedChannel) return;
    
    // La solicitud se maneja a través del hook useSocket
    const { changePlayerChannel } = useSocket();
    changePlayerChannel(activisionId, selectedChannel, toChannel);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Monitoreo en Vivo</h2>
        <p className="mt-1 text-sm text-gray-500">
          Supervisa la actividad de los jugadores en tiempo real
        </p>
      </div>
      
      {/* Selector de canal */}
      <ChannelSelector
        channels={channels}
        selectedChannel={selectedChannel}
        onChannelChange={handleChannelChange}
      />
      
      {/* Estado de conexión */}
      <div className="flex items-center justify-between rounded-md bg-gray-50 p-4">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full ${connected ? 'bg-success-500' : 'bg-danger-500'}`}></div>
          <span className="ml-2 text-sm text-gray-700">
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {players.filter(p => p.isOnline).length} jugadores activos en el canal
        </div>
      </div>
      
      {/* Mensajes de estado */}
      {isLoading ? (
        <div className="p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando jugadores...</p>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No hay jugadores en este canal</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <PlayerMonitorCard
              key={player._id}
              player={player}
              onRequestScreenshot={handleRequestScreenshot}
              onMovePlayer={handleMovePlayer}
              availableChannels={channels.filter(
                (channel) => channel.id !== selectedChannel
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveMonitor;
