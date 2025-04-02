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
  
  // Verificar si el jugador realmente está conectado
  // Consideramos desconectado si:
  // 1. isOnline es false explícitamente
  // 2. Última actividad hace más de 5 minutos
  const lastSeenDate = new Date(player.lastSeen);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const isReallyOnline = player.isOnline && lastSeenDate > fiveMinutesAgo;
  
  return (
    <div className={`card ${player.suspiciousActivity ? 'border-danger-500' : ''}`}>
      {/* Cabecera */}
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center">
          <div className={`h-2.5 w-2.5 rounded-full ${isReallyOnline ? 'bg-success-500' : 'bg-gray-300'}`}></div>
          <h3 className="ml-2 text-sm font-medium text-gray-900">
            <Link to={`/players/${player._id}`} className="hover:text-primary-600">
              {player.activisionId}
            </Link>
          </h3>
        </div>
        {player.suspiciousActivity && (
          <div className="rounded-full bg-danger-100 p-1">
            <ExclamationTri
