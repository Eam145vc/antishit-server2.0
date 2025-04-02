import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';

const RecentAlertsList = ({ alerts }) => {
  // Obtener icono según severidad
  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'high':
        return (
          <ExclamationTriangleIcon
            className="h-5 w-5 text-danger-500"
            aria-hidden="true"
          />
        );
      case 'medium':
        return (
          <BellAlertIcon className="h-5 w-5 text-warning-500" aria-hidden="true" />
        );
      case 'info':
      default:
        return (
          <InformationCircleIcon
            className="h-5 w-5 text-primary-500"
            aria-hidden="true"
          />
        );
    }
  };
  
  if (alerts.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No hay alertas recientes
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200">
      {alerts.map((alert) => (
        <div key={alert._id} className="flex items-start py-4">
          <div className="flex-shrink-0 pt-0.5">
            {getAlertIcon(alert.severity)}
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900">
              {alert.message}
            </div>
            {alert.activisionId && (
              <div className="mt-1 text-xs text-gray-500">
                Jugador:{' '}
                <Link
                  to={`/players/${alert.playerId}`}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {alert.activisionId}
                </Link>
              </div>
            )}
            {alert.channelId !== undefined && (
              <div className="mt-1 text-xs text-gray-500">
                Canal: {alert.channelId}
              </div>
            )}
            <div className="mt-1 text-xs text-gray-500">
              {alert.timestamp
                ? formatDistanceToNow(new Date(alert.timestamp), {
                    addSuffix: true,
                    locale: es
                  })
                : 'Fecha desconocida'}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <span
              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                alert.severity === 'high'
                  ? 'bg-danger-100 text-danger-800'
                  : alert.severity === 'medium'
                  ? 'bg-warning-100 text-warning-800'
                  : 'bg-primary-100 text-primary-800'
              }`}
            >
              {alert.severity === 'high'
                ? 'Crítica'
                : alert.severity === 'medium'
                ? 'Advertencia'
                : 'Info'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentAlertsList;
