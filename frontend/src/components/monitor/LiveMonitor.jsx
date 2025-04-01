// src/components/monitor/LiveMonitor.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import ChannelSelector from './ChannelSelector';
import PlayerMonitorCard from './PlayerMonitorCard';

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
      try {
        const response = await axios.get('/api/tournaments/active/channels');
        
        // Si no hay torneo activo, usar canales predeterminados
        if (!response.data.length) {
          setChannels([
            { id: 1, name: 'Canal 1' },
            { id: 2, name: 'Canal 2' },
            { id: 3, name: 'Canal 3' },
            { id: 4, name: 'Canal 4' },
            { id: 5, name: 'Canal 5' },
          ]);
        } else {
          setChannels(response.data);
        }
        
        // Si no hay canal seleccionado, seleccionar el primero
        if (!selectedChannel && response.data.length) {
          setSelectedChannel(response.data[0].id);
          navigate(`/live-monitor/${response.data[0].id}`, { replace: true });
        } else if (!selectedChannel) {
          setSelectedChannel(1);
          navigate('/live-monitor/1', { replace: true });
        }
      } catch (error) {
        console.error('Error al obtener canales:', error);
        // Usar canales predeterminados en caso de error
        setChannels([
          { id: 1, name: 'Canal 1' },
          { id: 2, name: 'Canal 2' },
          { id: 3, name: 'Canal 3' },
          { id: 4, name: 'Canal 4' },
          { id: 5, name: 'Canal 5' },
        ]);
        
        if (!selectedChannel) {
          setSelectedChannel(1);
          navigate('/live-monitor/1', { replace: true });
        }
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
        const response = await axios.get(`/api/players/channel/${selectedChannel}`);
        setPlayers(response.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar jugadores del canal');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
    
    // Configurar intervalo para actualización periódica
    const intervalId = setInterval(fetchPlayers, 30000); // Cada 30 segundos
    
    return () => clearInterval(intervalId);
  }, [selectedChannel]);
  
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
          axios
            .get(`/api/players/activision/${data.activisionId}`)
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
    
    // Escuchar cambios de estado de jugador
    const handlePlayerStatusChanged = (data) => {
      if (data.channelId !== selectedChannel) return;
      
      setPlayers((currentPlayers) => {
        return currentPlayers.map((player) => {
          if (player.activisionId === data.activisionId) {
            return {
              ...player,
              isOnline: data.isOnline,
              lastSeen: data.timestamp || new Date(),
            };
          }
          return player;
        });
      });
    };
    
    // Escuchar cambios de canal de jugador
    const handlePlayerChannelChanged = (data) => {
      setPlayers((currentPlayers) => {
        // Si el jugador salió de este canal, eliminarlo de la lista
        if (data.fromChannel === selectedChannel && data.toChannel !== selectedChannel) {
          return currentPlayers.filter(
            (player) => player.activisionId !== data.activisionId
          );
        }
        
        // Si el jugador entró a este canal, agregarlo a la lista
        if (data.fromChannel !== selectedChannel && data.toChannel === selectedChannel) {
          // Obtener datos completos del jugador
          axios
            .get(`/api/players/activision/${data.activisionId}`)
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
    
    // Escuchar nuevas capturas
    const handleNewScreenshot = (data) => {
      // Actualizar timestamp de última captura para el jugador
      if (data.channelId !== selectedChannel) return;
      
      setPlayers((currentPlayers) => {
        return currentPlayers.map((player) => {
          if (player.activisionId === data.activisionId) {
            return {
              ...player,
              lastScreenshotId: data.id,
              lastScreenshotTime: data.timestamp,
            };
          }
          return player;
        });
      });
    };
    
    // Suscribirse a eventos
    socket.on('monitor-update', handleMonitorUpdate);
    socket.on('player-status-changed', handlePlayerStatusChanged);
    socket.on('player-channel-changed', handlePlayerChannelChanged);
    socket.on('new-screenshot', handleNewScreenshot);
    
    // Limpieza al desmontar
    return () => {
      leaveChannel(selectedChannel);
      socket.off('monitor-update', handleMonitorUpdate);
      socket.off('player-status-changed', handlePlayerStatusChanged);
      socket.off('player-channel-changed', handlePlayerChannelChanged);
      socket.off('new-screenshot', handleNewScreenshot);
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
      {isLoading && players.length === 0 && (
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando jugadores...</p>
        </div>
      )}
      
      {!isLoading && players.length === 0 && (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No hay jugadores en este canal</p>
        </div>
      )}
      
      {error && (
        <div className="rounded-md bg-danger-50 p-4">
          <div className="text-sm text-danger-700">{error}</div>
        </div>
      )}
      
      {/* Grid de jugadores */}
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
    </div>
  );
};

export default LiveMonitor;