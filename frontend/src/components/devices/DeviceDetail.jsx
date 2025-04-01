import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeviceDetail = () => {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/devices/${id}`);
        setDevice(response.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar la información del dispositivo');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDeviceData();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando información del dispositivo...</p>
        </div>
      </div>
    );
  }
  
  if (error || !device) {
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
              Error al cargar la información del dispositivo
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
        <h2 className="text-2xl font-bold text-gray-900">Detalle del Dispositivo</h2>
        <p className="mt-1 text-sm text-gray-500">
          Información detallada del dispositivo seleccionado
        </p>
      </div>
      
      {/* Información básica del dispositivo */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">
            {device.name || 'Dispositivo sin nombre'}
          </h3>
        </div>
        <div className="card-body">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">ID del dispositivo</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {device.deviceId}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Tipo</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {device.type || 'Desconocido'}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Fabricante</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {device.manufacturer || 'Desconocido'}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {device.status || 'Desconocido'}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Nivel de confianza</dt>
              <dd className="mt-1 sm:col-span-2 sm:mt-0">
                <span className={`badge ${
                  device.trustLevel === 'Trusted' ? 'badge-success' :
                  device.trustLevel === 'Unknown' ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {device.trustLevel || 'Desconocido'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Link de regreso */}
      <div className="mt-6">
        <Link
          to="/devices"
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          &larr; Volver a la lista de dispositivos
        </Link>
      </div>
    </div>
  );
};

export default DeviceDetail;
