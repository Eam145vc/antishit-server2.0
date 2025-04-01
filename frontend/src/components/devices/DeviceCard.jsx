// src/components/devices/DeviceCard.jsx
import { Link } from 'react-router-dom';
import {
  DeviceTabletIcon,
  ComputerDesktopIcon,
  LightBulbIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const DeviceCard = ({ device }) => {
  // Obtener ícono según tipo de dispositivo
  const getDeviceIcon = () => {
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
  
  const DeviceIcon = getDeviceIcon();
  
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
            {device.manufacturer && (
              <div className="mt-1 text-sm text-gray-500">
                Fabricante: {device.manufacturer}
              </div>
            )}
            {device.isMonitor && device.monitorInfo?.resolution && (
              <div className="mt-1 text-sm text-gray-500">
                Resolución: {device.monitorInfo.resolution}
              </div>
            )}
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