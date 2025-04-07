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
import { useSocket } from '../../context/SocketContext';

const ScreenshotGallery = ({ screenshots: propsScreenshots, playerId, isEmbedded = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requestScreenshot } = useSocket();
  
  const [screenshots, setScreenshots] = useState(propsScreenshots || []);
  const [filteredScreenshots, setFilteredScreenshots] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(!propsScreenshots);
  const [error, setError] = useState(null);
  
  // Solicitar captura de pantalla manualmente
  const handleManualScreenshot = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      
      const response = await axios.get(`${apiUrl}/players/${playerId || id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const { activisionId, currentChannelId } = response.data;
      
      const result = requestScreenshot(activisionId, currentChannelId);
      
      if (result) {
        toast.success('Captura de pantalla solicitada');
      } else {
        toast.error('No se pudo solicitar la captura');
      }
    } catch (error) {
      console.error('Error solicitando captura:', error);
      toast.error('Error al solicitar captura');
    }
  };
  
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
        
        // Preparar capturas con imágenes
        const preparedScreenshots = await Promise.all(
          response.data.map(async (screenshot) => {
            try {
              const imageResponse = await axios.get(`${apiUrl}/screenshots/${screenshot._id}/image`, { headers });
              
              // Asegurar que la imagen tenga el prefijo correcto
              const base64Image = imageResponse.data.imageData.startsWith('data:image')
                ? imageResponse.data.imageData
                : `data:image/png;base64,${imageResponse.data.imageData}`;
              
              return {
                ...screenshot,
                imageData: base64Image
              };
            } catch (imageError) {
              console.error(`Error cargando imagen para screenshot ${screenshot._id}:`, imageError);
              return {
                ...screenshot,
                imageData: null
              };
            }
          })
        );
        
        setScreenshots(preparedScreenshots);
        setFilteredScreenshots(preparedScreenshots);
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
      
      // Asegurar que la imagen tenga el prefijo correcto
      const base64Image = response.data.imageData.startsWith('data:image')
        ? response.data.imageData
        : `data:image/png;base64,${response.data.imageData}`;
      
      setSelectedScreenshot({
        ...screenshot,
        imageData: base64Image
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
          {!isEmbedded && (
            <button 
              onClick={handleManualScreenshot}
              className="btn-primary flex items-center"
            >
              <CameraIcon className="h-5 w-5 mr-2" />
              Capturar Pantalla
            </button>
          )}
        </div>
        
        <div className="text-right text-sm text-gray-500">
          {filteredScreenshots.length} capturas
        </div>
      </div>
      
      {/* Mensaje de carga */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-danger-50 p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-danger-400 mr-3" />
            <p className="text-danger-800">{error}</p>
          </div>
        </div>
      ) : filteredScreenshots.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay capturas de pantalla disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredScreenshots.map((screenshot) => (
            <div 
              key={screenshot._id} 
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openScreenshotModal(screenshot)}
            >
              {screenshot.imageData ? (
                <img 
                  src={screenshot.imageData} 
                  alt={`Captura de ${screenshot.activisionId}`}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">Sin imagen</p>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {screenshot.activisionId}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(screenshot.capturedAt), {
                      addSuffix: true,
                      locale: es
                    })}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Canal {screenshot.channelId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de captura de pantalla */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeScreenshotModal}
        >
          <div 
            className="max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedScreenshot.imageData} 
              alt={`Captura de ${selectedScreenshot.activisionId}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="mt-4 text-center text-white">
              <p>
                Captura de {selectedScreenshot.activisionId} - 
                Canal {selectedScreenshot.channelId} - 
                {new Date(selectedScreenshot.capturedAt).toLocaleString()}
              </p>
              <Link 
                to={`/screenshots/${selectedScreenshot._id}`}
                className="mt-2 inline-block text-primary-300 hover:text-primary-100"
              >
                Ver detalles completos
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotGallery;
