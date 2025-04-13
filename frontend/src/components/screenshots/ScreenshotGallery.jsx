import { useState, useEffect, useRef } from 'react';
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
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(2); // Factor de zoom inicial
  const imageRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    
    // Obtener posición relativa del cursor dentro de la imagen
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setZoomPosition({ x, y });
  };

  const toggleZoom = () => {
    setZoomActive(!zoomActive);
  };

  const handleZoomLevelChange = (e) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  return (
    <div className="relative">
      <img 
        ref={imageRef}
        src={imageData} 
        alt={altText}
        className="max-w-full max-h-[70vh] object-contain cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onClick={toggleZoom}
      />
      {zoomActive && (
        <div className="absolute inset-0 flex flex-col justify-between bg-white bg-opacity-10 p-4">
          <div className="flex justify-between w-full z-10">
            <div className="bg-black bg-opacity-50 rounded p-2 text-white">
              <label className="text-sm mr-2">Zoom Level:</label>
              <input 
                type="range" 
                min="1.5" 
                max="5" 
                step="0.5" 
                value={zoomLevel} 
                onChange={handleZoomLevelChange}
                className="w-32"
              />
              <span className="text-sm ml-2">{zoomLevel}x</span>
            </div>
            <button 
              onClick={toggleZoom}
              className="bg-black bg-opacity-50 rounded p-2 text-white"
            >
              Close Zoom
            </button>
          </div>
          
          <div 
            className="absolute mx-auto my-auto top-0 left-0 right-0 bottom-0 flex items-center justify-center"
            style={{ pointerEvents: 'none' }}
          >
            <div 
              className="border-2 border-white rounded-full shadow-lg overflow-hidden"
              style={{ 
                width: 200, 
                height: 200,
                backgroundImage: `url(${imageData})`,
                backgroundPosition: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`,
                backgroundSize: `${zoomLevel * 100}%`,
                backgroundRepeat: 'no-repeat'
              }}
            ></div>
          </div>
        </div>
      )}
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
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Nuevos estados para los filtros
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'user', 'judge'
  
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
      
      // Check if socket is connected
      if (connected) {
        // Use socket.io
        const result = requestScreenshot(activisionId, currentChannelId);
        
        if (result) {
          toast.success('Screenshot requested via socket');
        } else {
          // If socket fails, try with HTTP
          await axios.post(`${apiUrl}/screenshots/request`, 
            { activisionId, channelId: currentChannelId },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          toast.success('Screenshot requested via HTTP');
        }
      } else {
        // If no socket connection, use HTTP directly
        await axios.post(`${apiUrl}/screenshots/request`, 
          { activisionId, channelId: currentChannelId },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        toast.success('Screenshot requested');
      }
      
      // Show message about timing
      toast('The screenshot will appear shortly when captured by the client', {
        icon: '⏱️',
        duration: 5000
      });
      
    } catch (error) {
      console.error('Error requesting screenshot:', error);
      toast.error('Error requesting screenshot: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsRequesting(false);
    }
  };
  
  // Load screenshots
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
        
        // Procesar las capturas para identificar si fueron solicitadas por un juez o enviadas por el usuario
        const processedScreenshots = response.data.map(screenshot => {
          return {
            ...screenshot,
            // Si tiene requestedBy, fue solicitada por un juez; si no, fue enviada por el usuario
            source: screenshot.requestedBy ? 'judge' : 'user'
          };
        });
        
        // Set screenshots without loading images
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
    
    fetchScreenshots();
  }, [propsScreenshots, playerId, id, navigate]);
  
  // Filter screenshots with new filters
  useEffect(() => {
    const filtered = screenshots.filter((screenshot) => {
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
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => openScreenshotModal(screenshot)}
    >
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center relative group">
        {screenshot.thumbnailUrl ? (
          <img 
            src={screenshot.thumbnailUrl} 
            alt={`Preview of ${screenshot.activisionId}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <CameraIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">Preview not available</p>
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
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            screenshot.source === 'user' 
              ? 'bg-primary-100 text-primary-800' 
              : 'bg-warning-100 text-warning-800'
          }`}>
            {screenshot.source === 'user' ? 'User' : 'Judge'}
          </span>
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
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
      ) : (
        <div className="space-y-8">
          {/* User submitted screenshots section */}
          {userScreenshots.length > 0 && (
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
          {judgeScreenshots.length > 0 && (
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
