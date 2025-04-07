import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

const ProcessList = ({ processes: initialProcesses = [] }) => {
  const [processes, setProcesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processType, setProcessType] = useState('all');
  const [showDebug, setShowDebug] = useState(false);
  const { socket } = useSocket();

  // Función para clasificar procesos
  const categorizeProcess = (process) => {
    const systemProcessKeywords = [
      'svchost', 'winlogon', 'system', 'csrss', 'lsass', 'explorer', 
      'taskmgr', 'spoolsv', 'services', 'audiodg', 'dwm', 'searchindexer'
    ];

    const processNameLower = process.name.toLowerCase();
    return systemProcessKeywords.some(keyword => 
      processNameLower.includes(keyword)) ? 'system' : 'user';
  };

  // Normalizar y procesar procesos
  useEffect(() => {
    try {
      const normalizedProcesses = (initialProcesses || []).map(proc => ({
        name: proc.name || 'Proceso desconocido',
        filePath: proc.filePath || 'Ruta no disponible',
        commandLine: proc.commandLine || 'Línea de comando no disponible',
        startTime: proc.startTime || 'Hora de inicio desconocida',
        type: categorizeProcess(proc)
      }));

      setProcesses(normalizedProcesses);
    } catch (error) {
      console.error('Error procesando procesos:', error);
      setProcesses([]);
    }
  }, [initialProcesses]);

  // Escuchar actualizaciones de socket
  useEffect(() => {
    if (!socket) return;

    const handleMonitorUpdate = (data) => {
      if (data.processes && Array.isArray(data.processes)) {
        const normalizedProcesses = data.processes.map(proc => ({
          name: proc.name || 'Proceso desconocido',
          filePath: proc.filePath || 'Ruta no disponible',
          commandLine: proc.commandLine || 'Línea de comando no disponible',
          startTime: proc.startTime || 'Hora de inicio desconocida',
          type: categorizeProcess(proc)
        }));

        setProcesses(normalizedProcesses);
      }
    };

    socket.on('monitor-update', handleMonitorUpdate);

    return () => {
      socket.off('monitor-update', handleMonitorUpdate);
    };
  }, [socket]);

  // Filtrar procesos
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = !searchTerm || 
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.commandLine.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = processType === 'all' || process.type === processType;
    
    return matchesSearch && matchesType;
  });

  // Debug component para mostrar datos completos del proceso
  const DebugProcessList = () => (
    <div className="p-4 bg-gray-100 rounded-md mb-4 text-xs font-mono overflow-auto max-h-40">
      <div className="font-bold mb-2">Debug: ProcessList Raw Data ({processes.length} items)</div>
      <pre>{JSON.stringify(initialProcesses, null, 2)}</pre>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controles de filtro */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar proceso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
          
          {/* Filtro por tipo de proceso */}
          <select
            value={processType}
            onChange={(e) => setProcessType(e.target.value)}
            className="form-input"
          >
            <option value="all">Todos los procesos</option>
            <option value="system">Procesos del Sistema</option>
            <option value="user">Procesos de Usuario</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
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
      {showDebug && <DebugProcessList />}
      
      {/* Lista de procesos */}
      {filteredProcesses.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No hay procesos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Línea de Comando</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora de Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProcesses.map((process, index) => (
                <tr key={index} 
                    className={`
                      ${process.type === 'system' 
                        ? 'bg-gray-50 hover:bg-gray-100' 
                        : 'hover:bg-gray-50'
                      }`
                    }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {process.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                    {process.commandLine}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {process.startTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      inline-flex rounded-full px-2 py-1 text-xs font-medium
                      ${process.type === 'system' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-primary-100 text-primary-800'}
                    `}>
                      {process.type === 'system' ? 'Sistema' : 'Usuario'}
                    </span>
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
