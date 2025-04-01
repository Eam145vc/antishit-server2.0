import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DeviceCard from './DeviceCard';
import DeviceTypeFilter from './DeviceTypeFilter';

const DeviceList = ({ devices: propsDevices, isEmbedded = false }) => {
  const { type } = useParams();
  const [devices, setDevices] = useState(propsDevices || []);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [trustLevel, setTrustLevel] = useState('');
  const [deviceType, setDeviceType] = useState(type || '');
  const [isLoading, setIsLoading] = useState(!propsDevices);
  const [error, setError] = useState(null);
  
  // Cargar dispositivos si no se proporcionan como prop
  useEffect(() => {
    if (propsDevices) {
      setDevices(propsDevices);
      setIsLoading(false);
      return;
    }
    
    const fetchDevices = async () => {
      try {
        setIsLoading(true);
        
        let url = '/api/devices';
        
        // Si estamos en la vista de tipo específico
        if (type) {
          url = `/api/devices/by-type/${type}`;
          setDeviceType(type);
        }
        
        const response = await axios.get(url);
        setDevices(response.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar dispositivos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDevices();
  }, [propsDevices, type]);
  
  // Filtrar dispositivos
  useEffect(() => {
    const filtered = devices.filter((device) => {
      // Filtro por búsqueda
      const matchesSearch = !searchTerm ||
        device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por nivel de confianza
      const matchesTrustLevel = !trustLevel || device.trustLevel === trustLevel;
      
      // Filtro por tipo de dispositivo
      const matchesDeviceType = !deviceType ||
        (deviceType === 'usb' && device.type?.toLowerCase().includes('usb')) ||
        (deviceType === 'pci' && device.type?.toLowerCase().includes('pci')) ||
        (deviceType === 'monitor' && device.isMonitor);
      
      return matchesSearch && matchesTrustLevel && matchesDeviceType;
    });
    
    setFilteredDevices(filtered);
  }, [devices, searchTerm, trustLevel, deviceType]);
  
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando dispositivos...</p>
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
              Error al cargar dispositivos
            </h3>
            <div className="mt-2 text-sm text-danger-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {!isEmbedded && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispositivos</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitoreo detallado de todos los dispositivos detectados
          </p>
        </div>
      )}
      
      {/* Filtros */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar dispositivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pr-10"
            />
          </div>
          
          {/* Filtro por nivel de confianza */}
          <select
            value={trustLevel}
            onChange={(e) => setTrustLevel(e.target.value)}
            className="form-input"
          >
            <option value="">Todos los niveles</option>
            <option value="Trusted">Confiable</option>
            <option value="Unknown">Desconocido</option>
            <option value="External">Externo</option>
            <option value="Suspicious">Sospechoso</option>
          </select>
          
          {/* Filtro por tipo de dispositivo (solo en vista completa) */}
          {!isEmbedded && (
            <DeviceTypeFilter
              deviceType={deviceType}
              setDeviceType={setDeviceType}
            />
          )}
        </div>
        
        <div className="text-right text-sm text-gray-500">
          {filteredDevices.length} dispositivos
        </div>
      </div>
      
      {/* Lista de dispositivos */}
      {filteredDevices.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No hay dispositivos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => (
            <DeviceCard key={device._id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceList;