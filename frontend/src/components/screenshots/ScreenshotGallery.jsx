import { useState, useEffect, useCallback, useRef } from 'react';
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
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

const ScreenshotGallery = ({ screenshots: propsScreenshots, playerId, isEmbedded = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requestScreenshot, connected } = useSocket();
  
  const [screenshots, setScreenshots] = useState([]);
  const [filteredScreenshots, setFilteredScreenshots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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

  // Función para determinar la fuente de una captura
  const forceCorrectSource = useCallback((screenshot) => {
    if (!screenshot) return 'user';
    
    // Si la captura ya tiene un campo source confiable, confía en él
    if (screenshot.source === 'judge' || screenshot.source === 'user') {
      return screenshot.source;
    }
    
    // Si el tipo está explícitamente establecido
    if (screenshot.type === 'judge-requested') {
      return 'judge';
    }
    
    // Comprobaciones priorizadas para capturas solicitadas por jueces
    if (
      // Verificar metadatos de la solicitud
      screenshot.requestInfo?.FORCE_JUDGE_TYPE === true ||
      // Verificar si hay un campo requestedBy (solicitud de jueces)
      screenshot.requestedBy || 
      screenshot.judgeId ||
      // Verificar banderas de solicitud
      screenshot.isJudgeRequested === true ||
      screenshot.fromJudge === true
    ) {
      return 'judge';
    }
    
    // Indicadores secundarios (menos confiables)
    const judgeIndicators = [
      // Buscar referencias a jueces en las notas
      screenshot.notes?.toLowerCase()?.includes("judge"),
      screenshot.notes?.toLowerCase()?.includes("dashboard"),
      // Otras posibles banderas
      screenshot.requestSource === 'judge'
    ];
    
    if (judgeIndicators.some(indicator => indicator === true)) {
      return 'judge';
    }
    
    // Por defecto, si no se encuentran indicadores de juez, es del usuario
    return 'user';
  }, []);

  // Generar miniatura ficticia para capturas sin imagen
  const generateDummyThumbnail = useCallback((screenshot) => {
    if (!screenshot) {
      return 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#999">No disponible</text></svg>';
    }
    
    // Asegurarnos de que cada hash sea único y determinista
    const getHashCode = (str) => {
      if (!str) return 0;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a 32 bits
      }
      return Math.abs(hash);
    };

    const id = screenshot._id || screenshot.activisionId || 'Unknown';
    const hash = getHashCode(id);
    const hue = hash % 360;
    const saturation = 70 + (hash % 30); // Variar saturación
    const lightness = 70 + (hash % 20); // Variar luminosidad

    // SVG más detallado con texto y gradiente
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'>
        <defs>
          <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' style='stop-color:hsl(${hue}, ${saturation}%, ${lightness}%);stop-opacity:0.8' />
            <stop offset='100%' style='stop-color:hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness - 10}%);stop-opacity:1' />
          </linearGradient>
        </defs>
        <rect width='300' height='200' fill='url(#grad)' />
        <text x='50%' y='50%' font-family='Arial' font-size='24' text-anchor='middle' fill='rgba(255,255,255,0.8)' dominant-baseline='middle'>
          ${screenshot.activisionId || 'Screenshot'}
        </text>
        <text x='50%' y='70%' font-family='Arial' font-size='14' text-anchor='middle' fill='rgba(255,255,255,0.6)'>
          Canal ${screenshot.channelId || 'N/A'}
        </text>
      </svg>
    `)}`;
  }, []);

  // Componente Lightbox para visualización de capturas
  const ScreenshotLightbox = ({ screenshot, onClose }) => {
    const lightboxRef = useRef(null);

    const handleOverlayClick = (e) => {
      if (e.target === lightboxRef.current) {
        onClose();
      }
    };

    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [onClose]);

    if (!screenshot) return null;

    return (
      <div 
        ref={lightboxRef}
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4 overflow-auto"
        onClick={handleOverlayClick}
      >
        <div 
          className="relative max-w-[90vw] max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cierre */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Imagen */}
          <div className="flex justify-center items-center h-full">
            <img 
              src={screenshot.imageData || generateDummyThumbnail(screenshot)} 
              alt={`Captura de ${screenshot.activisionId || 'jugador'}`}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>

          {/* Información adicional */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 text-center">
            <p className="text-sm">
              {screenshot.activisionId || 'Jugador'} - Canal {screenshot.channelId || 'N/A'}
            </p>
            <p className="text-xs">
              {screenshot.capturedAt ? new Date(screenshot.capturedAt).toLocaleString() : 'Fecha desconocida'} - 
              {screenshot.source === 'judge' ? ' Solicitado por juez' : ' Enviado por cliente'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Función para ver detalles de captura de pantalla
  const viewScreenshot = async (screenshot) => {
    if (!screenshot || !screenshot._id) {
      toast.error('Datos de captura incompletos');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Sesión expirada, por favor inicie sesión de nuevo');
        navigate('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Si ya tenemos los datos de imagen, mostrar directamente
      if (screenshot.imageData) {
        setSelectedScreenshot(screenshot);
        return;
      }

      // Cargar datos de imagen
      try {
        const imageResponse = await axios.get(`${apiUrl}/screenshots/${screenshot._id}/image`, { headers });
        
        if (!imageResponse.data || !imageResponse.data.imageData) {
          setSelectedScreenshot({
            ...screenshot,
            imageData: generateDummyThumbnail(screenshot)
          });
          return;
        }

        const imageData = imageResponse.data.imageData.startsWith('data:image')
          ? imageResponse.data.imageData
          : `data:image/png;base64,${imageResponse.data.imageData}`;

        setSelectedScreenshot({
          ...screenshot,
          imageData
        });
      } catch (imageError) {
        console.error('Error al cargar imagen:', imageError);
        setSelectedScreenshot({
          ...screenshot,
          imageData: generateDummyThumbnail(screenshot)
        });
      }
    } catch (error) {
      console.error('Error al cargar captura:', error);
      toast.error('Error al cargar captura de pantalla');
    }
  };

  // Solicitar captura de pantalla manualmente
  const handleManualScreenshot = async () => {
    try {
      setIsRequesting(true);
      const toastId = toast.loading('Solicitando captura...');
      
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      
      if (!playerId && !id) {
        toast.error('No se pudo identificar al jugador', { id: toastId });
        setIsRequesting(false);
        return;
      }
      
      const effectiveId = playerId || id;
      
      try {
        const response = await axios.get(`${apiUrl}/players/${effectiveId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const { activisionId, currentChannelId } = response.data;
        
        if (!activisionId || currentChannelId === undefined) {
          toast.error('Información de jugador incompleta', { id: toastId });
          setIsRequesting(false);
          return;
        }
        
        // Solicitar captura
        if (connected) {
          // Usar socket con parámetro de fuente
          const result = requestScreenshot(activisionId, currentChannelId, {
            source: 'judge',
            isJudgeRequest: true,
            FORCE_JUDGE_TYPE: true
          });
          
          if (result) {
            toast.success('Captura solicitada', { id: toastId });
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
            toast.success('Captura solicitada por HTTP', { id: toastId });
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
          toast.success('Captura solicitada', { id: toastId });
        }
        
        // Actualizar después de un tiempo
        setTimeout(() => refreshData(), 10000);
      } catch (playerError) {
        console.error('Error al obtener información del jugador:', playerError);
        toast.error('No se pudo obtener información del jugador', { id: toastId });
      }
    } catch (error) {
      console.error('Error solicitando captura:', error);
      toast.error('Error al solicitar captura');
    } finally {
      setIsRequesting(false);
    }
  };

  // Función para actualizar datos de capturas - versión corregida
  const refreshData = useCallback(async () => {
    let toastId = null;
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      toastId = toast.loading('Actualizando capturas...');
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Sesión expirada', { id: toastId });
        navigate('/login');
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Determinar la URL correcta para obtener las capturas
      let url = `${apiUrl}/screenshots`;
      if (playerId || id) {
        url = `${apiUrl}/screenshots/player/${playerId || id}`;
      }
      
      // Agregar parámetro de timestamp para evitar caché
      url = `${url}?t=${Date.now()}`;
      
      // Limpiar cualquier error previo
      setError(null);
      
      console.log('Solicitando capturas actualizadas desde:', url);
      
      try {
        const response = await axios.get(url, { headers });
        
        if (!response || !response.data) {
          throw new Error('Respuesta vacía del servidor');
        }
        
        if (!Array.isArray(response.data)) {
          throw new Error('Formato de respuesta inválido');
        }
        
        console.log(`Recibidas ${response.data.length} capturas del servidor`);
        
        // Procesamiento básico inicial para actualizar la UI rápidamente
        const initialProcessedScreenshots = response.data.map(screenshot => ({
          ...screenshot,
          source: forceCorrectSource(screenshot),
          thumbnailUrl: generateDummyThumbnail(screenshot) // Usar miniatura temporal
        }));
        
        // Actualizar el estado inmediatamente con la información básica
        setScreenshots(initialProcessedScreenshots);
        setFilteredScreenshots(applyFiltersToData(initialProcessedScreenshots));
        
        // Luego, cargar las imágenes en segundo plano
        const finalProcessedScreenshots = await Promise.all(
          response.data.map(async (screenshot) => {
            if (!screenshot || !screenshot._id) {
              return {
                ...screenshot,
                source: forceCorrectSource(screenshot),
                thumbnailUrl: generateDummyThumbnail(screenshot)
              };
            }
            
            const source = forceCorrectSource(screenshot);
            
            try {
              // Intentar obtener la imagen con un parámetro de cache-busting
              const imageUrl = `${apiUrl}/screenshots/${screenshot._id}/image?t=${Date.now()}`;
              const imageResponse = await axios.get(imageUrl, { headers });
              
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
            } catch (imageError) {
              console.warn(`No se pudo cargar imagen para captura ${screenshot._id}:`, imageError);
              return {
                ...screenshot,
                source,
                thumbnailUrl: generateDummyThumbnail(screenshot)
              };
            }
          })
        );
        
        // Actualizar el estado con las imágenes cargadas
        setScreenshots(finalProcessedScreenshots);
        setFilteredScreenshots(applyFiltersToData(finalProcessedScreenshots));
        
        toast.success(`${finalProcessedScreenshots.length} capturas actualizadas`, { id: toastId });
      } catch (requestError) {
        console.error('Error en la solicitud de capturas:', requestError);
        throw requestError;
      }
    } catch (error) {
      console.error('Error al actualizar capturas:', error);
      
      // Manejar diferentes tipos de errores
      if (error.response) {
        // Error de respuesta del servidor
        setError(`Error del servidor: ${error.response.data?.message || 'No se pudieron cargar las capturas'}`);
      } else if (error.request) {
        // Error de solicitud sin respuesta
        setError('No se pudo conectar con el servidor');
      } else {
        // Error de configuración de la solicitud
        setError('Error al intentar actualizar capturas');
      }
      
      toast.error('No se pudieron actualizar las capturas', { id: toastId });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [playerId, id, navigate, forceCorrectSource, generateDummyThumbnail]);

  // Función para aplicar filtros a un conjunto de datos
  const applyFiltersToData = useCallback((screenshotsToFilter) => {
    if (!screenshotsToFilter || !Array.isArray(screenshotsToFilter)) {
      return [];
    }
    
    return screenshotsToFilter.filter((screenshot) => {
      if (!screenshot) return false;
      
      const matchesSearch = !searchTerm || 
        (screenshot.activisionId && screenshot.activisionId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesDate = true;
      if (dateFilter.startDate && screenshot.capturedAt) {
        const startDate = new Date(dateFilter.startDate);
        startDate.setHours(0, 0, 0, 0);
        const screenshotDate = new Date(screenshot.capturedAt);
        matchesDate = matchesDate && screenshotDate >= startDate;
      }
      
      if (dateFilter.endDate && screenshot.capturedAt) {
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
        const screenshotDate = new Date(screenshot.capturedAt);
        matchesDate = matchesDate && screenshotDate <= endDate;
      }
      
      // Filtrar por source - valor 'all' muestra todos
      let matchesSource = sourceFilter === 'all' || screenshot.source === sourceFilter;
      
      return matchesSearch && matchesDate && matchesSource;
    });
  }, [searchTerm, dateFilter, sourceFilter]);

  // Aplica filtros cuando cambia el conjunto de datos o los criterios de filtro
  useEffect(() => {
    try {
      const filtered = applyFiltersToData(screenshots);
      setFilteredScreenshots(filtered);
    } catch (error) {
      console.error('Error al aplicar filtros:', error);
      setFilteredScreenshots([]);
    }
  }, [screenshots, applyFiltersToData]);

  // Cargar capturas desde la API
  const fetchScreenshots = useCallback(async () => {
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
      
      // Agregar parámetro anti-caché
      url = `${url}?t=${Date.now()}`;
      
      const response = await axios.get(url, { headers });
      
      if (!response.data) {
        throw new Error('Respuesta vacía del servidor');
      }
      
      if (!Array.isArray(response.data)) {
        throw new Error('Formato de respuesta inválido');
      }
      
      console.log(`Cargadas ${response.data.length} capturas en la inicialización`);
      
      // Inicializar con miniaturas generadas para UI rápida
      const initialScreenshots = response.data.map(screenshot => ({
        ...screenshot,
        source: forceCorrectSource(screenshot),
        thumbnailUrl: generateDummyThumbnail(screenshot)
      }));
      
      setScreenshots(initialScreenshots);
      setFilteredScreenshots(applyFiltersToData(initialScreenshots));
      setError(null);
      
      // Cargar imágenes reales en segundo plano
      const processedScreenshots = await Promise.all(response.data.map(async (screenshot) => {
        if (!screenshot || !screenshot._id) {
          return {
            ...screenshot,
            source: forceCorrectSource(screenshot),
            thumbnailUrl: generateDummyThumbnail(screenshot)
          };
        }
        
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
      setFilteredScreenshots(applyFiltersToData(processedScreenshots));
    } catch (err) {
      console.error('Error cargando capturas:', err);
      setError('Error al cargar capturas');
      setScreenshots([]);
      setFilteredScreenshots([]);
    } finally {
      setIsLoading(false);
    }
  }, [playerId, id, navigate, forceCorrectSource, generateDummyThumbnail, applyFiltersToData]);

  // Cargar capturas al inicio o cuando cambian las props
  useEffect(() => {
    try {
      if (propsScreenshots && Array.isArray(propsScreenshots)) {
        const processedScreenshots = propsScreenshots.map(screenshot => {
          if (!screenshot) return null;
          return {
            ...screenshot,
            source: forceCorrectSource(screenshot),
            thumbnailUrl: screenshot.thumbnailUrl || generateDummyThumbnail(screenshot)
          };
        }).filter(Boolean); // Eliminar entradas nulas
        
        setScreenshots(processedScreenshots);
        setFilteredScreenshots(applyFiltersToData(processedScreenshots));
        setIsLoading(false);
        return;
      }
      
      fetchScreenshots();
    } catch (error) {
      console.error('Error en inicialización de ScreenshotGallery:', error);
      setIsLoading(false);
      setError('Error al inicializar la galería');
    }
  }, [propsScreenshots, fetchScreenshots, forceCorrectSource, generateDummyThumbnail, applyFiltersToData]);

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
            {!isEmbedded && (playerId || id) && (
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
                  <span className={`${
                    screenshot.source === 'user' 
                      ? 'text-primary-600' 
                      : 'text-warning-600 font-medium'
                  }`}>
                    {screenshot.source === 'user' ? 'Enviada por usuario' : 'Solicitada por juez'}
                  </span>
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
          screenshot={{
            ...selectedScreenshot,
            imageData: selectedScreenshot.imageData || generateDummyThumbnail(selectedScreenshot)
          }} 
          onClose={() => setSelectedScreenshot(null)} 
        />
      )}
    </div>
  );
};

export default ScreenshotGallery;
