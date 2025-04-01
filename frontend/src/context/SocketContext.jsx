import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }
    
    // Inicializar socket
    const token = localStorage.getItem('token');
    
    if (!token) return;
    
    const socketIo = io('/', {
      path: '/socket.io',
      auth: {
        token
      }
    });
    
    socketIo.on('connect', () => {
      setConnected(true);
      console.log('Socket conectado');
    });
    
    socketIo.on('disconnect', () => {
      setConnected(false);
      console.log('Socket desconectado');
    });
    
    socketIo.on('error', (error) => {
      console.error('Error de socket:', error);
      toast.error('Error de conexión en tiempo real');
    });
    
    socketIo.on('critical-alert', (alert) => {
      // Mostrar alertas críticas incluso si no estamos en la página de alertas
      toast.error(`🚨 ALERTA: ${alert.message}`, {
        duration: 6000,
      });
    });
    
    setSocket(socketIo);
    
    // Limpieza al desmontar
    return () => {
      if (socketIo) {
        socketIo.disconnect();
      }
    };
  }, [isAuthenticated, user]);
  
  // Función para unirse a un canal
  const joinChannel = (channelId) => {
    if (socket && connected) {
      socket.emit('join-channel', channelId);
      console.log(`Unido al canal ${channelId}`);
    }
  };
  
  // Función para salir de un canal
  const leaveChannel = (channelId) => {
    if (socket && connected) {
      socket.emit('leave-channel', channelId);
      console.log(`Salido del canal ${channelId}`);
    }
  };
  
  // Función para solicitar captura de pantalla
  const requestScreenshot = (activisionId, channelId) => {
    if (socket && connected) {
      socket.emit('request-screenshot', { activisionId, channelId });
      toast.success(`Solicitando captura para ${activisionId}`);
      return true;
    }
    toast.error('No hay conexión en tiempo real');
    return false;
  };
  
  // Función para cambiar canal de jugador
  const changePlayerChannel = (activisionId, fromChannel, toChannel) => {
    if (socket && connected) {
      socket.emit('change-player-channel', { activisionId, fromChannel, toChannel });
      toast.success(`Moviendo a ${activisionId} al canal ${toChannel}`);
      return true;
    }
    toast.error('No hay conexión en tiempo real');
    return false;
  };
  
  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinChannel,
        leaveChannel,
        requestScreenshot,
        changePlayerChannel
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);