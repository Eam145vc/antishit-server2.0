import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cargar alertas
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/alerts');
        setAlerts(response.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar alertas');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlerts();
  }, []);
  
  // Filtrar alertas
  useEffect(() => {
    const filtered = alerts.filter((alert) => {
      const matchesSearch = !searchTerm || 
        alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.activisionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = !filterSeverity || alert.severity === filterSeverity;
      
      return matchesSearch && matchesSeverity;
    });
    
    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, filterSeverity]);
  
  // Obtener ícono según tipo de alerta
  const getAlertIcon = (alert) => {
    // Alerta especial para DMA
    if (alert.type === 'dma-device-detected') {
      return (
        <ExclamationTriangleIcon
          className="h-5 w-5 text-danger-500 animate-pulse"
          aria-hidden="true"
        />
      );
    }
    
    // Alertas normales por severidad
    switch (alert.severity) {
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
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando alertas...</p>
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
              Error al cargar alertas
            </h3>
            <div className="mt-2 text-sm text-danger-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Alertas</h2>
        <p className="mt-1 text-sm text-gray-500">
          Registro de eventos y notificaciones del sistema
        </p>
      </div>
      
      {/* Controles de filtro */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar alerta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pr-10"
            />
          </div>
          
          {/* Filtro por severidad */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="form-input"
          >
            <option value="">Todas las severidades</option>
            <option value="high">Crítica</option>
            <option value="medium">Advertencia</option>
            <option value="info">Información</option>
          </select>
        </div>
        
        <div className="text-right text-sm text-gray-500">
          {filteredAlerts.length} alertas
        </div>
      </div>
      
      {/* Lista de alertas */}
      {filteredAlerts.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No hay alertas que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div 
              key={alert._id} 
              className={`card flex items-start p-4 space-x-4 ${alert.type === 'dma-device-detected' ? 'border-danger-500 bg-danger-50' : ''}`}
            >
              <div className="flex-shrink-0 pt-0.5">
                {getAlertIcon(alert)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {alert.message}
                  </p>
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
                
                {/* Información adicional */}
                <div className="mt-2 text-sm text-gray-500">
                  {alert.activisionId && (
                    <div className="mb-1">
                      <span className="font-medium">Jugador:</span>{' '}
                      <Link 
                        to={`/players/${alert.playerId}`} 
                        className="text-primary-600 hover:text-primary-500"
                      >
                        {alert.activisionId}
                      </Link>
                    </div>
                  )}
                  
                  {alert.channelId !== undefined && (
                    <div className="mb-1">
                      <span className="font-medium">Canal:</span>{' '}
                      {alert.channelId}
                    </div>
                  )}
                  
                  {alert.details && (
                    <div className="mt-1 bg-gray-50 p-2 rounded-md">
                      <span className="font-medium">Detalles:</span>{' '}
                      {alert.details}
                    </div>
                  )}
                </div>
                
                {/* Timestamp */}
                <div className="mt-2 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(alert.timestamp), {
                    addSuffix: true,
                    locale: es
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
