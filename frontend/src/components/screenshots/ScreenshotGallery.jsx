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
  
  // Resto del código es similar al anterior...

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
      
      {/* Resto del código anterior... */}
    </div>
  );
};

export default ScreenshotGallery;
