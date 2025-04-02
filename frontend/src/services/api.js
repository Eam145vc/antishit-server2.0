import axios from 'axios';
import toast from 'react-hot-toast';

// Get API URL from environment, with explicit fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://anti5-0.onrender.com/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Aumentar tiempo de espera
  timeout: 10000 // 10 segundos
});

// Interceptor para agregar token de autorización
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de respuesta global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de red
    if (error.message === 'Network Error') {
      toast.error('Error de conexión. Verifique su red.');
      return Promise.reject(error);
    }

    // Manejar respuestas de error del servidor
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          toast.error(data.message || 'Solicitud inválida');
          break;
        case 401:
          // Token inválido o expirado
          localStorage.removeItem('token');
          window.location.href = '/login';
          toast.error('Sesión expirada. Inicie sesión nuevamente.');
          break;
        case 403:
          toast.error('No tiene permisos para realizar esta acción');
          break;
        case 404:
          toast.error(data.message || 'Recurso no encontrado');
          break;
        case 500:
          toast.error('Error interno del servidor');
          break;
        default:
          toast.error('Ocurrió un error desconocido');
      }
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      toast.error('No se recibió respuesta del servidor');
    } else {
      // Algo sucedió al configurar la solicitud
      toast.error('Error al configurar la solicitud');
    }

    return Promise.reject(error);
  }
);

// Métodos de servicio genéricos
export const apiService = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
};

export default api;
