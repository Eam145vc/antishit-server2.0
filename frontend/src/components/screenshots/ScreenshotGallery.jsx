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
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(!propsScreenshots);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // New states for filters
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'user', 'judge'
  
  // Function to force correct source detection
  const forceCorrectSource = (screenshot) => {
    // If we have explicit fields that indicate a judge request
    if (screenshot.requestedBy || 
        screenshot.judgeId || 
        (screenshot.notes && screenshot.notes.includes("judge"))) {
      return "judge";
    }
    
    // Default to user submitted
    return "user";
  };
  
  // List of pending judge requests for tracking
  const [pendingJudgeRequests, setPendingJudgeRequests] = useState([]);
  
  // Function to update data - using useCallback to prevent unnecessary re-renders
  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      toast.loading('Refreshing screenshots...', { id: 'refresh-toast' });
      
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
        // Process the data and prepare thumbnails
        const processedScreenshots = await Promise.all(response.data.map(async (screenshot) => {
          // Determine the source (user or judge)
          const source = forceCorrectSource(screenshot);
          
          // For real thumbnails, we need to fetch the actual image data
          let thumbnailUrl = null;
          
          try {
            // Only try to get the image if we need it (performance optimization)
            const imageResponse = await axios.get(`${apiUrl}/screenshots/${screenshot._id}/image`, { headers });
            
            if (imageResponse.data && imageResponse.data.imageData) {
              // Ensure the image has the correct prefix
              const imageData = imageResponse.data.imageData.startsWith('data:image')
                ? imageResponse.data.imageData
                : `data:image/png;base64,${imageResponse.data.imageData}`;
                
              thumbnailUrl = imageData;
            }
          } catch (error) {
            console.warn(`Could not load image for screenshot ${screenshot._id}:`, error);
            // Fall back to placeholder
            thumbnailUrl = generateDummyThumbnail(screenshot);
          }
          
          return {
            ...screenshot,
            source,
            thumbnailUrl
          };
        }));
        
        setScreenshots(processedScreenshots);
        // Apply current filters to the new data
        applyFilters(processedScreenshots);
        
        toast.success(`${processedScreenshots.length} screenshots loaded`, { id: 'refresh-toast' });
      } else {
        toast.error('Invalid response format', { id: 'refresh-toast' });
      }
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error refreshing data: ' + (error.response?.data?.message || error.message), { id: 'refresh-toast' });
    } finally {
      setIsRefreshing(false);
    }
  }, [playerId, id, navigate]);
  
  // Request screenshot manually
  const handleManualScreenshot = async () => {
    try {
      setIsRequesting(true);
      toast.loading('Requesting screenshot...', { id: 'screenshot-request-toast' });
      
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://antishit-server2-0.onrender.com/api';
      
      // If there's no player ID, show error
      if (!playerId && !id) {
        toast.error('Could not identify player', { id: 'screenshot-request-toast' });
        return;
      }
      
      const response = await axios.get(`${apiUrl}/players/${playerId || id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const { activisionId, currentChannelId } = response.data;
      
      if (!activisionId || currentChannelId === undefined) {
        toast.error('Incomplete player information', { id: 'screenshot-request-toast' });
        return;
      }
      
      console.log('Requesting screenshot for:', { activisionId, currentChannelId });
      
      // IMPORTANT: Create a timestamp for this request which we'll use to track it
      const requestTime = new Date();
      
      // Store in a list of pending requests to help with origin detection
      setPendingJudgeRequests(prev => [
        ...prev,
        {
          activisionId,
          channelId: currentChannelId,
          requestTime,
          judgeId: localStorage.getItem('userId') || "unknown",
        }
      ]);
      
      // Store information that identifies this was a judge request
      // Add a specific marker for our system
      const requestInfo = {
        requestedBy: "JUDGE_EXPLICIT",
        requestType: "JUDGE_REQUESTED",
        judgeId: localStorage.getItem('userId') || "unknown_judge",
        requestTime: requestTime.toISOString(),
        FORCE_JUDGE_TYPE: true
      };
      
      // Check if socket is connected
      if (connected) {
        // Use socket.io
        const result = requestScreenshot(activisionId, currentChannelId, requestInfo);
        
        if (result) {
          toast.success('Screenshot requested via socket', { id: 'screenshot-request-toast' });
        } else {
          // If socket fails, try with HTTP
          await axios.post(`${apiUrl}/screenshots/request`, 
            { 
              activisionId, 
              channelId: currentChannelId,
              requestInfo: requestInfo,
              notes: "JUDGE REQUESTED - via dashboard",
              forceJudgeType: true
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          toast.success('Screenshot requested via HTTP', { id: 'screenshot-request-toast' });
        }
      } else {
        // If no socket connection, use HTTP directly
        await axios.post(`${apiUrl}/screenshots/request`, 
          { 
            activisionId, 
            channelId: currentChannelId,
            requestInfo: requestInfo,
            notes: "JUDGE REQUESTED - via dashboard", 
            forceJudgeType: true
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        toast.success('Screenshot requested', { id: 'screenshot-request-toast' });
      }
      
      // Show message about timing
      toast('The screenshot will appear shortly when captured by the client', {
        icon: '⏱️',
        duration: 5000
      });
      
      // Update after a while to see if the new capture arrived
      setTimeout(() => {
        refreshData();
      }, 10000); // Wait 10 seconds and update
      
    } catch (error) {
      console.error('Error requesting screenshot:', error);
      toast.error('Error requesting screenshot: ' + (error.response?.data?.message || error.message), { id: 'screenshot-request-toast' });
    } finally {
      setIsRequesting(false);
    }
  };
  
  // Load screenshots with preview images
  useEffect(() => {
    if (propsScreenshots) {
      // Process captures with forced logic to determine origin
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
  
  // Separate function to load captures
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
      
      if (!Array.isArray(response.data)) {
        console.error('Invalid response data, not an array:', response.data);
        setError('Invalid response format');
        setScreenshots([]);
        setFilteredScreenshots([]);
        setIsLoading(false);
        return;
      }
      
      // Get all screenshots data first
      const screenshots = response.data;
      
      // Now fetch the actual images for each screenshot
      const processedScreenshots = await Promise.all(screenshots.map(async screenshot => {
        try {
          // Try to get the actual image
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
            source: forceCorrectSource(screenshot),
            thumbnailUrl
          };
        } catch (error) {
          console.warn(`Could not load image for screenshot ${screenshot._id}:`, error);
          return {
            ...screenshot,
            source: forceCorrectSource(screenshot),
            thumbnailUrl: generateDummyThumbnail(screenshot)
          };
        }
      }));
      
      // Check if we have captures
      if (processedScreenshots.length === 0) {
        console.log('No screenshots found');
      } else {
        console.log(`Found ${processedScreenshots.length} screenshots`);
        
        // Debug: count how many are of each type to verify logic
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
  
  // Generate dummy thumbnail for simulation
  const generateDummyThumbnail = (screenshot) => {
    // In a real environment, you'd use a real URL to a thumbnail
    // For demonstration, we generate a placeholder SVG
    const id = screenshot._id || '';
    const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    
    // Generate an SVG image as a data-url with a unique color
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='hsl(${hue}, 70%25, 80%25)' /%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' text-anchor='middle' fill='%23333' dominant-baseline='middle'%3E${screenshot.activisionId || 'Screenshot'}%3C/text%3E%3C/svg%3E`;
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

  // Apply filters when criteria change
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
  
  // View screenshot in a new tab/window for native browser zoom
  const viewScreenshotInNewTab = async (screenshot) => {
    try {
      if (screenshot.imageData) {
        // If we already have image data, open it right away
        window.open(screenshot.imageData, '_blank');
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
      
      // Show loading toast
      toast.loading('Loading image...', { id: 'loading-image-toast' });
      
      // Get the full image data
      const response = await axios.get(`${apiUrl}/screenshots/${screenshot._id}/image`, { headers });
      
      if (!response.data || !response.data.imageData) {
        toast.error('Image is not available', { id: 'loading-image-toast' });
        return;
      }
      
      // Ensure the image has the correct prefix
      const imageData = response.data.imageData.startsWith('data:image')
        ? response.data.imageData
        : `data:image/png;base64,${response.data.imageData}`;
      
      // Open the image in a new tab/window
      window.open(imageData, '_blank');
      
      // Clear the loading toast
      toast.success('Image loaded', { id: 'loading-image-toast' });
      
    } catch (error) {
      console.error('Error loading image:', error);
      toast.error('Error loading image: ' + (error.response?.data?.message || error.message), { id: 'loading-image-toast' });
    }
  };
  
  // Render screenshot card
  const ScreenshotCard = ({ screenshot }) => (
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
              alt={`Preview of ${screenshot.activisionId}`}
              className="w-full h-full object-contain cursor-zoom-in"
              onClick={() => viewScreenshotInNewTab(screenshot)}
              onError={(e) => {
                // If the image fails, show a placeholder
                e.target.onerror = null;
                e.target.src = generateDummyThumbnail(screenshot);
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
          <div className="bg-white p-2 rounded-full cursor-pointer" onClick={() => viewScreenshotInNewTab(screenshot)}>
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
        <div className="mt-3 flex justify-end">
          <Link 
            to={`/screenshots/${screenshot._id}`}
            className="text-xs text-primary-600 hover:text-primary-800"
          >
            View details
          </Link>
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
            
            {/* Manual refresh button - more prominent */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="btn-primary flex items-center"
              title="Refresh screenshots"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Screenshots'}
            </button>
            
            {/* Screenshot request button */}
            {!isEmbedded && playerId && (
              <button 
                onClick={handleManualScreenshot}
                disabled={isRequesting}
                className="btn-secondary flex items-center"
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
            <button 
              className="ml-auto text-xs text-primary-600 hover:text-primary-800"
              onClick={() => {
                const filterSection = document.getElementById('advancedFiltersSection');
                if (filterSection) {
                  filterSection.classList.toggle('hidden');
                }
              }}
            >
              Toggle Filters
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
          <button 
            onClick={refreshData}
            className="mt-4 btn-primary"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2 inline" />
            Refresh
          </button>
        </div>
      ) : sourceFilter !== 'all' ? (
        // If there's an active source filter, show separate sections
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
        // If there's no source filter, combine everything in a single view with distinctive color borders
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
      
      {/* Help text for using screenshots */}
      <div className="bg-primary-50 p-4 rounded-lg text-sm text-primary-800 mt-6">
        <h3 className="font-medium mb-2">How to use screenshots:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Click on any screenshot preview to open it in a new tab for native browser zoom</li>
          <li>Use the "Refresh Screenshots" button to check for new screenshots without reloading the page</li>
          <li>Use filters to find specific screenshots by player ID or date</li>
          <li>Click "View details" for more information about each screenshot</li>
        </ul>
      </div>
    </div>
  );
};

export default ScreenshotGallery;
