import React from 'react';
import { 
  DeviceTabletIcon, 
  CameraIcon, 
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const PlayerDetailsHoverCard = ({ player }) => {
  if (!player) return null;

  return (
    <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {player.activisionId}
        </h3>
        {player.suspiciousActivity && (
          <span className="inline-flex items-center rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-800">
            <ExclamationTriangleIcon className="mr-1 h-4 w-4" />
            Sospechoso
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Global Statistics */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">Estadísticas Globales</h4>
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-primary-500 mr-2" />
            <span className="text-sm text-gray-900">
              Estado: {player.isOnline ? (player.isGameRunning ? 'Jugando' : 'Conectado') : 'Desconectado'}
            </span>
          </div>
          <div className="flex items-center">
            <DeviceTabletIcon className="h-5 w-5 text-warning-500 mr-2" />
            <span className="text-sm text-gray-900">
              Canal: {player.currentChannelId}
            </span>
          </div>
        </div>

        {/* Device and Screenshot Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">Resumen</h4>
          <div className="flex items-center">
            <DeviceTabletIcon className="h-5 w-5 text-success-500 mr-2" />
            <span className="text-sm text-gray-900">
              Dispositivos: {player.deviceCount || 0}
            </span>
          </div>
          <div className="flex items-center">
            <CameraIcon className="h-5 w-5 text-primary-500 mr-2" />
            <span className="text-sm text-gray-900">
              Capturas: {player.screenshotCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Contextual Information */}
      <div className="border-t pt-2">
        <div className="text-xs text-gray-500">
          Última actividad: {player.lastSeen ? new Date(player.lastSeen).toLocaleString() : 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailsHoverCard;
