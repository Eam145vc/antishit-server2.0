import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Verificar token y cargar usuario al iniciar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await api.get('/auth/profile');
        setUser(data);
      } catch (error) {
        // Si hay error al verificar el token, limpiar el token
        localStorage.removeItem('token');
        console.error("Error verificando autenticación:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // Guardar token
      localStorage.setItem('token', data.token);
      
      // Actualizar estado de usuario
      setUser(data);
      
      // Mostrar mensaje de éxito
      toast.success('Inicio de sesión exitoso');
      
      // Redirigir al dashboard
      navigate('/dashboard');
      
      return true;
    } catch (error) {
      // El manejo de errores se realiza en el interceptor de axios
      throw error;
    }
  };
  
  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
    toast.success('Sesión cerrada');
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
