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
  const { requestScreenshot, connected } = useSocket();
  
  const [screenshots, setScreenshots] = useState(propsScreenshots || []);
  const [filteredScreenshots, setFilteredScreenshots] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(!propsScreenshots);
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
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
        
        // Set screenshots without loading images
        setScreenshots(response.data);
        setFilteredScreenshots(response.data);
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
  
  // Filter screenshots
  useEffect(() => {
    const filtered = screenshots.filter((screenshot) => {
      const matchesSearch = !searchTerm || 
        screenshot.activisionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    setFilteredScreenshots(filtered);
  }, [screenshots, searchTerm]);
  
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredScreenshots.map((screenshot) => (
            <div 
              key={screenshot._id} 
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openScreenshotModal(screenshot)}
            >
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">Click to view</p>
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
                <div className="mt-1 text-xs text-gray-500">
                  Channel {screenshot.channelId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot modal */}
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
              alt={`Screenshot from ${selectedScreenshot.activisionId}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="mt-4 text-center text-white">
              <p>
                Screenshot from {selectedScreenshot.activisionId} - 
                Channel {selectedScreenshot.channelId} - 
                {new Date(selectedScreenshot.capturedAt).toLocaleString()}
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
