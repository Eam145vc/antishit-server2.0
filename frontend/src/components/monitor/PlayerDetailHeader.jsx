import { useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CameraIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const PlayerDetailHeader = ({ player }) => {
  const [isReporting, setIsReporting] = useState(false);
  const { requestScreenshot } = useSocket();
  
  // Verificar si el jugador realmente está conectado
  const lastSeenDate = new Date(player.lastSeen);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const isReallyOnline = player.isOnline && lastSeenDate > fiveMinutesAgo;
  
  const handleRequestScreenshot = async () => {
    try {
      const result = requestScreenshot(player.activisionId, player.currentChannelId);
      if (result) {
        toast.success(`Captura solicitada para ${player.activisionId}`);
      } else {
        toast.error('No se pudo solicitar la captura');
      }
    } catch (error) {
      toast.error('Error al solicitar captura');
    }
  };
  
  const toggleSuspicious = async () => {
    setIsReporting(true);
    try {
      await axios.put(`/api/players/${player._id}/suspect`, {
        suspicious: !player.suspiciousActivity
      });
      // Actualizar localmente mientras se recarga
      player.suspiciousActivity = !player.suspiciousActivity;
      toast.success('Estado de sospechoso actualizado');
    } catch (error) {
      console.error('Error al marcar jugador:', error);
      toast.error('Error al actualizar estado');
    } finally {
      setIsReporting(false);
    }
  };
  
  return (
    <div className="card">
      <div className="card-body p-6">
        <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full ${isReallyOnline ? 'bg-success-500' : 'bg-gray-300'}`}></div>
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                {player.activisionId}
              </h1>
              {player.suspiciousActivity && (
                <span className="ml-3 inline-flex items-center rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-800">
                  <ExclamationTriangleIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                  Sospechoso
                </span>
              )}
            </div>
            {player.nickname && (
              <p className="mt-1 text-sm text-gray-500">
                Nickname: {player.nickname}
              </p>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleRequestScreenshot}
              disabled={!isReallyOnline}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                isReallyOnline
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center">
                <CameraIcon className="mr-1 h-4 w-4" />
                Capturar Pantalla
              </div>
            </button>
            
            <button
              onClick={toggleSuspicious}
              disabled={isReporting}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                player.suspiciousActivity
                  ? 'bg-warning-100 text-warning-800 hover:bg-warning-200'
                  : 'bg-danger-600 text-white hover:bg-danger-700'
              }`}
            >
              <div className="flex items-center">
                <ExclamationTriangleIcon className="mr-1 h-4 w-4" />
                {player.suspiciousActivity ? 'Quitar marca' : 'Marcar sospechoso'}
              </div>
            </button>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-md bg-gray-50 p-4">
            <div className="flex items-center">
              <ComputerDesktopIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <span className="ml-2 text-sm font-medium text-gray-500">Estado:</span>
              <span
                className={`ml-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                  !isReallyOnline
                    ? 'bg-gray-100 text-gray-800'
                    : player.isGameRunning
                    ? 'bg-success-100 text-success-800'
                    : 'bg-warning-100 text-warning-800'
                }`}
              >
                {!isReallyOnline
                  ? 'Desconectado'
                  : player.isGameRunning
                  ? 'Jugando'
                  : 'Conectado'}
              </span>
            </div>
          </div>
          
          <div className="rounded-md bg-gray-50 p-4">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <span className="ml-2 text-sm font-medium text-gray-500">Última actividad:</span>
              <span className="ml-2 text-sm text-gray-700">
                {player.lastSeen
                  ? formatDistanceToNow(new Date(player.lastSeen), {
                      addSuffix: true,
                      locale: es
                    })
                  : 'Desconocido'}
              </span>
            </div>
          </div>
          
          <div className="rounded-md bg-gray-50 p-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500">Canal actual:</span>
              <span className="ml-2 text-sm text-gray-700">
                Canal {player.currentChannelId || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailHeader;
