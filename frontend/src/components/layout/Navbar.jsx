import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const Navbar = ({ onMenuClick, socketConnected }) => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex flex-1 justify-between px-4 md:px-6">
        <div className="flex flex-1">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={onMenuClick}
          >
            <span className="sr-only">Abrir menú</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Indicador de estado de socket */}
          <div className="mr-3 flex items-center">
            <div className={`h-2.5 w-2.5 rounded-full ${socketConnected ? 'bg-success-500' : 'bg-danger-500'}`}></div>
            <span className="ml-2 text-xs text-gray-600">
              {socketConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          {/* Botón de notificaciones */}
          <Link
            to="/alerts"
            className="rounded-full p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <span className="sr-only">Ver alertas</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </Link>
          
          {/* Menú de usuario */}
          <div className="relative ml-3">
            <div className="flex">
              <button className="flex items-center text-sm">
                <span className="sr-only">Abrir menú de usuario</span>
                <UserCircleIcon className="h-8 w-8 text-gray-600" />
                <div className="ml-2 hidden md:block">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.name || 'Usuario'}
                  </div>
                  <div className="text-xs font-normal text-gray-500">
                    {user?.role === 'admin' ? 'Administrador' : 'Juez'}
                  </div>
                </div>
              </button>
            </div>
            
            {/* Dropdown de usuario */}
            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Mi Perfil
              </Link>
              <button
                onClick={logout}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;