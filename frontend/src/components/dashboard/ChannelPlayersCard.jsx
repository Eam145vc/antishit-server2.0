import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { UserIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../../context/SocketContext';

const ChannelPlayersCard = () => {
  const [channelPlayers, setChannelPlayers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, connected } = useSocket();

  // Función para verificar si un jugador está realmente conectado
  const isPlayerActive = (player) => {
    if (!player) return false;
    const lastSeenDate = new Date(player.lastSeen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return player.isOnline && lastSeenDate > fiveMinutesAgo;
  };

  // Cargar jugadores iniciales
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
        
        const response = await axios.get(`${apiUrl}/players`, { headers });
        
        // Agrupar jugadores por canal
        const playersByChannel = {};
        response.data.forEach(player => {
          if (isPlayerActive(player)) {
            const channelId = player.currentChannelId;
            if (!playersByChannel[channelId]) {
              playersByChannel[channelId] = [];
            }
            playersByChannel[channelId].push(player);
          }
        });
        
        setChannelPlayers(playersByChannel);
        setError(null);
      } catch (err) {
        console.error('Error al cargar jugadores por canal:', err);
        setError('Error al cargar jugadores');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
    
    // Actualizar cada 30 segundos
    const intervalId = setInterval(fetchPlayers, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Escuchar actualizaciones en tiempo real
  useEffect(() => {
    if (!socket || !connected) return;

    // Actualizar jugador cuando cambia estado
    const handlePlayerStatusChange = (data) => {
      if (!data || !data.activisionId) return;
      
      setChannelPlayers(prev => {
        const newChannelPlayers = { ...prev };
        
        // Buscar y eliminar el jugador de cualquier canal
        Object.keys(newChannelPlayers).forEach(channelId => {
          newChannelPlayers[channelId] = newChannelPlayers[channelId].filter(
            player => player.activisionId !== data.activisionId
          );
          
          // Eliminar canal si queda vacío
          if (newChannelPlayers[channelId].length === 0) {
            delete newChannelPlayers[channelId];
          }
        });

        // Añadirlo al nuevo canal si está conectado
        if (data.isOnline) {
          const channelId = data.channelId || 0;
          if (!newChannelPlayers[channelId]) {
            newChannelPlayers[channelId] = [];
          }
          
          // Crear un objeto de jugador desde los datos recibidos
          const playerData = {
            _id: data._id || 'unknown-id',
            activisionId: data.activisionId,
            currentChannelId: channelId,
            isOnline: true,
            isGameRunning: data.isGameRunning || false,
            lastSeen: data.lastSeen || new Date()
          };
          
          // Añadir si no existe ya
          const exists = newChannelPlayers[channelId].some(
            p => p.activisionId === data.activisionId
          );
          
          if (!exists) {
            newChannelPlayers[channelId].push(playerData);
          }
        }
        
        return newChannelPlayers;
      });
    };

    // Manejar cambio de canal
    const handleChannelChange = (data) => {
      if (!data || !data.activisionId) return;
      
      setChannelPlayers(prev => {
        const newChannelPlayers = { ...prev };
        
        // Eliminar del canal anterior
        if (newChannelPlayers[data.fromChannel]) {
          newChannelPlayers[data.fromChannel] = newChannelPlayers[data.fromChannel].filter(
            player => player.activisionId !== data.activisionId
          );
          
          // Eliminar canal si queda vacío
          if (newChannelPlayers[data.fromChannel].length === 0) {
            delete newChannelPlayers[data.fromChannel];
          }
        }
        
        // Encontrar datos del jugador
        let playerData = null;
        Object.values(prev).forEach(channelPlayers => {
          const player = channelPlayers.find(p => p.activisionId === data.activisionId);
          if (player) {
            playerData = { ...player, currentChannelId: data.toChannel };
          }
        });
        
        // Si no lo encontramos, crear uno básico
        if (!playerData) {
          playerData = {
            _id: 'temp-' + Date.now(),
            activisionId: data.activisionId,
            currentChannelId: data.toChannel,
            isOnline: true,
            lastSeen: new Date()
          };
        }
        
        // Añadir al nuevo canal
        if (!newChannelPlayers[data.toChannel]) {
          newChannelPlayers[data.toChannel] = [];
        }
        
        newChannelPlayers[data.toChannel].push(playerData);
        
        return newChannelPlayers;
      });
    };

    // Registrar listeners
    socket.on('player-status-changed', handlePlayerStatusChange);
    socket.on('player-channel-changed', handleChannelChange);
    socket.on('monitor-update', (data) => {
      // Solo actualizar si hay cambio de estado o canal
      if (data.statusChanged || data.isNewPlayer) {
        handlePlayerStatusChange(data);
      }
    });

    return () => {
      // Eliminar listeners al desmontar
      socket.off('player-status-changed', handlePlayerStatusChange);
      socket.off('player-channel-changed', handleChannelChange);
      socket.off('monitor-update');
    };
  }, [socket, connected]);

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header flex items-center">
          <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Jugadores por Canal</h3>
        </div>
        <div className="card-body p-4 flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header flex items-center">
          <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Jugadores por Canal</h3>
        </div>
        <div className="card-body p-4">
          <div className="text-danger-600 text-center">{error}</div>
        </div>
      </div>
    );
  }

  const channelIds = Object.keys(channelPlayers).sort((a, b) => Number(a) - Number(b));
  
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center">
          <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Jugadores por Canal</h3>
        </div>
        <span className="text-xs text-gray-500">
          {Object.values(channelPlayers).flat().length} jugadores en línea
        </span>
      </div>
      <div className="card-body p-0">
        {channelIds.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay jugadores conectados actualmente
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {channelIds.map(channelId => (
              <div key={channelId} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">Canal {channelId}</h4>
                  <Link 
                    to={`/live-monitor/${channelId}`}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Monitorear
                  </Link>
                </div>
                <div className="space-y-1">
                  {channelPlayers[channelId].map(player => (
                    <div 
                      key={player._id} 
                      className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${player.isGameRunning ? 'bg-success-500' : 'bg-warning-500'}`}></div>
                        <Link 
                          to={`/players/${player._id}`}
                          className="text-sm font-medium text-gray-800 hover:text-primary-600"
                        >
                          {player.activisionId}
                        </Link>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                        {player.isGameRunning ? 'Jugando' : 'Conectado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelPlayersCard;
