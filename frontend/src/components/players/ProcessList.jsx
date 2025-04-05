// Path: frontend/src/components/players/ProcessList.jsx

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

  // Ensure processes is always an array
  useEffect(() => {
    setProcesses(Array.isArray(initialProcesses) ? initialProcesses : []);
  }, [initialProcesses]);

  // Listen for real-time process updates
  useEffect(() => {
    if (!socket) return;

    const handleMonitorUpdate = (data) => {
      if (data.processes && Array.isArray(data.processes)) {
        setProcesses(data.processes);
      }
    };

    socket.on('monitor-update', handleMonitorUpdate);

    return () => {
      socket.off('monitor-update', handleMonitorUpdate);
    };
  }, [socket]);

  // Classify process threat level
  const getProcessThreatLevel = (process) => {
    // Properly handle undefined/null process
    if (!process) return 'unknown';
    
    // Explicitly signed process
    if (process.isSigned === true) return 'trusted';
    
    // Explicitly suspicious process
    if (process.suspicious === true) return 'suspicious';
    
    // Default for unsigned/unknown processes
    return 'unknown';
  };

  // Render icon based on threat level
  const renderThreatIcon = (process) => {
    const threatLevel = getProcessThreatLevel(process);
    
    switch (threatLevel) {
      case 'trusted':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'suspicious':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      case 'unknown':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-primary-500" />;
    }
  };

  // Get row color class based on threat level
  const getRowColorClass = (process) => {
    const threatLevel = getProcessThreatLevel(process);
    
    switch (threatLevel) {
      case 'trusted':
        return 'bg-success-50';
      case 'suspicious':
        return 'bg-warning-50';
      case 'unknown':
      default:
        return '';
    }
  };

  // Format process memory usage
  const formatMemory = (memoryBytes) => {
    if (!memoryBytes || isNaN(memoryBytes)) return 'N/A';
    
    const mb = memoryBytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Filter processes based on search term and filter type
  const filteredProcesses = processes.filter(process => {
    if (!process) return false;
    
    const matchesSearch = !searchTerm || 
      (process.name && process.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (process.filePath && process.filePath.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'trusted' && process.isSigned === true) ||
      (filterType === 'suspicious' && process.suspicious === true) ||
      (filterType === 'unknown' && process.isSigned !== true);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar proceso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pr-10"
            />
          </div>
          
          {/* Filter by process type */}
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
      
      {/* Process table */}
      {processes.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No hay datos de procesos disponibles</p>
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
                      {formatMemory(process.memoryUsage)}
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
