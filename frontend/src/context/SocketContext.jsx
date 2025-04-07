import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // URL de conexión del socket - usa la URL base del backend, no la del frontend
  const SOCKET_URL = 'https://antishit-server2-0.onrender.com';
  
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
    
    console.log('Iniciando conexión con Socket.IO en:', SOCKET_URL);
    
    const socketIo = io(SOCKET_URL, {
      path: '/socket.io',
      auth: {
        token
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socketIo.on('connect', () => {
      setConnected(true);
      console.log('Socket conectado correctamente');
      toast.success('Conectado en tiempo real');
    });
    
    socketIo.on('disconnect', (reason) => {
      setConnected(false);
      console.log('Socket desconectado, razón:', reason);
      
      if (reason === 'io server disconnect') {
        // Reconectar manualmente si fue desconectado por el servidor
        socketIo.connect();
      }
    });
    
    socketIo.on('connect_error', (error) => {
      console.error('Error de conexión del socket:', error);
      toast.error('Error de conexión en tiempo real');
    });
    
    socketIo.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Intento de reconexión #${attemptNumber}`);
    });
    
    socketIo.on('reconnect', (attemptNumber) => {
      console.log(`Reconectado después de ${attemptNumber} intentos`);
      setConnected(true);
      toast.success('Reconectado en tiempo real');
    });
    
    socketIo.on('reconnect_failed', () => {
      console.error('Reconexión fallida después de varios intentos');
      toast.error('No se pudo reconectar al servidor');
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

    // Agregamos un listener específico para monitor-update
    socketIo.on('monitor-update', (data) => {
      console.log('Actualización de monitoreo recibida:', data);
      // No hacemos nada aquí, cada componente maneja sus propias actualizaciones
    });
    
    setSocket(socketIo);
    
    // Limpieza al desmontar
    return () => {
      console.log('Desconectando socket...');
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
      return true;
    }
    console.warn('No se pudo unir al canal - socket no conectado');
    return false;
  };
  
  // Función para salir de un canal
  const leaveChannel = (channelId) => {
    if (socket && connected) {
      socket.emit('leave-channel', channelId);
      console.log(`Salido del canal ${channelId}`);
      return true;
    }
    return false;
  };
  
  // Función para solicitar captura de pantalla
  const requestScreenshot = (activisionId, channelId) => {
    if (socket && connected) {
      console.log(`Solicitando captura para ${activisionId} en canal ${channelId}`);
      
      // Emitir el evento con la información necesaria
      socket.emit('request-screenshot', { activisionId, channelId });
      
      // Mensaje de confirmación
      toast.success(`Solicitando captura para ${activisionId}`);
      
      // Registrar en consola
      console.log('Evento socket emitido: request-screenshot');
      
      return true;
    }
    
    // Mensaje de error si no hay conexión
    console.warn('No se pudo solicitar captura - socket no conectado', {
      socketExists: !!socket,
      connected: connected
    });
    
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
