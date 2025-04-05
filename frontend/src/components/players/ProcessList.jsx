// Path: frontend/src/components/players/ProcessList.jsx

import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/solid';
import { useSocket } from '../../context/SocketContext';

// Version info to track updates
const COMPONENT_VERSION = "1.2.0-20250405";

const ProcessList = ({ processes: initialProcesses = [] }) => {
  const [processes, setProcesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [debugInfo, setDebugInfo] = useState({
    version: COMPONENT_VERSION,
    timestamp: new Date().toISOString(),
    receivedCount: Array.isArray(initialProcesses) ? initialProcesses.length : 0,
    hasSocketConnection: false
  });
  const { socket, connected } = useSocket();

  useEffect(() => {
    // Log component initialization with version
    console.log(`ProcessList component initialized: v${COMPONENT_VERSION}`);
    console.log(`Initial processes: ${Array.isArray(initialProcesses) ? initialProcesses.length : 'not an array'}`);
    
    if (Array.isArray(initialProcesses) && initialProcesses.length > 0) {
      console.log("First process sample:", initialProcesses[0]);
    }
    
    // Initialize processes safely
    if (Array.isArray(initialProcesses)) {
      setProcesses(initialProcesses);
    } else {
      console.error("initialProcesses is not an array:", initialProcesses);
      // Create a placeholder
      setProcesses([
        {
          name: "Error de formato",
          pid: 0,
          filePath: `Datos inválidos: ${typeof initialProcesses}`,
          fileVersion: "N/A",
          memoryUsage: 0,
          isSigned: false
        }
      ]);
    }
  }, []);
  
  // Update when new processes are passed as props
  useEffect(() => {
    if (Array.isArray(initialProcesses)) {
      setProcesses(initialProcesses);
      setDebugInfo(prev => ({
        ...prev,
        receivedCount: initialProcesses.length,
        lastUpdate: new Date().toISOString()
      }));
    }
  }, [initialProcesses]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;
    
    setDebugInfo(prev => ({
      ...prev,
      hasSocketConnection: connected
    }));

    const handleMonitorUpdate = (data) => {
      if (data && data.processes) {
        console.log(`Socket update received with ${Array.isArray(data.processes) ? data.processes.length : 'invalid'} processes`);
        
        if (Array.isArray(data.processes)) {
          setProcesses(data.processes);
          setDebugInfo(prev => ({
            ...prev,
            receivedCount: data.processes.length,
            lastUpdate: new Date().toISOString(),
            socketUpdate: true
          }));
        }
      }
    };

    socket.on('monitor-update', handleMonitorUpdate);

    return () => {
      socket.off('monitor-update', handleMonitorUpdate);
    };
  }, [socket, connected]);

  // Display a debug button in development
  const DebugButton = () => {
    return process.env.NODE_ENV === 'development' || true ? (
      <button 
        onClick={() => alert(JSON.stringify(debugInfo, null, 2))}
        className="text-xs bg-gray-200 px-2 py-1 rounded"
      >
        Debug v{COMPONENT_VERSION}
      </button>
    ) : null;
  };

  // Get process threat level icon
  const getProcessThreatLevel = (process) => {
    if (!process) return 'unknown';
    
    if (process.isSigned === true) return 'trusted';
    if (process.suspicious === true) return 'suspicious';
    
    return 'unknown';
  };

  // Render threat icon
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

  // Get row color class
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

  // Filter processes
  const filteredProcesses = Array.isArray(processes) ? processes.filter(process => {
    if (!process) return false;
    
    const matchesSearch = !searchTerm || 
      (process.name && process.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (process.filePath && process.filePath.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'trusted' && process.isSigned === true) ||
      (filterType === 'suspicious' && process.suspicious === true) ||
      (filterType === 'unknown' && process.isSigned !== true);
    
    return matchesSearch && matchesFilter;
  }) : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
          
          {/* Filter */}
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
        
        <div className="flex items-center">
          <div className="text-right text-sm text-gray-500 mr-2">
            {filteredProcesses.length} procesos
          </div>
          <DebugButton />
        </div>
      </div>
      
      {/* Handle various error states */}
      {!Array.isArray(processes) ? (
        <div className="rounded-md bg-danger-50 p-6 text-center">
          <p className="text-danger-500">Error: Los datos de procesos no son válidos</p>
          <p className="text-sm text-gray-500 mt-2">Tipo recibido: {typeof processes}</p>
        </div>
      ) : processes.length === 0 ? (
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
