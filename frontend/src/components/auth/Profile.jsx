import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await axios.put('/api/auth/profile', { name });
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await axios.put('/api/auth/password', {
        currentPassword,
        newPassword
      });
      
      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cambiar contraseña';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
        <p className="mt-1 text-sm text-gray-500">
          Actualiza tu información personal y contraseña
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Información de perfil */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Información Personal
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  readOnly
                  className="form-input bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  El correo electrónico no se puede cambiar
                </p>
              </div>
              
              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  Rol
                </label>
                <input
                  type="text"
                  id="role"
                  value={user?.role === 'admin' ? 'Administrador' : 'Juez'}
                  readOnly
                  className="form-input bg-gray-50"
                />
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Cambio de contraseña */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Cambiar Contraseña
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;