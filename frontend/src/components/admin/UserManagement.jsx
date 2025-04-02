import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  UserGroupIcon, 
  PlusIcon, 
  TrashIcon, 
  PencilIcon 
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'judge'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/auth/users');
        setUsers(response.data);
      } catch (error) {
        toast.error('Error al cargar usuarios');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Crear nuevo usuario
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await axios.post('/api/auth/register', newUser);
      setUsers([...users, response.data]);
      
      // Limpiar formulario
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'judge'
      });

      toast.success('Usuario creado exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    } finally {
      setIsCreating(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await axios.delete(`/api/auth/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      toast.success('Usuario eliminado exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
        <p className="mt-1 text-sm text-gray-500">
          Administra usuarios del sistema Anti-Cheat
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario de creación de usuarios */}
        <div className="card">
          <div className="card-header flex items-center">
            <PlusIcon className="mr-2 h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Crear Usuario</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="name" className="form-label">Nombre</label>
                <input
                  type="text"
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="email" className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="password" className="form-label">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="role" className="form-label">Rol</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="form-input"
                >
                  <option value="judge">Juez</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isCreating}
                className="btn-primary w-full"
              >
                {isCreating ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="card lg:col-span-2">
          <div className="card-header flex items-center">
            <UserGroupIcon className="mr-2 h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Usuarios Registrados</h3>
          </div>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          user.role === 'admin' 
                            ? 'bg-danger-100 text-danger-800' 
                            : 'bg-primary-100 text-primary-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Juez'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-danger-600 hover:text-danger-900 mr-4"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
