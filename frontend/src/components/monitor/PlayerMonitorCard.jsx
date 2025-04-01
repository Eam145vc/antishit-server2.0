// src/components/monitor/PlayerMonitorCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CameraIcon,
  ArrowsRightLeftIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PlayerMonitorCard = ({
  player,
  onRequestScreenshot,
  onMovePlayer,
  availableChannels = []
}) => {
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  
  const handleScreenshotRequest = () => {
    onRequestScreenshot(player.activisionId);
  };
  
  const handleMoveClick = () => {
    setShowMoveOptions(!showMoveOptions);
  };
  
  const handleMoveToChannel = (channelId) => {
    onMovePlayer(player.activisionId, channelId);
    setShowMoveOptions(false);
  };
  
  return (
    <div className={`card ${player.suspiciousActivity ? 'border-danger-500' : ''}`}>
      {/* Cabecera */}
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center">
          <div className={`h-2.5 w-2.5 rounded-full ${player.isOnline ? 'bg-success-500' : 'bg-gray-300'}`}></div>
          <h3 className="ml-2 text-sm font-medium text-gray-900">
            <Link to={`/players/${player._id}`} className="hover:text-primary-600">
              {player.activisionId}
            </Link>
          </h3>
        </div>
        {player.suspiciousActivity && (
          <div className="rounded-full bg-danger-100 p-1">
            <ExclamationTriangleIcon className="h-4 w-4 text-danger-600" aria-hidden="true" />
          </div>
        )}
      </div>
      
      {/* Cuerpo */}
      <div className="card-body space-y-4">
        {/* Estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ComputerDesktopIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <span className="ml-2 text-sm text-gray-500">Estado:</span>
          </div>
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              !player.isOnline
                ? 'bg-gray-100 text-gray-800'
                : player.isGameRunning
                ? 'bg-success-100 text-success-800'
                : 'bg-warning-100 text-warning-800'
            }`}
          >
            {!player.isOnline
              ? 'Desconectado'
              : player.isGameRunning
              ? 'Jugando'
              : 'Conectado'}
          </span>
        </div>
        
        {/* Última actividad */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-500">Última actividad:</span>
          </div>
          <span className="text-sm text-gray-700">
            {player.lastSeen
              ? formatDistanceToNow(new Date(player.lastSeen), {
                  addSuffix: true,
                  locale: es
                })
              : 'Desconocido'}
          </span>
        </div>
        
        {/* Dispositivos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DeviceTabletIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <span className="ml-2 text-sm text-gray-500">Dispositivos:</span>
          </div>
          <Link
            to={`/players/${player._id}/devices`}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Ver detalles
          </Link>
        </div>
        
        {/* Última captura */}
        {player.lastScreenshotId && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CameraIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <span className="ml-2 text-sm text-gray-500">Última captura:</span>
            </div>
            <Link
              to={`/screenshots/${player.lastScreenshotId}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver captura
            </Link>
          </div>
        )}
      </div>
      
      {/* Acciones */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <button
            onClick={handleScreenshotRequest}
            disabled={!player.isOnline}
            className={`flex-1 rounded-md py-2 text-xs font-medium ${
              player.isOnline
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center">
              <CameraIcon className="mr-1 h-4 w-4" />
              Capturar
            </div>
          </button>
          
          <div className="relative flex-1">
            <button
              onClick={handleMoveClick}
              disabled={!player.isOnline || availableChannels.length === 0}
              className={`w-full rounded-md py-2 text-xs font-medium ${
                player.isOnline && availableChannels.length > 0
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center">
                <ArrowsRightLeftIcon className="mr-1 h-4 w-4" />
                Mover
              </div>
            </button>
            
            {/* Menú desplegable para mover */}
            {showMoveOptions && availableChannels.length > 0 && (
              <div className="absolute right-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  {availableChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleMoveToChannel(channel.id)}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {channel.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerMonitorCard;