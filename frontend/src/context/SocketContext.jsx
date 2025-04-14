import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // Socket connection URL - use the backend base URL, not the frontend one
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
    
    // Initialize socket
    const token = localStorage.getItem('token');
    
    if (!token) return;
    
    console.log('Starting Socket.IO connection at:', SOCKET_URL);
    
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
      console.log('Socket connected successfully');
      toast.success('Connected in real-time');
    });
    
    socketIo.on('disconnect', (reason) => {
      setConnected(false);
      console.log('Socket disconnected, reason:', reason);
      
      if (reason === 'io server disconnect') {
        // Reconnect manually if disconnected by the server
        socketIo.connect();
      }
    });
    
    socketIo.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Real-time connection error');
    });
    
    socketIo.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt #${attemptNumber}`);
    });
    
    socketIo.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      toast.success('Reconnected in real-time');
    });
    
    socketIo.on('reconnect_failed', () => {
      console.error('Reconnection failed after multiple attempts');
      toast.error('Could not reconnect to the server');
    });
    
    socketIo.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Real-time connection error');
    });
    
    socketIo.on('critical-alert', (alert) => {
      // Show critical alerts even if we're not on the alerts page
      toast.error(`🚨 ALERT: ${alert.message}`, {
        duration: 6000,
      });
    });

    // Add a specific listener for take-screenshot events
    socketIo.on('take-screenshot', (data) => {
      console.log('Screenshot request received:', data);
      toast(`Screenshot requested by ${data.requestedBy}`, {
        icon: '📸',
        duration: 5000
      });
    });
    
    // Add a specific listener for monitor-update
    socketIo.on('monitor-update', (data) => {
      console.log('Monitor update received:', data);
      // We don't do anything here, each component handles its own updates
    });
    
    // Add a listener for new screenshots
    socketIo.on('new-screenshot', (data) => {
      console.log('New screenshot available:', data);
      toast.success(`New screenshot from ${data.activisionId} available (${data.source === 'judge' ? 'Judge requested' : 'User submitted'})`);
    });
    
    setSocket(socketIo);
    
    // Cleanup on unmount
    return () => {
      console.log('Disconnecting socket...');
      if (socketIo) {
        socketIo.disconnect();
      }
    };
  }, [isAuthenticated, user]);
  
  // Function to join a channel
  const joinChannel = (channelId) => {
    if (socket && connected) {
      socket.emit('join-channel', channelId);
      console.log(`Joined channel ${channelId}`);
      return true;
    }
    console.warn('Could not join channel - socket not connected');
    return false;
  };
  
  // Function to leave a channel
  const leaveChannel = (channelId) => {
    if (socket && connected) {
      socket.emit('leave-channel', channelId);
      console.log(`Left channel ${channelId}`);
      return true;
    }
    return false;
  };
  
  // Function to request a screenshot - improved with more logging and explicit source tracking
  const requestScreenshot = (activisionId, channelId, options = {}) => {
    if (!socket || !connected) {
      console.warn('Could not request screenshot - socket not connected', {
        socketExists: !!socket,
        connected: connected
      });
      
      toast.error('No real-time connection to request screenshot');
      return false;
    }
    
    try {
      console.log(`Requesting screenshot for ${activisionId} in channel ${channelId}`, {
        source: options.source || 'judge',
        isJudgeRequest: options.isJudgeRequest !== false,
        FORCE_JUDGE_TYPE: options.FORCE_JUDGE_TYPE !== false
      });
      
      // Emit the event with the necessary information
      // Added source: 'judge' to clearly mark this screenshot request
      socket.emit('request-screenshot', { 
        activisionId, 
        channelId,
        requestedBy: user?.name || 'Judge',
        timestamp: new Date(),
        source: options.source || 'judge', // Explicitly marking this as a judge request
        isJudgeRequest: options.isJudgeRequest !== false, // Default to true
        FORCE_JUDGE_TYPE: options.FORCE_JUDGE_TYPE !== false // Additional flag to ensure proper categorization
      });
      
      // Confirmation message
      toast.success(`Requesting screenshot for ${activisionId}`);
      
      // Log to console for debugging
      console.log('Socket event emitted: request-screenshot', {
        activisionId, 
        channelId,
        requestedBy: user?.name,
        source: options.source || 'judge',
        isJudgeRequest: options.isJudgeRequest !== false,
        FORCE_JUDGE_TYPE: options.FORCE_JUDGE_TYPE !== false
      });
      
      return true;
    } catch (error) {
      console.error('Error requesting screenshot via socket:', error);
      toast.error(`Error requesting screenshot: ${error.message}`);
      return false;
    }
  };
  
  // Function to change player channel
  const changePlayerChannel = (activisionId, fromChannel, toChannel) => {
    if (socket && connected) {
      socket.emit('change-player-channel', { 
        activisionId, 
        fromChannel, 
        toChannel,
        // Add who made the change
        changedBy: user?.name || 'Judge'
      });
      
      toast.success(`Moving ${activisionId} to channel ${toChannel}`);
      return true;
    }
    toast.error('No real-time connection');
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
