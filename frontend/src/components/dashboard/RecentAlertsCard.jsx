import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellAlertIcon,
  CameraIcon,
  DeviceTabletIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../../context/SocketContext';

const RecentAlertsCard = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { socket, connected } = useSocket();

  // Categorías de alertas específicas a mostrar
  const relevantTypes = [
    'new-device',
    'device-suspicious',
    'dma-device-detected',
    'screenshot-taken',
    'player-reconnected',
    'new-player',
    'hwid-duplicate'
  ];

  // Cargar alertas iniciales
  const fetchAlerts = async () => {
    try {
      setIsRefreshing(true);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Sesión expirada');
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await axios.get(`${apiUrl}/alerts?limit=15`, { headers });
      
      // Filtrar solo las alertas relevantes
      const filteredAlerts = response.data.filter(
        alert => relevantTypes.includes(alert.type)
      );
      
      setAlerts(filteredAlerts.slice(0, 10)); // Limitar a 10 alertas
      setError(null);
    } catch (err) {
      console.error('Error al cargar alertas recientes:', err);
      setError('Error al cargar alertas');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Cargar alertas al inicio
  useEffect(() => {
    fetchAlerts();
    
    // Actualizar cada minuto
    const intervalId = setInterval(fetchAlerts, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Escuchar nuevas alertas
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewAlert = (alert) => {
      if (!alert || !relevantTypes.includes(alert.type)) return;
      
      setAlerts(prev => {
        // Añadir la nueva alerta al principio
        const newAlerts = [alert, ...prev];
        // Limitar a 10 alertas
        return newAlerts.slice(0, 10);
      });
    };

    socket.on('new-alert', handleNewAlert);
    socket.on('critical-alert', handleNewAlert);

    return () => {
      socket.off('new-alert', handleNewAlert);
      socket.off('critical-alert', handleNewAlert);
    };
  }, [socket, connected]);

// Obtener icono según tipo de alerta
const getAlertIcon = (alert) => {
  // Detección especial para DMA
  if (alert.type === 'dma-device-detected') {
    return <ExclamationTriangleIcon className="h-5 w-5 text-danger-500 animate-pulse" aria-hidden="true" />;
  }
  
  switch (alert.type) {
    case 'new-device':
    case 'device-suspicious':
      return <DeviceTabletIcon className="h-5 w-5 text-warning-500" aria-hidden="true" />;
    case 'screenshot-taken':
      return <CameraIcon className="h-5 w-5 text-primary-500" aria-hidden="true" />;
    case 'hwid-duplicate':
      return <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" aria-hidden="true" />;
    case 'new-player':
    case 'player-reconnected':
      return <InformationCircleIcon className="h-5 w-5 text-primary-500" aria-hidden="true" />;
    default:
      return <BellAlertIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />;
  }
};

  // Obtener descripción amigable según tipo de alerta
const getAlertDescription = (alert) => {
  switch (alert.type) {
    case 'new-device':
      return `Nuevo dispositivo detectado para ${alert.activisionId}`;
    case 'device-suspicious':
      return `Dispositivo sospechoso para ${alert.activisionId}`;
    case 'dma-device-detected':
      return `¡ALERTA CRÍTICA! Dispositivo DMA detectado para ${alert.activisionId}`;
    case 'screenshot-taken':
      return `Nueva captura de pantalla de ${alert.activisionId}`;
    case 'hwid-duplicate':
      return `Posible cuenta duplicada: ${alert.activisionId}`;
    case 'new-player':
      return `Nuevo jugador conectado: ${alert.activisionId}`;
    case 'player-reconnected':
      return `Jugador reconectado: ${alert.activisionId}`;
    default:
      return alert.message;
  }
};
  
  if (isLoading) {
    return (
      <div className="card h-full">
        <div className="card-header flex items-center">
          <BellAlertIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Alertas Recientes</h3>
        </div>
        <div className="card-body p-4 flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center">
          <BellAlertIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Alertas Recientes</h3>
        </div>
        <button 
          onClick={fetchAlerts}
          disabled={isRefreshing}
          className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>
      <div className="card-body p-0">
        {error ? (
          <div className="p-6 text-center text-danger-600">
            {error}
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay alertas recientes
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert._id} className="flex items-start p-4 hover:bg-gray-50">
                <div className="flex-shrink-0 pt-0.5">
                  {getAlertIcon(alert)}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {getAlertDescription(alert)}
                  </p>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span className="truncate">
                      {formatDistanceToNow(new Date(alert.timestamp), {
                        addSuffix: true,
                        locale: es
                      })}
                    </span>
                    {alert.playerId && (
                      <Link
                        to={`/players/${alert.playerId}`}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        Ver jugador
                      </Link>
                    )}
                    {alert.deviceId && (
                      <Link
                        to={`/devices/${alert.deviceId}`}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        Ver dispositivo
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 p-4 text-center">
        <Link to="/alerts" className="text-sm text-primary-600 hover:text-primary-800">
          Ver todas las alertas
        </Link>
      </div>
    </div>
  );
};

export default RecentAlertsCard;
