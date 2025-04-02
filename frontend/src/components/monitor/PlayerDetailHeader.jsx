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
