// frontend/src/components/devices/DeviceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ExclamationTriangleIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon, // Asegurar que este ícono esté importado
  TagIcon,
  CpuChipIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DeviceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setIsLoading(true);
        
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
        
        console.log(`Solicitud de dispositivo: ${apiUrl}/devices/${id}`);
        const response = await axios.get(`${apiUrl}/devices/${id}`, { headers });
        console.log('Respuesta del dispositivo:', response.data);
        
        setDevice(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar la información del dispositivo:', err);
        if (err.response?.status === 404) {
          setError('Dispositivo no encontrado');
        } else {
          setError('Error al cargar los datos del dispositivo');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDeviceData();
  }, [id, navigate]);
  
  // Determinar si es un monitor y extraer información específica
  const getMonitorInfo = () => {
    if (!device) return null;
    
    // Verificar si es un monitor por diferentes criterios
    const isMonitor = 
      device.isMonitor || 
      device.type?.toLowerCase().includes('monitor') ||
      device.description?.toLowerCase().includes('monitor') ||
      device.name?.toLowerCase().includes('monitor');
    
    if (!isMonitor) return null;
    
    // Extraer información relevante
    const resolution = 
      device.monitorInfo?.resolution || 
      device.description?.match(/\d+\s*x\s*\d+/)?.[0] || 
      'Desconocida';
    
    const manufacturer = 
      device.manufacturer || 
      device.monitorInfo?.manufacturer || 
      'Desconocido';
    
    const model = 
      device.monitorInfo?.model || 
      device.name?.replace(manufacturer, '').trim() || 
      '';
    
    const refreshRate = 
      device.monitorInfo?.refreshRate || 
      '';
    
    const serialNumber = 
      device.monitorInfo?.serialNumber || 
      '';
    
    const yearOfManufacture = 
      device.monitorInfo?.yearOfManufacture || 
      '';
    
    return { 
      isMonitor, 
      resolution, 
      manufacturer, 
      model, 
      refreshRate, 
      serialNumber,
      yearOfManufacture
    };
  };
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando información del dispositivo...</p>
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
                onClick={() => navigate('/devices')}
              >
                Volver a dispositivos
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
  
  if (!device) {
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
              No se encontró información del dispositivo
            </h3>
            <div className="mt-2">
              <button
                type="button"
                className="rounded-md bg-warning-50 px-2 py-1.5 text-sm font-medium text-warning-800 hover:bg-warning-100"
                onClick={() => navigate('/devices')}
              >
                Volver a la lista de dispositivos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Obtener información de monitor si es aplicable
  const monitorInfo = getMonitorInfo();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Detalle del Dispositivo</h2>
        <p className="mt-1 text-sm text-gray-500">
          Información detallada del dispositivo seleccionado
        </p>
      </div>
      
      {/* Información básica del dispositivo */}
      <div className="card">
        <div className="card-header flex items-center">
          {monitorInfo ? (
            <ComputerDesktopIcon className="h-6 w-6 text-primary-500 mr-2" />
          ) : (
            <DeviceTabletIcon className="h-6 w-6 text-primary-500 mr-2" />
          )}
          <h3 className="text-lg font-medium text-gray-900">
            {device.name || device.Name || 'Dispositivo sin nombre'}
          </h3>
        </div>
        <div className="card-body">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">ID del dispositivo</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {device.deviceId || device.DeviceId}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Tipo</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {device.type || device.Type || 'Desconocido'}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Fabricante</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {device.manufacturer || device.Manufacturer || monitorInfo?.manufacturer || 'Desconocido'}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {device.status || device.Status || 'Desconocido'}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Nivel de confianza</dt>
              <dd className="mt-1 sm:col-span-2 sm:mt-0">
                <span className={`badge ${
                  device.trustLevel === 'Trusted' ? 'badge-success' :
                  device.trustLevel === 'Unknown' ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {device.trustLevel || 'Desconocido'}
                </span>
              </dd>
            </div>
            
            {/* Información específica para monitores */}
            {monitorInfo && (
              <>
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Resolución</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {monitorInfo.resolution}
                  </dd>
                </div>
                
                {monitorInfo.model && (
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Modelo</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {monitorInfo.model}
                    </dd>
                  </div>
                )}
                
                {monitorInfo.serialNumber && (
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Número de Serie</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {monitorInfo.serialNumber}
                    </dd>
                  </div>
                )}
                
                {monitorInfo.yearOfManufacture && (
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Año de Fabricación</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {monitorInfo.yearOfManufacture}
                    </dd>
                  </div>
                )}
                
                {device.monitorInfo?.refreshRate && (
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Frecuencia</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {device.monitorInfo.refreshRate} Hz
                    </dd>
                  </div>
                )}
                
                {device.monitorInfo?.connectionType && (
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Tipo de Conexión</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {device.monitorInfo.connectionType}
                    </dd>
                  </div>
                )}
              </>
            )}
            
            {device.description && (
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {device.description}
                </dd>
              </div>
            )}
            
            {device.driver && (
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Controlador</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {device.driver}
                </dd>
              </div>
            )}
            
            {/* Estado de conexión */}
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Estado de conexión</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    device.connectionStatus === 'Connected'
                      ? 'bg-success-100 text-success-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {device.connectionStatus === 'Connected'
                    ? 'Conectado'
                    : device.connectionStatus || 'Desconocido'}
                </span>
              </dd>
            </div>
            
            {/* Información del jugador */}
            {device.player && (
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Jugador</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <Link
                    to={`/players/${device.player._id}`}
                    className="text-primary-600 hover:text-primary-500"
                  >
                    {device.player.activisionId || 'Jugador desconocido'}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* Link de regreso */}
      <div className="mt-6">
        <Link
          to="/devices"
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          &larr; Volver a la lista de dispositivos
        </Link>
      </div>
    </div>
  );
};

export default DeviceDetail;
