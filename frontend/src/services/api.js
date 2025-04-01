import axios from 'axios';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar tokens de autorización
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Manejar errores de respuesta globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de autorización (token inválido o expirado)
    if (error.response && error.response.status === 401) {
      // Limpiar token y redirigir al login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Métodos de servicio genéricos
export const apiService = {
  // Método GET genérico
  get: (url, config = {}) => api.get(url, config),
  
  // Método POST genérico
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  
  // Método PUT genérico
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  
  // Método DELETE genérico
  delete: (url, config = {}) => api.delete(url, config),
  
  // Métodos específicos de recursos
  auth: {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (userData) => api.put('/auth/profile', userData),
  },
  
  players: {
    getAll: () => api.get('/players'),
    getById: (id) => api.get(`/players/${id}`),
    getByActivisionId: (activisionId) => api.get(`/players/activision/${activisionId}`),
    updateChannel: (id, channelId) => api.put(`/players/${id}/channel`, { channelId }),
    markSuspicious: (id, suspicious, notes) => api.put(`/players/${id}/suspect`, { suspicious, notes }),
  },
  
  devices: {
    getAll: (params) => api.get('/devices', { params }),
    getById: (id) => api.get(`/devices/${id}`),
    getSuspicious: () => api.get('/devices/suspicious'),
    updateTrustLevel: (id, trustLevel, notes) => api.put(`/devices/${id}/trust-level`, { trustLevel, notes }),
  },
  
  screenshots: {
    getAll: (params) => api.get('/screenshots', { params }),
    getByPlayer: (playerId) => api.get(`/screenshots/player/${playerId}`),
    getById: (id) => api.get(`/screenshots/${id}`),
    getImage: (id) => api.get(`/screenshots/${id}/image`),
    request: (activisionId, channelId) => api.post('/screenshots/request', { activisionId, channelId }),
  },
  
  monitor: {
    saveData: (monitorData) => api.post('/monitor', monitorData),
    updateGameStatus: (statusData) => api.post('/monitor/game-status', statusData),
    getStats: () => api.get('/monitor/stats'),
  },
  
  tournaments: {
    getAll: () => api.get('/tournaments'),
    getById: (id) => api.get(`/tournaments/${id}`),
    create: (tournamentData) => api.post('/tournaments', tournamentData),
    update: (id, tournamentData) => api.put(`/tournaments/${id}`, tournamentData),
  },
};

export default api;