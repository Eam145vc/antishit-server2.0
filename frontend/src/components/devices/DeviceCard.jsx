import { Link } from 'react-router-dom';
import {
  DeviceTabletIcon,
  ComputerDesktopIcon,
  LightBulbIcon,
  UsersIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const DeviceCard = ({ device }) => {
  // Obtener ícono según tipo de dispositivo
  const getDeviceIcon = () => {
    // Priorizar el icono de DMA si es detectado
    if (device.isDMA) {
      return ExclamationTriangleIcon;
    }
    
    if (device.isMonitor) {
      return ComputerDesktopIcon;
    }
    
    if (device.type?.toLowerCase().includes('usb')) {
      return DeviceTabletIcon;
    }
    
    if (device.type?.toLowerCase().includes('pci')) {
      return LightBulbIcon;
    }
    
    return DeviceTabletIcon;
  };
  
  // Obtener clase CSS según nivel de confianza
  const getTrustLevelClass = () => {
    // Si es DMA, usar la clase más severa
    if (device.isDMA) {
      return 'device-suspicious animate-pulse';
    }
    
    switch (device.trustLevel) {
      case 'Trusted':
        return 'device-trusted';
      case 'Unknown':
        return 'device-unknown';
      case 'External':
        return 'device-external';
      case 'Suspicious':
        return 'device-suspicious';
      default:
        return '';
    }
  };
  
  // Obtener badge según nivel de confianza
  const getTrustLevelBadge = () => {
    // Si es DMA, siempre mostrar badge especial
    if (device.isDMA) {
      return <span className="badge-danger animate-pulse">DMA DETECTADO</span>;
    }
    
    switch (device.trustLevel) {
      case 'Trusted':
        return <span className="badge-success">Confiable</span>;
      case 'Unknown':
        return <span className="badge-warning">Desconocido</span>;
      case 'External':
        return <span className="badge-danger">Externo</span>;
      case 'Suspicious':
        return <span className="badge-danger">Sospechoso</span>;
      default:
        return <span className="badge-default">N/A</span>;
    }
  };
  
  // Extraer información de monitor si está disponible
  const getMonitorInfo = () => {
    if (!device.isMonitor && !device.type?.toLowerCase().includes('monitor')) {
      return null;
    }
    
    // Intentar obtener información de varias fuentes posibles
    const resolution = 
      (device.monitorInfo?.resolution) || 
      (device.description?.match(/\d+\s*x\s*\d+/)?.[0]) || 
      'Desconocida';
    
    const manufacturer = 
      device.manufacturer || 
      device.monitorInfo?.manufacturer || 
      'Desconocido';
    
    const model = 
      device.monitorInfo?.model || 
      device.name?.replace(manufacturer, '').trim() || 
      '';
    
    return { resolution, manufacturer, model };
  };
  
  const DeviceIcon = getDeviceIcon();
  const monitorInfo = getMonitorInfo();
  
  return (
    <div className={`card ${getTrustLevelClass()}`}>
      <div className="card-body p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <DeviceIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <Link
                to={`/devices/${device._id}`}
                className="text-lg font-medium text-gray-900 hover:text-primary-600"
              >
                {device.name || 'Dispositivo sin nombre'}
              </Link>
              {getTrustLevelBadge()}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {device.type || 'Tipo desconocido'}
            </div>
            
            {/* Etiquetas del dispositivo - mostrar etiqueta de DMA y otras */}
            {(device.tags && device.tags.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {device.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs rounded-full bg-danger-100 text-danger-800">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Información del fabricante - Mostrar siempre si está disponible */}
            {device.manufacturer && (
              <div className="mt-1 text-sm font-medium text-gray-700">
                Fabricante: {device.manufacturer}
              </div>
            )}
            
            {/* Mostrar descripción del dispositivo - crucial para DMA */}
            {device.description && (
              <div className="mt-1 text-sm text-gray-600">
                Descripción: {device.description}
              </div>
            )}
            
            {/* Información específica de monitor */}
            {monitorInfo && (
              <>
                {monitorInfo.resolution && (
                  <div className="mt-1 text-sm text-gray-600">
                    Resolución: {monitorInfo.resolution}
                  </div>
                )}
                {monitorInfo.model && (
                  <div className="mt-1 text-sm text-gray-600">
                    Modelo: {monitorInfo.model}
                  </div>
                )}
              </>
            )}
            
            {/* Mostrar recursos del dispositivo si hay algo relacionado con DMA */}
            {device.resources && device.resources.dma && (
              <div className="mt-1 text-sm text-gray-600 font-medium">
                DMA: {device.resources.dma}
              </div>
            )}
            
            {/* Estado de conexión */}
            {device.connectionStatus && (
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    device.connectionStatus === 'Connected'
                      ? 'bg-success-100 text-success-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {device.connectionStatus === 'Connected'
                    ? 'Conectado'
                    : 'Desconectado'}
                </span>
              </div>
            )}
            
            {/* Link al jugador */}
            {device.player && (
              <div className="mt-3 flex items-center">
                <UsersIcon className="h-4 w-4 text-gray-400" />
                <Link
                  to={`/players/${device.player._id}`}
                  className="ml-1 text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  {device.player.activisionId || 'Usuario desconocido'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
