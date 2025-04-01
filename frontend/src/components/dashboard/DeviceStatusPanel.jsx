// src/components/dashboard/DeviceStatusPanel.jsx (continuación)
import { Link } from 'react-router-dom';

const DeviceStatusPanel = ({ devices }) => {
  // Obtener clase CSS según nivel de confianza
  const getTrustLevelClass = (trustLevel) => {
    switch (trustLevel) {
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
  const getTrustLevelBadge = (trustLevel) => {
    switch (trustLevel) {
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
  
  if (devices.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No hay dispositivos sospechosos
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200">
      {devices.map((device) => (
        <div
          key={device._id}
          className={`flex items-center p-4 ${getTrustLevelClass(device.trustLevel)}`}
        >
          <div className="min-w-0 flex-1">
            <Link
              to={`/devices/${device._id}`}
              className="block text-sm font-medium text-gray-900 hover:text-primary-600"
            >
              {device.name || 'Dispositivo sin nombre'}
            </Link>
            <div className="mt-1 flex items-center">
              <span className="mr-2 text-xs text-gray-500">
                {device.type || 'Tipo desconocido'}
              </span>
              {getTrustLevelBadge(device.trustLevel)}
            </div>
            {device.manufacturer && (
              <div className="mt-1 text-xs text-gray-500">
                {device.manufacturer}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 text-right">
            <div className="text-xs text-gray-500">
              Jugador:{' '}
              <Link
                to={`/players/${device.player?._id}`}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {device.player?.activisionId || 'N/A'}
              </Link>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Canal: {device.player?.currentChannelId || 'N/A'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeviceStatusPanel;