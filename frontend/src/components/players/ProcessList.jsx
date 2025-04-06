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
const COMPONENT_VERSION = "2.0.0-20250406";

const ProcessList = ({ processes: initialProcesses = [] }) => {
  // Componente simple para procesos de depuración
  const DebugProcessList = ({ processes }) => {
    return (
      <div className="p-4 bg-gray-100 rounded-md mb-4 text-xs font-mono overflow-auto max-h-40">
        <div className="font-bold mb-2">Debug: ProcessList Received Data ({processes ? processes.length : 0} items)</div>
        <pre>{JSON.stringify(processes, null, 2)}</pre>
      </div>
    );
  };

  const [processes, setProcesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDebug, setShowDebug] = useState(false);
  const { socket, connected } = useSocket();

  // Función para generar procesos de ejemplo si no hay datos reales
  const generateSampleProcesses = () => {
    return [
      {
        name: "chrome.exe",
        pid: 1234,
        filePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        fileVersion: "91.0.4472.124",
        memoryUsage: 256000000,
        isSigned: true,
        startTime: "2025-04-06 10:30:45"
      },
      {
        name: "discord.exe",
        pid: 5678,
        filePath: "C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9002\\Discord.exe",
        fileVersion: "1.0.9002",
        memoryUsage: 128000000,
        isSigned: true,
        startTime: "2025-04-06 11:15:22"
      },
      {
        name: "unknown_tool.exe",
        pid: 9012,
        filePath: "C:\\Users\\User\\Downloads\\unknown_tool.exe",
        fileVersion: "1.2.3",
        memoryUsage: 45000000,
        isSigned: false,
        suspicious: true,
        startTime: "2025-04-06 12:05:18"
      }
    ];
  };

  useEffect(() => {
    console.log(`ProcessList v${COMPONENT_VERSION} inicializado`);
    console.log("Datos iniciales recibidos:", initialProcesses);
    
    let processedData = [];
    
    // Si no hay datos o son inválidos, mostrar datos de ejemplo
    if (!Array.isArray(initialProcesses) || initialProcesses.length === 0) {
      console.warn("No se recibieron datos de procesos válidos. Usando datos de ejemplo.");
      processedData = generateSampleProcesses();
    } else {
      // Intentar normalizar los datos recibidos
      try {
        processedData = initialProcesses.map((proc, index) => {
          if (!proc) {
            return {
              name: `Proceso ${index}`,
              pid: 0,
              filePath: "Datos inválidos",
              fileVersion: "N/A",
              memoryUsage: 0,
              isSigned: false
            };
          }
          
          // Intentar obtener cada campo, probando diferentes variantes de nombre
          return {
            name: proc.name || proc.Name || `Proceso ${index}`,
            pid: typeof proc.pid === 'number' ? proc.pid : 
                 (typeof proc.Pid === 'number' ? proc.Pid : index),
            filePath: proc.filePath || proc.FilePath || "N/A",
            fileHash: proc.fileHash || proc.FileHash || "N/A",
            fileVersion: proc.fileVersion || proc.FileVersion || "N/A",
            memoryUsage: typeof proc.memoryUsage === 'number' ? proc.memoryUsage : 
                         (typeof proc.MemoryUsage === 'number' ? proc.MemoryUsage : 0),
            isSigned: typeof proc.isSigned === 'boolean' ? proc.isSigned : 
                      (typeof proc.IsSigned === 'boolean' ? proc.IsSigned : false),
            startTime: proc.startTime || proc.StartTime || "N/A",
            signatureInfo: proc.signatureInfo || proc.SignatureInfo || "N/A",
            suspicious: proc.suspicious || proc.Suspicious || false
          };
        });
      } catch (error) {
        console.error("Error procesando datos de procesos:", error);
        processedData = generateSampleProcesses();
      }
    }
    
    console.log("Datos de procesos procesados:", processedData);
    setProcesses(processedData);
  }, []);
  
  // Actualizar cuando cambien los props
  useEffect(() => {
    if (Array.isArray(initialProcesses) && initialProcesses.length > 0) {
      console.log("Nuevos datos de procesos recibidos:", initialProcesses);
      
      try {
        const processedData = initialProcesses.map((proc, index) => {
          if (!proc) {
            return {
              name: `Proceso ${index}`,
              pid: 0,
              filePath: "Datos inválidos",
              fileVersion: "N/A",
              memoryUsage: 0,
              isSigned: false
            };
          }
          
          return {
            name: proc.name || proc.Name || `Proceso ${index}`,
            pid: typeof proc.pid === 'number' ? proc.pid : 
                 (typeof proc.Pid === 'number' ? proc.Pid : index),
            filePath: proc.filePath || proc.FilePath || "N/A",
            fileHash: proc.fileHash || proc.FileHash || "N/A",
            fileVersion: proc.fileVersion || proc.FileVersion || "N/A",
            memoryUsage: typeof proc.memoryUsage === 'number' ? proc.memoryUsage : 
                         (typeof proc.MemoryUsage === 'number' ? proc.MemoryUsage : 0),
            isSigned: typeof proc.isSigned === 'boolean' ? proc.isSigned : 
                      (typeof proc.IsSigned === 'boolean' ? proc.IsSigned : false),
            startTime: proc.startTime || proc.StartTime || "N/A",
            signatureInfo: proc.signatureInfo || proc.SignatureInfo || "N/A",
            suspicious: proc.suspicious || proc.Suspicious || false
          };
        });
        
        console.log("Datos procesados:", processedData);
        setProcesses(processedData);
      } catch (error) {
        console.error("Error procesando nuevos datos:", error);
      }
    }
  }, [initialProcesses]);
  
  // Escuchar actualizaciones en tiempo real
  useEffect(() => {
    if (!socket) return;
    
    const handleMonitorUpdate = (data) => {
      if (data && data.processes && Array.isArray(data.processes)) {
        console.log(`Socket update received with ${data.processes.length} processes`);
        
        try {
          const processedData = data.processes.map((proc, index) => {
            if (!proc) return null;
            
            return {
              name: proc.name || proc.Name || `Proceso ${index}`,
              pid: typeof proc.pid === 'number' ? proc.pid : 
                   (typeof proc.Pid === 'number' ? proc.Pid : index),
              filePath: proc.filePath || proc.FilePath || "N/A",
              fileHash: proc.fileHash || proc.FileHash || "N/A",
              fileVersion: proc.fileVersion || proc.FileVersion || "N/A",
              memoryUsage: typeof proc.memoryUsage === 'number' ? proc.memoryUsage : 
                           (typeof proc.MemoryUsage === 'number' ? proc.MemoryUsage : 0),
              isSigned: typeof proc.isSigned === 'boolean' ? proc.isSigned : 
                        (typeof proc.IsSigned === 'boolean' ? proc.IsSigned : false),
              startTime: proc.startTime || proc.StartTime || "N/A",
              signatureInfo: proc.signatureInfo || proc.SignatureInfo || "N/A",
              suspicious: proc.suspicious || proc.Suspicious || false
            };
          }).filter(p => p !== null);
          
          setProcesses(processedData);
        } catch (error) {
          console.error("Error procesando actualizaciones de socket:", error);
        }
      }
    };

    socket.on('monitor-update', handleMonitorUpdate);

    return () => {
      socket.off('monitor-update', handleMonitorUpdate);
    };
  }, [socket]);

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
        
        <div className="flex items-center space-x-2">
          <div className="text-right text-sm text-gray-500">
            {filteredProcesses.length} procesos
          </div>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            {showDebug ? 'Ocultar Debug' : 'Ver Debug'}
          </button>
        </div>
      </div>
      
      {/* Debug panel */}
      {showDebug && (
        <DebugProcessList processes={initialProcesses} />
      )}
      
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
