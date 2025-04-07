import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

const NetworkConnections = ({ connections: initialConnections = [] }) => {
  const [connections, setConnections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProtocol, setFilterProtocol] = useState('');
  const { socket } = useSocket();

  // Normalizar y procesar conexiones de red
  const normalizeConnections = (rawConnections) => {
    return (rawConnections || []).map(connection => {
      // Valores predeterminados para campos faltantes
      const normalizedConnection = {
        localAddress: connection.localAddress || '0.0.0.0',
        localPort: connection.localPort || 0,
        remoteAddress: connection.remoteAddress || '0.0.0.0',
        remotePort: connection.remotePort || 0,
        protocol: connection.protocol || 'Unknown',
        state: connection.state || 'Unknown',
        processName: connection.processName || 'Desconocido',
        processId: connection.processId || 'N/A'
      };

      // Mejora para conexiones UDP
      if (normalizedConnection.protocol === 'UDP') {
        // Para conexiones UDP en estado "Listening", intentar proporcionar más contexto
        if (normalizedConnection.state === 'Listening') {
          normalizedConnection.description = `Escuchando en ${normalizedConnection.localAddress}:${normalizedConnection.localPort}`;
        }
      }

      return normalizedConnection;
    });
  };

  // Cargar conexiones iniciales
  useEffect(() => {
    setConnections(normalizeConnections(initialConnections));
  }, [initialConnections]);

  // Escuchar actualizaciones de socket
  useEffect(() => {
    if (!socket) return;

    const handleMonitorUpdate = (data) => {
      if (data.networkConnections && Array.isArray(data.networkConnections)) {
        setConnections(normalizeConnections(data.networkConnections));
      }
    };

    socket.on('monitor-update', handleMonitorUpdate);

    return () => {
      socket.off('monitor-update', handleMonitorUpdate);
    };
  }, [socket]);

  // Obtener protocolos únicos
  const protocols = [...new Set(connections.map(c => c.protocol).filter(Boolean))];

  // Filtrar conexiones
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = !searchTerm || 
      (connection.localAddress && connection.localAddress.includes(searchTerm)) ||
      (connection.remoteAddress && connection.remoteAddress.includes(searchTerm)) ||
      (connection.processName && connection.processName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProtocol = !filterProtocol || connection.protocol === filterProtocol;
    
    return matchesSearch && matchesProtocol;
  });

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
      
      {connections.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No hay conexiones de red disponibles</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remoto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocolo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proceso</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConnections.map((connection, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {connection.localAddress}:{connection.localPort}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {connection.remoteAddress}:{connection.remotePort}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      connection.protocol === 'TCP' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {connection.protocol || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {connection.state || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {connection.processName || 'Desconocido'}
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

export default NetworkConnections;
