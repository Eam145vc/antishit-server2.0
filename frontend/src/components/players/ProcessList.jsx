// src/components/players/ProcessList.jsx
import { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const ProcessList = ({ processes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
  
  // Función de ordenamiento
  const sortProcesses = (a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'memoryUsage') {
      return sortDirection === 'asc'
        ? a.memoryUsage - b.memoryUsage
        : b.memoryUsage - a.memoryUsage;
    } else if (sortField === 'startTime') {
      const dateA = a.startTime ? new Date(a.startTime) : new Date(0);
      const dateB = b.startTime ? new Date(b.startTime) : new Date(0);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
    return 0;
  };
  
  // Función para cambiar el campo de ordenamiento
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filtrar procesos
  const filteredProcesses = processes.filter(
    (process) => {
      // Filtro por búsqueda
      const matchesSearch = !searchTerm || 
        process.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.filePath?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por sospechosos
      const matchesSuspicious = !showSuspiciousOnly || process.suspicious || !process.isSigned;
      
      return matchesSearch && matchesSuspicious;
    }
  ).sort(sortProcesses);
  
  // Formatear tamaño en MB
  const formatMemorySize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };
  
  if (!processes || processes.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-6 text-center">
        <p className="text-gray-500">No hay información de procesos disponible</p>
      </div>
    );
  }
  
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
          {filteredProcesses.length} procesos
        </div>
      </div>
      
      {/* Tabla de procesos */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Nombre
                  {sortField === 'name' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                onClick={() => handleSort('memoryUsage')}
              >
                <div className="flex items-center">
                  Memoria
                  {sortField === 'memoryUsage' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                onClick={() => handleSort('startTime')}
              >
                <div className="flex items-center">
                  Inicio
                  {sortField === 'startTime' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Firmado
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                PID
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredProcesses.map((process, index) => (
              <tr key={process.pid || index}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {process.name}
                  </div>
                  {process.filePath && (
                    <div className="text-xs text-gray-500">{process.filePath}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatMemorySize(process.memoryUsage)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {process.startTime || 'N/A'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {process.isSigned ? (
                    <CheckCircleIcon className="h-5 w-5 text-success-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {process.pid}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcessList;