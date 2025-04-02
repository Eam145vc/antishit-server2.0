import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tab } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PlayerDetailHeader from '../monitor/PlayerDetailHeader';
import DeviceList from '../devices/DeviceList';
import ScreenshotGallery from '../screenshots/ScreenshotGallery';
import SystemInfoPanel from './SystemInfoPanel';
import ProcessList from './ProcessList';
import NetworkConnections from './NetworkConnections';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const PlayerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  const [player, setPlayer] = useState(null);
  const [devices, setDevices] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [processData, setProcessData] = useState([]);
  const [networkData, setNetworkData] = useState([]);
  const [systemInfo, setSystemInfo] = useState({});
  const [monitorData, setMonitorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Escuchar actualizaciones en tiempo real de monitoreo
  useEffect(() => {
    if (!socket) return;

    const handleMonitorUpdate = (data) => {
      if (data.activisionId === player?.activisionId) {
        // Actualizar datos en tiempo real
        if (data.processes) setProcessData(data.processes);
        if (data.networkConnections) setNetworkData(data.networkConnections);
        if (data.systemInfo) setSystemInfo(data.systemInfo);
      }
    };

    socket.on('monitor-update', handleMonitorUpdate);

    return () => {
      socket.off('monitor-update', handleMonitorUpdate);
    };
  }, [socket, player]);
  
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true);
        
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
        
        // Obtener información del jugador
        const playerResponse = await axios.get(`${apiUrl}/players/${id}`, { headers });
        const playerData = playerResponse.data;
        setPlayer(playerData);
        
        // Obtener dispositivos del jugador
        const devicesResponse = await axios.get(`${apiUrl}/players/${id}/devices`, { headers });
        setDevices(devicesResponse.data.all || []);
        
        // Obtener capturas de pantalla
        const screenshotsResponse = await axios.get(`${apiUrl}/screenshots/player/${id}?limit=10`, { headers });
        setScreenshots(screenshotsResponse.data);
        
        // Obtener historial de monitoreo más reciente
        const historyResponse = await axios.get(`${apiUrl}/players/${id}/history?limit=1`, { headers });
        
        if (historyResponse.data && historyResponse.data.length > 0) {
          const latestMonitorData = historyResponse.data[0];
          setMonitorData(latestMonitorData);
          
          // Establecer datos de procesos, red y sistema
          setProcessData(latestMonitorData.processes || []);
          setNetworkData(latestMonitorData.networkConnections || []);
          setSystemInfo({
            ...playerData.systemInfo,
            ...latestMonitorData.systemInfo
          });
        }
        
        setError(null);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos del jugador');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayerData();
  }, [id, navigate]);
  
  // Resto del código anterior...
  // [mantener la implementación actual de renderizado]
};

export default PlayerDetail;
