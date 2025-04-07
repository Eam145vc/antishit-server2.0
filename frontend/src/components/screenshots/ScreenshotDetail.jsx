import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ScreenshotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [screenshot, setScreenshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchScreenshot = async () => {
      try {
        setIsLoading(true);
        
        // Usar URL base de la configuración
        const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
        const token = localStorage.getItem('token');
        
        if (!token) {
          // Si no hay token, redirigir a login
          toast.error('Sesión expirada, por favor inicie sesión nuevamente');
          navigate('/login');
          return;
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        
        // Obtener los metadatos de la captura
        const response = await axios.get(`${apiUrl}/screenshots/${id}`, { headers });
        
        // Obtener la imagen de la captura
        const imageResponse = await axios.get(`${apiUrl}/screenshots/${id}/image`, { headers });
        
        // Verificar y preparar la imagen
        const imageData = imageResponse.data.imageData;
        
        // Asegurar que la imagen tenga el prefijo correcto para base64
        const base64Image = imageData.startsWith('data:image') 
          ? imageData 
          : `data:image/png;base64,${imageData}`;
        
        setScreenshot({
          ...response.data,
          imageData: base64Image
        });
        
        setError(null);
      } catch (error) {
        console.error('Error al cargar captura de pantalla:', error);
        if (error.response?.status === 404) {
          setError('Captura de pantalla no encontrada');
        } else {
          setError('Error al cargar la captura de pantalla');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScreenshot();
  }, [id, navigate]);
  
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
  
  if (error) {
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
              {error}
            </h3>
            <div className="mt-4 flex">
              <button
                type="button"
                className="rounded-md bg-danger-50 px-2 py-1.5 text-sm font-medium text-danger-800 hover:bg-danger-100 mr-3"
                onClick={() => navigate('/screenshots')}
              >
                Volver a capturas
              </button>
              <button
                type="button"
                className="rounded-md bg-danger-50 px-2 py-1.5 text-sm font-medium text-danger-800 hover:bg-danger-100"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!screenshot) {
    return (
      <div className="rounded-md bg-warning-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon 
              className="h-5 w-5 text-warning-400" 
              aria-hidden="true" 
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-warning-800">
              No se encontró la captura de pantalla
            </h3>
            <div className="mt-2">
              <button
                type="button"
                className="rounded-md bg-warning-50 px-2 py-1.5 text-sm font-medium text-warning-800 hover:bg-warning-100"
                onClick={() => navigate('/screenshots')}
              >
                Volver a la galería de capturas
              </button>
            </div>
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
          {screenshot.imageData ? (
            <img 
              src={screenshot.imageData} 
              alt={`Captura de ${screenshot.activisionId}`}
              className="w-full object-contain max-h-[80vh]"
            />
          ) : (
            <div className="flex h-64 items-center justify-center bg-gray-100">
              <p className="text-gray-500">No hay imagen disponible</p>
            </div>
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
