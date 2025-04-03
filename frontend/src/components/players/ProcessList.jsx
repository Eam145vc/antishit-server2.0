import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/solid';
import { useSocket } from '../../context/SocketContext';

const ProcessList = ({ processes: initialProcesses = [] }) => {
  const [processes, setProcesses] = useState(initialProcesses);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { socket } = useSocket();

  // Escuchar actualizaciones en tiempo real de procesos
  useEffect(() => {
    if (!socket) return;

    const handleMonitorUpdate = (data) => {
      if (data.processes) {
        setProcesses(data.processes);
      }
    };

    socket.on('monitor-update', handleMonitorUpdate);

    return () => {
      socket.off('monitor-update', handleMonitorUpdate);
    };
  }, [socket]);

  // Clasificar nivel de sospecha de un proceso
  const getProcessThreatLevel = (process) => {
    // Proceso legítimo y firmado
    if (process.isSigned) return 'trusted';
    
    // Proceso potencialmente sospechoso
    if (process.suspicious) return 'suspicious';
    
    // Proceso desconocido o sin firma
    return 'unknown';
  };

  // Renderizar ícono según el nivel de sospecha
  const renderThreatIcon = (process) => {
    const threatLevel = getProcessThreatLevel(process);
    
    switch (threatLevel) {
      case 'trusted':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'suspicious':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      case 'unknown':
        return <InformationCircleIcon className="h-5 w-5 text-primary-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-danger-500" />;
    }
  };

  // Obtener color de fila según nivel de sospecha
  const getRowColorClass = (process) => {
    const threatLevel = getProcessThreatLevel(process);
    
    switch (threatLevel) {
      case 'trusted':
        return 'bg-success-50';
      case 'suspicious':
        return 'bg-warning-50';
      case 'unknown':
        return 'bg-primary-50';
      default:
        return 'bg-danger-50';
    }
  };

  // Filtrar procesos
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = !searchTerm || 
      process.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.filePath?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'trusted' && process.isSigned) ||
      (filterType === 'suspicious' && process.suspicious) ||
      (filterType === 'unknown' && !process.isSigned);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Controles de filtro */}
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar proceso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pr-10"
            />
          </div>
          
          {/* Filtro por tipo de proceso */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-input"
          >
            <option value="all">Todos los procesos</option>
            <option value="trusted">Procesos Confiables</option>
            <option value="suspicious">Procesos Sospechosos</option>
            <option value="unknown">Procesos Desconocidos</option>
          </select>
        </div>
        
        <div className="text-right text-sm text-gray-500">
          {filteredProcesses.length} procesos
        </div>
      </div>
      
      {/* Tabla de procesos */}
      {processes.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No hay procesos activos</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proceso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta del Archivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versión</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProcesses.map((process, index) => (
                <tr 
                  key={index} 
                  className={`${getRowColorClass(process)} hover:bg-opacity-75`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderThreatIcon(process)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {process.name || 'Desconocido'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{process.pid || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {process.filePath || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {process.memoryUsage 
                        ? `${(process.memoryUsage / (1024 * 1024)).toFixed(2)} MB` 
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {process.fileVersion || 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProcessList;
