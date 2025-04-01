import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ScreenshotDetail = () => {
  const { id } = useParams();
  const [screenshot, setScreenshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchScreenshot = async () => {
      try {
        setIsLoading(true);
        // Obtener los metadatos de la captura
        const response = await axios.get(`/api/screenshots/${id}`);
        // Obtener la imagen de la captura
        const imageResponse = await axios.get(`/api/screenshots/${id}/image`);
        
        setScreenshot({
          ...response.data,
          imageData: imageResponse.data.imageData
        });
        setError(null);
      } catch (err) {
        setError('Error al cargar la captura de pantalla');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScreenshot();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando captura de pantalla...</p>
        </div>
      </div>
    );
  }
  
  if (error || !screenshot) {
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
              Error al cargar la captura de pantalla
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
        <h2 className="text-2xl font-bold text-gray-900">Captura de Pantalla</h2>
        <p className="mt-1 text-sm text-gray-500">
          Captura de {screenshot.activisionId} tomada el {new Date(screenshot.capturedAt).toLocaleString()}
        </p>
      </div>
      
      {/* Imagen */}
      <div className="card overflow-hidden">
        <div className="card-body p-0">
          {screenshot.imageData && (
            <img 
              src={`data:image/png;base64,${screenshot.imageData}`} 
              alt={`Captura de ${screenshot.activisionId}`}
              className="w-full"
            />
          )}
        </div>
      </div>
      
      {/* Información adicional */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Información</h3>
        </div>
        <div className="card-body">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Jugador</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <Link
                  to={`/players/${screenshot.player?._id}`}
                  className="text-primary-600 hover:text-primary-500"
                >
                  {screenshot.activisionId}
                </Link>
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Canal</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                Canal {screenshot.channelId}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Fecha</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {new Date(screenshot.capturedAt).toLocaleString()}
              </dd>
            </div>
            {screenshot.notes && (
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Notas</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {screenshot.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* Link de regreso */}
      <div className="mt-6">
        <Link
          to="/screenshots"
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          &larr; Volver a la galería de capturas
        </Link>
      </div>
    </div>
  );
};

export default ScreenshotDetail;
