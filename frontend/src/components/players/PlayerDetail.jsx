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

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const PlayerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [devices, setDevices] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [processData, setProcessData] = useState([]);
  const [networkData, setNetworkData] = useState([]);
  const [monitorData, setMonitorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true);
        
        // Usar URL base de la configuración
        const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
        const token = localStorage.getItem('token');
        
        if (!token) {
          // Si no hay token, redirigir a login
          toast.error('Sesión expirada, por favor inicie sesión nuevamente');
          navigate('/login');
          return;
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        
        // Obtener información del jugador
        try {
          const playerResponse = await axios.get(`${apiUrl}/players/${id}`, { headers });
          setPlayer(playerResponse.data);
        } catch (playerError) {
          console.error('Error al cargar jugador:', playerError);
          if (playerError.response?.status === 404) {
            setError('Jugador no encontrado');
          } else {
            setError('Error al cargar datos del jugador');
          }
          // No detenemos la ejecución, intentamos cargar los otros datos
        }
        
        // Obtener dispositivos del jugador
        try {
          const devicesResponse = await axios.get(`${apiUrl}/players/${id}/devices`, { headers });
          setDevices(devicesResponse.data.all || []);
        } catch (devicesError) {
          console.error('Error al cargar dispositivos:', devicesError);
          // No mostramos error, solo dejamos la lista vacía
        }
        
        // Obtener capturas de pantalla
        try {
          const screenshotsResponse = await axios.get(`${apiUrl}/screenshots/player/${id}?limit=10`, { headers });
          setScreenshots(screenshotsResponse.data);
        } catch (screenshotsError) {
          console.error('Error al cargar capturas:', screenshotsError);
          // No mostramos error, solo dejamos la lista vacía
        }
        
        // Obtener historial de monitoreo más reciente
        try {
          const historyResponse = await axios.get(`${apiUrl}/players/${id}/history?limit=1`, { headers });
          
          if (historyResponse.data && historyResponse.data.length > 0) {
            const latestMonitorData = historyResponse.data[0];
            setMonitorData(latestMonitorData);
            
            // Extraer procesos y conexiones de red
            setProcessData(latestMonitorData.processes || []);
            setNetworkData(latestMonitorData.networkConnections || []);
          }
        } catch (historyError) {
          console.error('Error al cargar historial:', historyError);
          // No mostramos error, solo dejamos los datos vacíos
        }
        
      } catch (err) {
        console.error('Error general al cargar datos:', err);
        setError('Error al cargar los datos del jugador');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayerData();
  }, [id, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando información del jugador...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-danger-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon 
              className="h-5 w-5 text-danger-400" 
              aria-hidden="true" 
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-danger-800">
              {error}
            </h3>
            <div className="mt-4 flex">
              <button
                type="button"
                className="rounded-md bg-danger-50 px-2 py-1.5 text-sm font-medium text-danger-800 hover:bg-danger-100 mr-3"
                onClick={() => navigate('/players')}
              >
                Volver a jugadores
              </button>
              <button
                type="button"
                className="rounded-md bg-danger-50 px-2 py-1.5 text-sm font-medium text-danger-800 hover:bg-danger-100"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!player) {
    return (
      <div className="rounded-md bg-warning-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon 
              className="h-5 w-5 text-warning-400" 
              aria-hidden="true" 
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-warning-800">
              No se encontró información del jugador
            </h3>
            <div className="mt-2">
              <button
                type="button"
                className="rounded-md bg-warning-50 px-2 py-1.5 text-sm font-medium text-warning-800 hover:bg-warning-100"
                onClick={() => navigate('/players')}
              >
                Volver a la lista de jugadores
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Cabecera del jugador */}
      <PlayerDetailHeader player={player} />
      
      {/* Pestañas de información */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none focus:ring-0',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'
              )
            }
          >
            Información del Sistema
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none focus:ring-0',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'
              )
            }
          >
            Dispositivos
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none focus:ring-0',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'
              )
            }
          >
            Procesos
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none focus:ring-0',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'
              )
            }
          >
            Red
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none focus:ring-0',
                selected
                  ? 'bg-white shadow text-primary-700'
                  : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'
              )
            }
          >
            Capturas
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel className="rounded-xl bg-white p-3">
            <SystemInfoPanel player={player} />
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white p-3">
            <DeviceList devices={devices} isEmbedded />
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white p-3">
            <ProcessList processes={processData} />
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white p-3">
            <NetworkConnections connections={networkData} />
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white p-3">
            <ScreenshotGallery screenshots={screenshots} playerId={player._id} isEmbedded />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default PlayerDetail;
