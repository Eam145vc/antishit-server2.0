import { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useSocket } from '../../context/SocketContext';

const ProcessList = ({ processes: initialProcesses = [] }) => {
  const [processes, setProcesses] = useState(initialProcesses);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
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

  // Resto del código anterior permanece igual...
  // [La implementación que ya tenías]

  return (
    <div className="space-y-4">
      {/* Controles de filtro */}
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar proceso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pr-10"
            />
          </div>
          <div className="flex items-center">
            <input
              id="showSuspicious"
              type="checkbox"
              checked={showSuspiciousOnly}
              onChange={() => setShowSuspiciousOnly(!showSuspiciousOnly)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="showSuspicious" className="ml-2 text-sm text-gray-700">
              Solo mostrar sospechosos
            </label>
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-500">
          {processes.length} procesos
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proceso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processes.map((process, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{process.name || 'Desconocido'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{process.pid || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{process.filePath || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {process.memoryUsage 
                        ? `${(process.memoryUsage / (1024 * 1024)).toFixed(2)} MB` 
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {process.isSigned ? (
                      <CheckCircleIcon className="h-5 w-5 text-success-500" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />
                    )}
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
