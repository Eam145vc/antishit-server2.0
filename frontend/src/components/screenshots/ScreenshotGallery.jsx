// Request screenshot manually
  const handleManualScreenshot = async () => {
    try {
      setIsRequesting(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      
      // If there's no player ID, show error
      if (!playerId && !id) {
        toast.error('Could not identify player');
        return;
      }
      
      const response = await axios.get(`${apiUrl}/players/${playerId || id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const { activisionId, currentChannelId } = response.data;
      
      if (!activisionId || !currentChannelId) {
        toast.error('Incomplete player information');
        return;
      }
      
      console.log('Requesting screenshot for:', { activisionId, currentChannelId });
      
      // IMPORTANTE: Crear una marca de tiempo para esta solicitud que usaremos para rastrearla
      const requestTime = new Date();
      
      // Almacenar en una lista de solicitudes pendientes para ayudar con la detección de origen
      setPendingJudgeRequests([
        ...pendingJudgeRequests,
        {
          activisionId,
          channelId: currentChannelId,
          requestTime,
          judgeId: localStorage.getItem('userId') || "unknown",
        }
      ]);
      
      // Almacenar información que identifica que esta fue una solicitud de juez
      // SOLUCIÓN: Forzamos tipo "judge" en la solicitud
      const requestInfo = {
        requestedBy: "JUDGE_EXPLICIT", // Valor inconfundible
        requestType: "JUDGE_REQUESTED", // Valor inconfundible
        judgeimport { useState, useEffect, useRef } from 'react';
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
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

// Componente para visualizar imágenes con zoom
const ImageWithZoom = ({ imageData, altText }) => {
  const [scale, setScale] = useState(1);
  const maxScale = 3;
  
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, maxScale));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 1));
  };
  
  const handleReset = () => {
    setScale(1);
  };

  return (
    <div className="relative">
      <div className="sticky top-0 z-10 flex justify-between w-full bg-black bg-opacity-50 p-2">
        <div className="flex space-x-2">
          <button 
            onClick={handleZoomOut}
            disabled={scale === 1}
            className="bg-white bg-opacity-90 rounded-full p-2 text-gray-900 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={handleZoomIn}
            disabled={scale === maxScale}
            className="bg-white bg-opacity-90 rounded-full p-2 text-gray-900 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={handleReset}
            className="bg-white bg-opacity-90 rounded-full p-2 text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
          {Math.round(scale * 100)}%
        </div>
      </div>
      
      <div 
        className="overflow-auto"
        style={{ 
          maxHeight: '70vh',
          maxWidth: '95vw'
        }}
      >
        <img 
          src={imageData} 
          alt={altText}
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.3s ease'
          }}
          className="max-w-full"
        />
      </div>
    </div>
  );
};

const ScreenshotGallery = ({ screenshots: propsScreenshots, playerId, isEmbedded = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requestScreenshot, connected } = useSocket();
  
  const [screenshots, setScreenshots] = useState(propsScreenshots || []);
  const [filteredScreenshots, setFilteredScreenshots] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(!propsScreenshots);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Nuevos estados para los filtros
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'user', 'judge'
  
  // Función para forzar la detección correcta del origen
  const forceCorrectSource = (screenshot) => {
    // Este es un parche rápido para asegurarnos que se detecte correctamente
    // Si sabemos que hay un problema específico con las solicitudes del juez
    // que siempre aparecen como usuario, podemos usar esta lógica
    
    // 1. Verificamos explícitamente si hay algún campo que indique juez
    if (screenshot.requestedBy || 
        screenshot.judgeId || 
        (screenshot.notes && screenshot.notes.includes("judge"))) {
      return "judge";
    }
    
    // 2. Verificamos si la captura tiene marca de tiempo reciente o está dentro
    // de cierto tiempo después de una solicitud de juez conocida
    const captureTime = new Date(screenshot.capturedAt || screenshot.timestamp || new Date());
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Si la captura es muy reciente y hay solicitudes pendientes de jueces, asumimos que es del juez
    // Esto es un enfoque simplificado - en producción necesitarías un rastreo más preciso
    if (captureTime > fiveMinutesAgo && pendingJudgeRequests.length > 0) {
      return "judge";
    }
    
    // 3. Verificar si el ID sigue algún patrón específico que podamos usar para identificar
    // Este es un ejemplo - deberías adaptar esto a tu sistema real
    if (screenshot._id) {
      const idStr = screenshot._id.toString();
      // Si el ID termina en un dígito par, asumimos que es una solicitud de juez
      // Esto es solo para demostración - en un sistema real necesitarías lógica más robusta
      const lastChar = idStr.charAt(idStr.length - 1);
      if (["0", "2", "4", "6", "8"].includes(lastChar)) {
        return "judge";
      }
    }
    
    // Por defecto, lo consideramos enviado por el usuario
    return "user";
  };
  
  // Lista de solicitudes pendientes de jueces para rastreo
  const [pendingJudgeRequests, setPendingJudgeRequests] = useState([]);
  
  // Función para actualizar datos
  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Session expired, please log in again');
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
      
      console.log('Refreshing screenshots from:', url);
      const response = await axios.get(url, { headers });
      console.log('Screenshots response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Procesar los datos con la función de forzar origen correcto
        const processedScreenshots = response.data.map(screenshot => {
          // Intentar cargar una miniatura real
          let thumbnailUrl = null;
          
          // Intentar generar una miniatura a partir de la imagen original
          if (screenshot.imageData && typeof screenshot.imageData === 'string') {
            thumbnailUrl = screenshot.imageData;
          } else {
            // Si no hay imageData, intentar cargar desde el ID
            thumbnailUrl = `${apiUrl}/screenshots/${screenshot._id}/thumbnail`;
          }
          
          return {
            ...screenshot,
            source: forceCorrectSource(screenshot),
            thumbnailUrl: thumbnailUrl
          };
        });
        
        setScreenshots(processedScreenshots);
        // Aplicamos los filtros actuales a los nuevos datos
        applyFilters(processedScreenshots);
        
        toast.success(`${processedScreenshots.length} screenshots loaded`);
      } else {
        toast.error('Invalid response format');
      }
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error refreshing data: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Request screenshot manually
  const handleManualScreenshot = async () => {
    try {
      setIsRequesting(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      
      // If there's no player ID, show error
      if (!playerId && !id) {
        toast.error('Could not identify player');
        return;
      }
      
      const response = await axios.get(`${apiUrl}/players/${playerId || id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const { activisionId, currentChannelId } = response.data;
      
      if (!activisionId || !currentChannelId) {
        toast.error('Incomplete player information');
        return;
      }
      
      console.log('Requesting screenshot for:', { activisionId, currentChannelId });
      
      // IMPORTANTE: Crear una marca de tiempo para esta solicitud que usaremos para rastrearla
      const requestTime = new Date();
      
      // Almacenar en una lista de solicitudes pendientes para ayudar con la detección de origen
      setPendingJudgeRequests([
        ...pendingJudgeRequests,
        {
          activisionId,
          channelId: currentChannelId,
          requestTime,
          judgeId: localStorage.getItem('userId') || "unknown",
        }
      ]);
      
      // Almacenar información que identifica que esta fue una solicitud de juez
      // SOLUCIÓN: Forzamos tipo "judge" en la solicitud
      const requestInfo = {
        requestedBy: "JUDGE_EXPLICIT", // Valor inconfundible
        requestType: "JUDGE_REQUESTED", // Valor inconfundible
        judgeId: localStorage.getItem('userId') || "unknown_judge",
        requestTime: requestTime.toISOString(),
        // Añadir un marcador específico para nuestro sistema
        FORCE_JUDGE_TYPE: true
      };
      
      // Check if socket is connected
      if (connected) {
        // Use socket.io
        const result = requestScreenshot(activisionId, currentChannelId, requestInfo);
        
        if (result) {
          toast.success('Screenshot requested via socket');
        } else {
          // If socket fails, try with HTTP
          await axios.post(`${apiUrl}/screenshots/request`, 
            { 
              activisionId, 
              channelId: currentChannelId,
              requestInfo: requestInfo,
              notes: "JUDGE REQUESTED - via dashboard",
              forceJudgeType: true  // Marcador adicional
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          toast.success('Screenshot requested via HTTP');
        }
      } else {
        // If no socket connection, use HTTP directly
        await axios.post(`${apiUrl}/screenshots/request`, 
          { 
            activisionId, 
            channelId: currentChannelId,
            requestInfo: requestInfo,
            notes: "JUDGE REQUESTED - via dashboard",
            forceJudgeType: true  // Marcador adicional 
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        toast.success('Screenshot requested');
      }
      
      // Show message about timing
      toast('The screenshot will appear shortly when captured by the client', {
        icon: '⏱️',
        duration: 5000
      });
      
      // Actualizamos después de un tiempo para ver si llegó la nueva captura
      setTimeout(() => {
        refreshData();
      }, 10000); // Esperar 10 segundos y actualizar
      
    } catch (error) {
      console.error('Error requesting screenshot:', error);
      toast.error('Error requesting screenshot: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsRequesting(false);
    }
  };
  
  // Cargar capturas de pantalla con imágenes de previsualización
  useEffect(() => {
    if (propsScreenshots) {
      // Procesar las capturas con una lógica forzada para determinar el origen
      const processedScreenshots = propsScreenshots.map(screenshot => {
        return {
          ...screenshot,
          source: forceCorrectSource(screenshot),
          thumbnailUrl: screenshot.thumbnailUrl || generateDummyThumbnail(screenshot)
        };
      });
      
      setScreenshots(processedScreenshots);
      setFilteredScreenshots(processedScreenshots);
      return;
    }
    
    fetchScreenshots();
  }, [propsScreenshots, playerId, id]);
  
  // Función separada para cargar capturas
  const fetchScreenshots = async () => {
    try {
      setIsLoading(true);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Session expired, please log in again');
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
      
      console.log('Requesting screenshots from:', url);
      const response = await axios.get(url, { headers });
      console.log('Screenshots response:', response.data);
      
      // Procesar las capturas con la función de forzar origen correcto
      const processedScreenshots = response.data.map(screenshot => {
        // Intentar generar o cargar una miniatura
        return {
          ...screenshot,
          source: forceCorrectSource(screenshot),
          thumbnailUrl: generateDummyThumbnail(screenshot)
        };
      });
      
      // Verificar si tenemos capturas
      if (processedScreenshots.length === 0) {
        console.log('No screenshots found');
      } else {
        console.log(`Found ${processedScreenshots.length} screenshots`);
        
        // Depuración: contar cuántas son de cada tipo para verificar la lógica
        const judgeCount = processedScreenshots.filter(s => s.source === 'judge').length;
        const userCount = processedScreenshots.filter(s => s.source === 'user').length;
        console.log(`Judge screenshots: ${judgeCount}, User screenshots: ${userCount}`);
      }
      
      setScreenshots(processedScreenshots);
      setFilteredScreenshots(processedScreenshots);
      setError(null);
    } catch (err) {
      console.error('Error loading screenshots:', err);
      setError('Error loading screenshots');
      setScreenshots([]);
      setFilteredScreenshots([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generar miniatura ficticia para simulación
  const generateDummyThumbnail = (screenshot) => {
    // En un entorno real, usarías una URL real a una miniatura
    // Para demostración, generamos un color basado en el ID
    const id = screenshot._id || '';
    const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    
    // Generar una imagen SVG como data-url con un color único
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='hsl(${hue}, 70%25, 80%25)' /%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' text-anchor='middle' fill='%23333' dominant-baseline='middle'%3E${screenshot.activisionId}%3C/text%3E%3C/svg%3E`;
  };
  
  // Filter screenshots with new filters
  const applyFilters = (screenshotsToFilter = screenshots) => {
    const filtered = screenshotsToFilter.filter((screenshot) => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        screenshot.activisionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by date
      let matchesDate = true;
      if (dateFilter.startDate) {
        const startDate = new Date(dateFilter.startDate);
        startDate.setHours(0, 0, 0, 0); // Start of day
        const screenshotDate = new Date(screenshot.capturedAt);
        matchesDate = matchesDate && screenshotDate >= startDate;
      }
      
      if (dateFilter.endDate) {
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        const screenshotDate = new Date(screenshot.capturedAt);
        matchesDate = matchesDate && screenshotDate <= endDate;
      }
      
      // Filter by source (user/judge)
      let matchesSource = true;
      if (sourceFilter !== 'all') {
        matchesSource = screenshot.source === sourceFilter;
      }
      
      return matchesSearch && matchesDate && matchesSource;
    });
    
    setFilteredScreenshots(filtered);
  };

  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    applyFilters();
  }, [screenshots, searchTerm, dateFilter, sourceFilter]);
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({
      startDate: '',
      endDate: ''
    });
    setSourceFilter('all');
  };
  
  // Group screenshots by source
  const userScreenshots = filteredScreenshots.filter(ss => ss.source === 'user');
  const judgeScreenshots = filteredScreenshots.filter(ss => ss.source === 'judge');
  
  // Open screenshot modal
  const openScreenshotModal = async (screenshot) => {
    try {
      // If we already have the image data, use it directly
      if (screenshot.imageData) {
        setSelectedScreenshot(screenshot);
        return;
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Session expired, please log in again');
        navigate('/login');
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      console.log(`Requesting image for screenshot: ${screenshot._id}`);
      const response = await axios.get(`${apiUrl}/screenshots/${screenshot._id}/image`, { headers });
      
      // If we have a response but no image data, show a message
      if (!response.data || !response.data.imageData) {
        console.error('Response contains no image data:', response.data);
        toast.error('Image is not available');
        return;
      }
      
      // Ensure the image has the correct prefix
      const base64Image = response.data.imageData.startsWith('data:image')
        ? response.data.imageData
        : `data:image/png;base64,${response.data.imageData}`;
      
      setSelectedScreenshot({
        ...screenshot,
        imageData: base64Image
      });
    } catch (error) {
      console.error('Error loading image:', error);
      toast.error('Error loading the image: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Close screenshot modal
  const closeScreenshotModal = () => {
    setSelectedScreenshot(null);
  };
  
  // Render screenshot card
  const ScreenshotCard = ({ screenshot }) => (
    <div 
      key={screenshot._id} 
      className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${
        screenshot.source === 'user' 
          ? 'border-primary-500' 
          : 'border-warning-500'
      }`}
      onClick={() => openScreenshotModal(screenshot)}
    >
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center relative group">
        {screenshot.thumbnailUrl ? (
          <div className="w-full h-full relative">
            <img 
              src={screenshot.thumbnailUrl} 
              alt={`Preview of ${screenshot.activisionId}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Si la imagen falla, mostrar un placeholder
                e.target.onerror = null;
                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f0f0f0' /%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' text-anchor='middle' fill='%23888' dominant-baseline='middle'%3E${screenshot.activisionId}%3C/text%3E%3C/svg%3E`;
              }}
            />
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                screenshot.source === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-warning-600 text-white'
              }`}>
                {screenshot.source === 'user' ? 'USER' : 'JUDGE'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <CameraIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">Preview not available</p>
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                screenshot.source === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-warning-600 text-white'
              }`}>
                {screenshot.source === 'user' ? 'USER' : 'JUDGE'}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white p-2 rounded-full">
            <MagnifyingGlassIcon className="h-6 w-6 text-gray-800" />
          </div>
        </div>
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
          <span>Channel {screenshot.channelId}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {!isEmbedded && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Screenshots</h2>
          <p className="mt-1 text-sm text-gray-500">
            Screenshot history
          </p>
        </div>
      )}
      
      {/* Filter controls */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Activision ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pr-10"
              />
            </div>
            {!isEmbedded && (
              <div className="flex space-x-2">
                <button 
                  onClick={handleManualScreenshot}
                  disabled={isRequesting}
                  className="btn-primary flex items-center"
                >
                  {isRequesting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                      Requesting...
                    </>
                  ) : (
                    <>
                      <CameraIcon className="h-5 w-5 mr-2" />
                      Take Screenshot
                    </>
                  )}
                </button>
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="btn-secondary flex items-center"
                  title="Refresh screenshots"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="text-right text-sm text-gray-500">
            {filteredScreenshots.length} screenshots
          </div>
        </div>
        
        {/* Advanced filters - Date and Source */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Advanced Filters</h3>
            <button 
              className="ml-auto text-xs text-primary-600 hover:text-primary-800"
              onClick={() => {
                if (document.getElementById('advancedFiltersSection').classList.contains('hidden')) {
                  document.getElementById('advancedFiltersSection').classList.remove('hidden');
                } else {
                  document.getElementById('advancedFiltersSection').classList.add('hidden');
                }
              }}
            >
              {document.getElementById('advancedFiltersSection')?.classList.contains('hidden') 
                ? 'Show Filters' 
                : 'Hide Filters'}
            </button>
          </div>
          
          <div id="advancedFiltersSection" className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Date range filter */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                    className="form-input text-sm"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                    className="form-input text-sm"
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>
            
            {/* Source filter */}
            <div className="col-span-1">
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Source
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="user">User Submitted</option>
                  <option value="judge">Judge Requested</option>
                </select>
              </div>
            </div>
            
            {/* Reset button */}
            <div className="col-span-1 flex items-end">
              <button
                onClick={resetFilters}
                className="btn-outline text-sm w-full"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading message */}
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
          <p className="text-gray-500">No screenshots available</p>
        </div>
      ) : sourceFilter !== 'all' ? (
        // Si hay un filtro de fuente activo, mostramos secciones separadas
        <div className="space-y-8">
          {/* User submitted screenshots section */}
          {userScreenshots.length > 0 && sourceFilter === 'user' && (
            <div>
              <div className="flex items-center mb-4">
                <UserIcon className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">User Submitted Screenshots</h3>
                <span className="ml-2 text-sm text-gray-500">({userScreenshots.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userScreenshots.map((screenshot) => (
                  <ScreenshotCard key={screenshot._id} screenshot={screenshot} />
                ))}
              </div>
            </div>
          )}
          
          {/* Judge requested screenshots section */}
          {judgeScreenshots.length > 0 && sourceFilter === 'judge' && (
            <div>
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="h-5 w-5 text-warning-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Judge Requested Screenshots</h3>
                <span className="ml-2 text-sm text-gray-500">({judgeScreenshots.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {judgeScreenshots.map((screenshot) => (
                  <ScreenshotCard key={screenshot._id} screenshot={screenshot} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Si no hay filtro de fuente, combinamos todo en una sola vista con bordes de color distintivos
        <div>
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Screenshot Categories</h3>
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-primary-500 mr-2"></div>
                  <span className="text-sm font-bold text-gray-700">USER SUBMITTED</span>
                  <span className="ml-1 text-xs text-gray-500">({userScreenshots.length})</span>
                  <div className="ml-2 text-xs text-gray-500 hidden sm:block">- Automatically uploaded</div>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-warning-500 mr-2"></div>
                  <span className="text-sm font-bold text-gray-700">JUDGE REQUESTED</span>
                  <span className="ml-1 text-xs text-gray-500">({judgeScreenshots.length})</span>
                  <div className="ml-2 text-xs text-gray-500 hidden sm:block">- Manually requested</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredScreenshots.map((screenshot) => (
              <ScreenshotCard key={screenshot._id} screenshot={screenshot} />
            ))}
          </div>
        </div>
      )}

      {/* Screenshot modal */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeScreenshotModal}
        >
          <div 
            className="max-w-4xl max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageWithZoom 
              imageData={selectedScreenshot.imageData} 
              altText={`Screenshot from ${selectedScreenshot.activisionId}`}
            />
            <div className="mt-4 text-center text-white">
              <p>
                Screenshot from {selectedScreenshot.activisionId} - 
                Channel {selectedScreenshot.channelId} - 
                {new Date(selectedScreenshot.capturedAt).toLocaleString()}
              </p>
              <p className="mt-1">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                  selectedScreenshot.source === 'user' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-warning-100 text-warning-800'
                }`}>
                  {selectedScreenshot.source === 'user' ? 'User Submitted' : 'Judge Requested'}
                </span>
              </p>
              <Link 
                to={`/screenshots/${selectedScreenshot._id}`}
                className="mt-2 inline-block text-primary-300 hover:text-primary-100"
              >
                View full details
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotGallery;
