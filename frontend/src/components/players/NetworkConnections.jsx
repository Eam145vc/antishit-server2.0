import { useState } from 'react';

const NetworkConnections = ({ connections }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProtocol, setFilterProtocol] = useState('');
  
  // Verificar si hay conexiones
  const hasConnections = Array.isArray(connections) && connections.length > 0;
  
  // Filtrar conexiones
  const filteredConnections = hasConnections ? connections.filter(
    (connection) => {
      // Filtro por búsqueda
      const matchesSearch = !searchTerm || 
        (connection.remoteAddress && connection.remoteAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (connection.processName && connection.processName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro por protocolo
      const matchesProtocol = !filterProtocol || connection.protocol === filterProtocol;
      
      return matchesSearch && matchesProtocol;
    }
  ) : [];
  
  // Obtener protocolos únicos
  const protocols = hasConnections 
    ? [...new Set(connections.filter(c => c.protocol).map(c => c.protocol))]
    : [];
  
  if (!hasConnections) {
    return (
      <div className="rounded-md bg-gray-50 p-6 text-center">
        <p className="text-gray-500">No hay información de conexiones disponible</p>
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
              placeholder="Buscar conexión..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pr-10"
            />
          </div>
          {protocols.length > 0 && (
            <select
              value={filterProtocol}
              onChange={(e) => setFilterProtocol(e.target.value)}
              className="form-input"
            >
              <option value="">Todos los protocolos</option>
              {protocols.map((protocol) => (
                <option key={protocol} value={protocol}>
                  {protocol}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="text-right text-sm text-gray-500">
          {filteredConnections.length} conexiones
        </div>
      </div>
      
      {/* Tabla de conexiones */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Proceso
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Local
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Remoto
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Protocolo
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredConnections.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay conexiones que coincidan con los filtros
                </td>
              </tr>
            ) : (
              filteredConnections.map((connection, index) => (
                <tr key={index}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {connection.processName || 'Desconocido'}
                    </div>
                    {connection.processId && (
                      <div className="text-xs text-gray-500">PID: {connection.processId}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {connection.localAddress || ''}
                    {connection.localPort ? `:${connection.localPort}` : ''}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {connection.remoteAddress || ''}
                    {connection.remotePort ? `:${connection.remotePort}` : ''}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {connection.protocol ? (
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          connection.protocol === 'TCP'
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-warning-100 text-warning-800'
                        }`}
                      >
                        {connection.protocol}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {connection.state || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NetworkConnections;
