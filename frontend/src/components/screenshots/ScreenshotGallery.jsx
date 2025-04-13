import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CameraIcon, 
  ExclamationTriangleIcon, 
  UserGroupIcon,
  CalendarIcon,
  FunnelIcon,
  UserIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

const ScreenshotGallery = ({ screenshots: propsScreenshots, playerId, isEmbedded = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requestScreenshot, connected } = useSocket();
  
  const [screenshots, setScreenshots] = useState(propsScreenshots || []);
  const [filteredScreenshots, setFilteredScreenshots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(!propsScreenshots);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Estados para filtros avanzados
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'user', 'judge'
  
  // Estado para lightbox de imagen
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  // Improved function to determine the origin of a screenshot with better detection
  const forceCorrectSource = (screenshot) => {
    // If the screenshot already has a reliable source field, trust it
    if (screenshot.source === 'judge' || screenshot.source === 'user') {
      return screenshot.source;
    }
    
    // If the type is explicitly set
    if (screenshot.type === 'judge-requested') {
      return 'judge';
    }
    
    // Prioritized checks for judge-requested screenshots
    if (
      // Check for request metadata
      screenshot.requestInfo?.FORCE_JUDGE_TYPE === true ||
      // Check if there's a requestedBy field (judges request)
      screenshot.requestedBy || 
      screenshot.judgeId ||
      // Check request flags
      screenshot.isJudgeRequested === true ||
      screenshot.fromJudge === true
    ) {
      return 'judge';
    }
    
    // Secondary indicators (less reliable)
    const judgeIndicators = [
      // Check for judge references in notes
      screenshot.notes?.toLowerCase()?.includes("judge"),
      screenshot.notes?.toLowerCase()?.includes("dashboard"),
      // Other possible flags
      screenshot.requestSource === 'judge'
    ];
    
    if (judgeIndicators.some(indicator => indicator === true)) {
      return 'judge';
    }
    
    // Default to user if no judge indicators are found
    return 'user';
  };

  // Generar miniatura ficticia para capturas sin imagen
  const generateDummyThumbnail = (screenshot) => {
    const id = screenshot._id || '';
    const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='hsl(${hue}, 70%25, 80%25)' /%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' text-anchor='middle' fill='%23333' dominant-baseline='middle'%3E${screenshot.activisionId || 'Screenshot'}%3C/text%3E%3C/svg%3E`;
  };

  // Función para ver detalles de captura de pantalla
  const viewScreenshot = async (screenshot) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Sesión expirada, por favor inicie sesión de nuevo');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Si ya tenemos los datos de imagen, mostrar directamente
      if (screenshot.imageData) {
        setSelectedScreenshot(screenshot);
        return;
      }

      // Cargar datos de imagen
      const imageResponse = await axios.get(`${apiUrl}/screenshots/${screenshot._id}/image`, { headers });
      
      if (!imageResponse.data || !imageResponse.data.imageData) {
        toast.error('No se pudo cargar la imagen');
        return;
      }

      const imageData = imageResponse.data.imageData.startsWith('data:image')
        ? imageResponse.data.imageData
        : `data:image/png;base64,${imageResponse.data.imageData}`;

      setSelectedScreenshot({
        ...screenshot,
        imageData
      });
    } catch (error) {
      console.error('Error al cargar captura:', error);
      toast.error('Error al cargar captura de pantalla');
    }
  };

  // Componente Lightbox para visualización de capturas
  const ScreenshotLightbox = ({ screenshot, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
    const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
    const resetZoom = () => {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };

    return (
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
        onClick={onClose}
      >
        <div 
          className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Controles de zoom */}
          <div className="absolute top-4 left-4 z-10 flex space-x-2 bg-black bg-opacity-50 rounded-lg p-2">
            <button onClick={zoomOut} className="text-white">-</button>
            <span className="text-white">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="text-white">+</button>
            <button onClick={resetZoom} className="text-white">Reset</button>
          </div>

          {/* Botón de cierre */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white bg-black bg-opacity-50 rounded-full p-2"
          >
            Cerrar
          </button>

          {/* Imagen con zoom */}
          <div 
            className="relative"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease'
            }}
          >
            <img 
              src={screenshot.imageData} 
              alt={`Captura de ${screenshot.activisionId}`}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>

          {/* Información adicional */}
          <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black bg-opacity-50 p-2">
            <p>{screenshot.activisionId} - Canal {screenshot.channelId}</p>
            <p>
              {new Date(screenshot.capturedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Solicitar captura de pantalla manualmente
  const handleManualScreenshot = async () => {
    try {
      setIsRequesting(true);
      toast.loading('Solicitando captura...', { id: 'screenshot-request-toast' });
      
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      
      if (!playerId && !id) {
        toast.error('No se pudo identificar al jugador', { id: 'screenshot-request-toast' });
        return;
      }
      
      const response = await axios.get(`${apiUrl}/players/${playerId || id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const { activisionId, currentChannelId } = response.data;
      
      if (!activisionId || currentChannelId === undefined) {
        toast.error('Información de jugador incompleta', { id: 'screenshot-request-toast' });
        return;
      }
      
      // Solicitar captura
      if (connected) {
        // Using socket with source param
        const result = requestScreenshot(activisionId, currentChannelId, {
          source: 'judge',
          isJudgeRequest: true,
          FORCE_JUDGE_TYPE: true
        });
        
        if (result) {
          toast.success('Captura solicitada', { id: 'screenshot-request-toast' });
        } else {
          // Solicitud de respaldo por HTTP
          await axios.post(`${apiUrl}/screenshots/request`, 
            { 
              activisionId, 
              channelId: currentChannelId,
              source: 'judge',
              isJudgeRequest: true
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          toast.success('Captura solicitada por HTTP', { id: 'screenshot-request-toast' });
        }
      } else {
        // Solo HTTP si no hay conexión de socket
        await axios.post(`${apiUrl}/screenshots/request`, 
          { 
            activisionId, 
            channelId: currentChannelId,
            source: 'judge',
            isJudgeRequest: true
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        toast.success('Captura solicitada', { id: 'screenshot-request-toast' });
      }
      
      // Actualizar después de un tiempo
      setTimeout(() => refreshData(), 10000);
      
    } catch (error) {
      console.error('Error solicitando captura:', error);
      toast.error('Error al solicitar captura', { id: 'screenshot-request-toast' });
    } finally {
      setIsRequesting(false);
    }
  };

  // Función para actualizar datos de capturas
  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      toast.loading('Actualizando capturas...', { id: 'refresh-toast' });
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Sesión expirada');
        navigate('/login');
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      
      let url = `${apiUrl}/screenshots`;
      if (playerId || id) {
        url = `${apiUrl}/screenshots/player/${playerId || id}`;
      }
      
      const response = await axios.get(url, { headers });
      
      if (response.data && Array.isArray(response.data)) {
        const processedScreenshots = await Promise.all(response.data.map(async (screenshot) => {
          const source = forceCorrectSource(screenshot);
          
          let thumbnailUrl = null;
          try {
            const imageResponse = await axios.get(`${apiUrl}/screenshots/${screenshot._id}/image`, { headers });
            
            if (imageResponse.data && imageResponse.data.imageData) {
              thumbnailUrl = imageResponse.data.imageData.startsWith('data:image')
                ? imageResponse.data.imageData
                : `data:image/png;base64,${imageResponse.data.imageData}`;
            }
          } catch (error) {
            console.warn(`No se pudo cargar imagen para captura ${screenshot._id}:`, error);
            thumbnailUrl = generateDummyThumbnail(screenshot);
          }
          
          return {
            ...screenshot,
            source,
            thumbnailUrl
          };
        }));
        
        setScreenshots(processedScreenshots);
        applyFilters(processedScreenshots);
        
        toast.success(`${processedScreenshots.length} capturas cargadas`, { id: 'refresh-toast' });
      } else {
        toast.error('Formato de respuesta inválido', { id: 'refresh-toast' });
      }
      
    } catch (error) {
      console.error('Error actualizando datos:', error);
      toast.error('Error al actualizar capturas', { id: 'refresh-toast' });
    } finally {
      setIsRefreshing(false);
    }
  }, [playerId, id, navigate]);

  // Aplicar filtros
  const applyFilters = useCallback((screenshotsToFilter = screenshots) => {
    const filtered = screenshotsToFilter.filter((screenshot) => {
      const matchesSearch = !searchTerm || 
        screenshot.activisionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateFilter.startDate) {
        const startDate = new Date(dateFilter.startDate);
        startDate.setHours(0, 0, 0, 0);
        const screenshotDate = new Date(screenshot.capturedAt);
        matchesDate = matchesDate && screenshotDate >= startDate;
      }
      
      if (dateFilter.endDate) {
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
        const screenshotDate = new Date(screenshot.capturedAt);
        matchesDate = matchesDate && screenshotDate <= endDate;
      }
      
      let matchesSource = sourceFilter === 'all' || screenshot.source === sourceFilter;
      
      return matchesSearch && matchesDate && matchesSource;
    });
    
    setFilteredScreenshots(filtered);
  }, [searchTerm, dateFilter, sourceFilter, screenshots]);

  // Cargar capturas al inicio o cuando cambian las props
  useEffect(() => {
    if (propsScreenshots) {
      const processedScreenshots = propsScreenshots.map(screenshot => ({
        ...screenshot,
        source: forceCorrectSource(screenshot),
        thumbnailUrl: screenshot.thumbnailUrl || generateDummyThumbnail(screenshot)
      }));
      
      setScreenshots(processedScreenshots);
      applyFilters(processedScreenshots);
      return;
    }
    
    fetchScreenshots();
  }, [propsScreenshots, playerId, id, applyFilters]);

  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    applyFilters();
  }, [searchTerm, dateFilter, sourceFilter, applyFilters]);

  // Cargar capturas desde la API
  const fetchScreenshots = async () => {
    try {
      setIsLoading(true);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Sesión expirada, inicie sesión de nuevo');
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
      
      console.log('Solicitando capturas desde:', url);
      const response = await axios.get(url, { headers });
      console.log('Respuesta de capturas:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Datos de respuesta inválidos, no es un array:', response.data);
        setError('Formato de respuesta inválido');
        setScreenshots([]);
        setFilteredScreenshots([]);
        setIsLoading(false);
        return;
      }
      
      const processedScreenshots = await Promise.all(response.data.map(async screenshot => {
        const source = forceCorrectSource(screenshot);
        
        try {
          const imageResponse = await axios.get(`${apiUrl}/screenshots/${screenshot._id}/image`, { headers });
          let thumbnailUrl;
          
          if (imageResponse.data && imageResponse.data.imageData) {
            thumbnailUrl = imageResponse.data.imageData.startsWith('data:image') 
              ? imageResponse.data.imageData 
              : `data:image/png;base64,${imageResponse.data.imageData}`;
          } else {
            thumbnailUrl = generateDummyThumbnail(screenshot);
          }
          
          return {
            ...screenshot,
            source,
            thumbnailUrl,
            imageData: thumbnailUrl
          };
        } catch (error) {
          console.warn(`No se pudo cargar imagen para captura ${screenshot._id}:`, error);
          return {
            ...screenshot,
            source,
            thumbnailUrl: generateDummyThumbnail(screenshot)
          };
        }
      }));
      
      setScreenshots(processedScreenshots);
      applyFilters(processedScreenshots);
      setError(null);
    } catch (err) {
      console.error('Error cargando capturas:', err);
      setError('Error al cargar capturas');
      setScreenshots([]);
      setFilteredScreenshots([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Restablecer filtros
  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
    setSourceFilter('all');
  };

  return (
    <div className="space-y-6">
      {!isEmbedded && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Capturas de Pantalla</h2>
          <p className="mt-1 text-sm text-gray-500">
            Historial de capturas de pantalla
          </p>
        </div>
      )}
      
      {/* Controles de filtro */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            {/* Búsqueda */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por ID de Activision..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pr-10"
              />
            </div>
            
            {/* Botón de actualización manual */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="btn-primary flex items-center"
              title="Actualizar capturas"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar Capturas'}
            </button>
            
            {/* Botón de solicitud de captura */}
            {!isEmbedded && playerId && (
              <button 
                onClick={handleManualScreenshot}
                disabled={isRequesting}
                className="btn-secondary flex items-center"
              >
                {isRequesting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                    Solicitando...
                  </>
                ) : (
                  <>
                    <CameraIcon className="h-5 w-5 mr-2" />
                    Tomar Captura
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="text-right text-sm text-gray-500">
            {filteredScreenshots.length} capturas
          </div>
        </div>
        
        {/* Filtros avanzados */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Filtros Avanzados</h3>
            <button 
              className="ml-auto text-xs text-primary-600 hover:text-primary-800"
              onClick={() => {
                const filterSection = document.getElementById('advancedFiltersSection');
                if (filterSection) {
                  filterSection.classList.toggle('hidden');
                }
              }}
            >
              Alternar Filtros
            </button>
          </div>
          
          <div id="advancedFiltersSection" className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Filtro de rango de fechas */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Rango de Fechas
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                    className="form-input text-sm"
                    placeholder="Fecha de inicio"
                  />
                  <input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                    className="form-input text-sm"
                    placeholder="Fecha final"
                  />
                </div>
              </div>
            </div>
            
            {/* Filtro de fuente */}
            <div className="col-span-1">
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Fuente
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="all">Todas las fuentes</option>
                  <option value="user">Enviadas por usuarios</option>
                  <option value="judge">Solicitadas por jueces</option>
                </select>
              </div>
            </div>
            
            {/* Botón de reinicio */}
            <div className="col-span-1 flex items-end">
              <button
                onClick={resetFilters}
                className="btn-outline text-sm w-full"
              >
                Reiniciar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Estado de carga */}
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
          <p className="text-gray-500">No hay capturas disponibles</p>
          <button 
            onClick={refreshData}
            className="mt-4 btn-primary"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2 inline" />
            Actualizar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredScreenshots.map((screenshot) => (
            <div 
              key={screenshot._id} 
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-l-4 ${
                screenshot.source === 'user'
                  ? 'border-primary-500' 
                  : 'border-warning-500'
              }`}
            >
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center relative group">
                {screenshot.thumbnailUrl ? (
                  <div className="w-full h-full relative">
                    <img 
                      src={screenshot.thumbnailUrl} 
                      alt={`Vista previa de ${screenshot.activisionId}`}
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => viewScreenshot(screenshot)}
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        screenshot.source === 'user' 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-warning-600 text-white'
                      }`}>
                        {screenshot.source === 'user' ? 'USUARIO' : 'JUEZ'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <CameraIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">Vista previa no disponible</p>
                  </div>
                )}
              </div>
              
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
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span>Canal {screenshot.channelId}</span>
                </div>
                <div className="mt-3 flex justify-end">
                  <Link 
                    to={`/screenshots/${screenshot._id}`}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox para visualización de capturas */}
      {selectedScreenshot && (
        <ScreenshotLightbox 
          screenshot={selectedScreenshot} 
          onClose={() => setSelectedScreenshot(null)} 
        />
      )}
    </div>
  );
};

export default ScreenshotGallery;
