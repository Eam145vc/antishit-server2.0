import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CameraIcon, 
  ExclamationTriangleIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ScreenshotGallery = ({ screenshots: propsScreenshots, playerId, isEmbedded = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [screenshots, setScreenshots] = useState(propsScreenshots || []);
  const [filteredScreenshots, setFilteredScreenshots] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(!propsScreenshots);
  const [error, setError] = useState(null);
  
  // Cargar capturas de pantalla
  useEffect(() => {
    if (propsScreenshots) {
      setScreenshots(propsScreenshots);
      setFilteredScreenshots(propsScreenshots);
      return;
    }
    
    const fetchScreenshots = async () => {
      try {
        setIsLoading(true);
        
        // Usar URL base de la configuración
        const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Sesión expirada, por favor inicie sesión nuevamente');
          navigate('/login');
          return;
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        
        let url = `${apiUrl}/screenshots`;
        if (playerId || id) {
          url = `${apiUrl}/screenshots/player/${playerId || id}`;
        }
        
        console.log('Solicitando capturas de:', url);
        const response = await axios.get(url, { headers });
        console.log('Respuesta de capturas:', response.data);
        
        setScreenshots(response.data);
        setFilteredScreenshots(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar capturas de pantalla:', err);
        setError('Error al cargar capturas de pantalla');
        setScreenshots([]);
        setFilteredScreenshots([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScreenshots();
  }, [propsScreenshots, playerId, id, navigate]);
  
  // Filtrar capturas de pantalla
  useEffect(() => {
    const filtered = screenshots.filter((screenshot) => {
      const matchesSearch = !searchTerm || 
        screenshot.activisionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    setFilteredScreenshots(filtered);
  }, [screenshots, searchTerm]);
  
  // Abrir modal de captura de pantalla
  const openScreenshotModal = async (screenshot) => {
    try {
      // Usar URL base de la configuración
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Sesión expirada, por favor inicie sesión nuevamente');
        navigate('/login');
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await axios.get(`${apiUrl}/screenshots/${screenshot._id}/image`, { headers });
      setSelectedScreenshot({
        ...screenshot,
        imageData: response.data.imageData
      });
    } catch (error) {
      console.error('Error al cargar imagen:', error);
      toast.error('Error al cargar la imagen');
    }
  };
  
  // Cerrar modal de captura de pantalla
  const closeScreenshotModal = () => {
    setSelectedScreenshot(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando capturas de pantalla...</p>
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
            <div className="mt-2">
              <button
                className="rounded-md bg-danger-50 px-2 py-1.5 text-sm font-medium text-danger-800 hover:bg-danger-100"
                onClick={() => window.location.reload()}
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {!isEmbedded && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Capturas de Pantalla</h2>
          <p className="mt-1 text-sm text-gray-500">
            Registro de capturas de pantalla
          </p>
        </div>
      )}
      
      {/* Controles de filtro */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por Activision ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pr-10"
            />
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-500">
          {filteredScreenshots.length} capturas
        </div>
      </div>
      
      {/* Galería de capturas */}
      {filteredScreenshots.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">No hay capturas de pantalla</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredScreenshots.map((screenshot) => (
            <div 
              key={screenshot._id} 
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openScreenshotModal(screenshot)}
            >
              <div className="card-body p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <Link
                      to={`/players/${screenshot.player?._id || screenshot.player}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {screenshot.activisionId}
                    </Link>
                  </div>
                  <span className="text-xs text-gray-500">
                    Canal {screenshot.channelId}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(screenshot.capturedAt), {
                    addSuffix: true,
                    locale: es
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de captura de pantalla */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={closeScreenshotModal}
        >
          <div 
            className="max-w-4xl w-full max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Captura de {selectedScreenshot.activisionId}
              </h3>
              <button
                onClick={closeScreenshotModal}
                className="text-gray-500 hover:text-gray-700"
              >
                Cerrar
              </button>
            </div>
            <div className="p-4 overflow-auto">
              {selectedScreenshot.imageData ? (
                <img 
                  src={`data:image/png;base64,${selectedScreenshot.imageData}`} 
                  alt={`Captura de ${selectedScreenshot.activisionId}`}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="flex h-64 items-center justify-center bg-gray-100">
                  <p className="text-gray-500">No hay imagen disponible</p>
                </div>
              )}
            </div>
            {selectedScreenshot.notes && (
              <div className="p-4 bg-gray-50 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notas</h4>
                <p className="text-sm text-gray-600">{selectedScreenshot.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotGallery;
