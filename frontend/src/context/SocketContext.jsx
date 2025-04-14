import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null); // Referencia para mantener el socket entre renders
  
  // Socket connection URL - use the backend base URL, not the frontend one
  const SOCKET_URL = 'https://antishit-server2-0.onrender.com';
  
  useEffect(() => {
    // Función de limpieza para desconectar el socket de manera segura
    const cleanupSocket = () => {
      if (socketRef.current) {
        try {
          console.log('Desconectando socket de manera segura...');
          socketRef.current.disconnect();
        } catch (error) {
          console.error('Error al desconectar socket:', error);
        }
        socketRef.current = null;
      }
    };

    // Si el usuario no está autenticado, limpiar socket y salir
    if (!isAuthenticated || !user) {
      setConnected(false);
      cleanupSocket();
      setSocket(null);
      return cleanupSocket;
    }
    
    // Obtener token para la conexión
    const token = localStorage.getItem('token');
    if (!token) {
      setConnected(false);
      return cleanupSocket;
    }
    
    console.log('Iniciando conexión Socket.IO en:', SOCKET_URL);
    
    try {
      // Inicializar socket solo si no existe ya
      if (!socketRef.current) {
        const socketIo = io(SOCKET_URL, {
          path: '/socket.io',
          auth: {
            token
          },
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000, // Aumentar timeout para conexiones lentas
          transports: ['websocket', 'polling'] // Permitir fallback a polling
        });
        
        socketRef.current = socketIo;
        setSocket(socketIo);
        
        // Configurar eventos una sola vez al crear el socket
        socketIo.on('connect', () => {
          console.log('Socket conectado exitosamente');
          setConnected(true);
          toast.success('Conectado en tiempo real');
        });
        
        socketIo.on('disconnect', (reason) => {
          console.log('Socket desconectado, razón:', reason);
          setConnected(false);
          
          if (reason === 'io server disconnect') {
            // Reconectar manualmente si fue desconectado por el servidor
            console.log('Intentando reconexión manual...');
            try {
              socketIo.connect();
            } catch (error) {
              console.error('Error al intentar reconexión manual:', error);
            }
          }
        });
        
        socketIo.on('connect_error', (error) => {
          console.error('Error de conexión socket:', error.message);
          setConnected(false);
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
          console.error('Falló la reconexión después de múltiples intentos');
          setConnected(false);
          toast.error('No se pudo reconectar al servidor');
        });
        
        socketIo.on('error', (error) => {
          try {
            console.error('Error de socket:', error);
            toast.error('Error de conexión en tiempo real');
          } catch (e) {
            console.error('Error al procesar evento de error:', e);
          }
        });
        
        socketIo.on('critical-alert', (alert) => {
          try {
            // Mostrar alertas críticas incluso si no estamos en la página de alertas
            toast.error(`🚨 ALERTA: ${alert.message || 'Alerta crítica recibida'}`, {
              duration: 6000,
            });
          } catch (e) {
            console.error('Error al procesar alerta crítica:', e);
          }
        });

        // Listener específico para solicitudes de capturas
        socketIo.on('take-screenshot', (data) => {
          try {
            console.log('Solicitud de captura recibida:', data);
            toast(`Captura solicitada por ${data.requestedBy || 'un juez'}`, {
              icon: '📸',
              duration: 5000
            });
          } catch (e) {
            console.error('Error al procesar solicitud de captura:', e);
          }
        });
        
        // Listener para actualizaciones de monitoreo
        socketIo.on('monitor-update', (data) => {
          try {
            console.log('Actualización de monitoreo recibida para:', data.activisionId);
            // Cada componente maneja sus propias actualizaciones
          } catch (e) {
            console.error('Error al procesar actualización de monitoreo:', e);
          }
        });
        
        // Listener para nuevas capturas
        socketIo.on('new-screenshot', (data) => {
          try {
            console.log('Nueva captura disponible para:', data.activisionId);
            const sourceText = data.source === 'judge' ? 'Solicitada por juez' : 'Enviada por usuario';
            toast.success(`Nueva captura de ${data.activisionId} disponible (${sourceText})`);
          } catch (e) {
            console.error('Error al procesar notificación de nueva captura:', e);
          }
        });
      }
    } catch (error) {
      console.error('Error al inicializar socket:', error);
      toast.error('No se pudo establecer conexión en tiempo real');
      setConnected(false);
      cleanupSocket();
    }
    
    // Cleanup al desmontar
    return cleanupSocket;
  }, [isAuthenticated, user]);
  
  // Función segura para unirse a un canal
  const joinChannel = (channelId) => {
    if (!socketRef.current || !connected) {
      console.warn('No se pudo unir al canal - socket no conectado');
      return false;
    }
    
    try {
      socketRef.current.emit('join-channel', channelId);
      console.log(`Unido al canal ${channelId}`);
      return true;
    } catch (error) {
      console.error(`Error al unirse al canal ${channelId}:`, error);
      return false;
    }
  };
  
  // Función segura para salir de un canal
  const leaveChannel = (channelId) => {
    if (!socketRef.current || !connected) {
      return false;
    }
    
    try {
      socketRef.current.emit('leave-channel', channelId);
      console.log(`Salió del canal ${channelId}`);
      return true;
    } catch (error) {
      console.error(`Error al salir del canal ${channelId}:`, error);
      return false;
    }
  };
  
  // Función segura para solicitar una captura de pantalla
  const requestScreenshot = (activisionId, channelId, options = {}) => {
    if (!socketRef.current || !connected) {
      console.warn('No se pudo solicitar captura - socket no conectado', {
        socketExists: !!socketRef.current,
        connected: connected
      });
      
      toast.error('No hay conexión en tiempo real para solicitar captura');
      return false;
    }
    
    try {
      console.log(`Solicitando captura para ${activisionId} en canal ${channelId}`, {
        source: options.source || 'judge',
        isJudgeRequest: options.isJudgeRequest !== false,
        FORCE_JUDGE_TYPE: options.FORCE_JUDGE_TYPE !== false
      });
      
      // Emitir el evento con la información necesaria
      socketRef.current.emit('request-screenshot', { 
        activisionId, 
        channelId,
        requestedBy: user?.name || 'Judge',
        timestamp: new Date().toISOString(),
        source: options.source || 'judge', // Explícitamente marcando esto como una solicitud de juez
        isJudgeRequest: options.isJudgeRequest !== false, // Por defecto true
        FORCE_JUDGE_TYPE: options.FORCE_JUDGE_TYPE !== false // Bandera adicional para asegurar categorización correcta
      });
      
      // Mensaje de confirmación
      toast.success(`Solicitando captura para ${activisionId}`);
      
      // Log en consola para depuración
      console.log('Evento socket emitido: request-screenshot', {
        activisionId, 
        channelId,
        requestedBy: user?.name,
        source: options.source || 'judge',
        isJudgeRequest: options.isJudgeRequest !== false,
        FORCE_JUDGE_TYPE: options.FORCE_JUDGE_TYPE !== false
      });
      
      return true;
    } catch (error) {
      console.error('Error al solicitar captura vía socket:', error);
      toast.error(`Error al solicitar captura: ${error.message}`);
      return false;
    }
  };
  
  // Función segura para cambiar el canal de un jugador
  const changePlayerChannel = (activisionId, fromChannel, toChannel) => {
    if (!socketRef.current || !connected) {
      toast.error('No hay conexión en tiempo real');
      return false;
    }
    
    try {
      socketRef.current.emit('change-player-channel', { 
        activisionId, 
        fromChannel, 
        toChannel,
        // Agregar quién hizo el cambio
        changedBy: user?.name || 'Judge'
      });
      
      toast.success(`Moviendo ${activisionId} al canal ${toChannel}`);
      return true;
    } catch (error) {
      console.error('Error al cambiar canal de jugador:', error);
      toast.error(`Error al mover jugador: ${error.message}`);
      return false;
    }
  };
  
  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
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
