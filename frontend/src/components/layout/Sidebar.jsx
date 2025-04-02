import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  DeviceTabletIcon,
  CameraIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Monitoreo en Vivo', href: '/live-monitor', icon: ShieldCheckIcon },
  { name: 'Jugadores', href: '/players', icon: UsersIcon },
  { name: 'Dispositivos', href: '/devices', icon: DeviceTabletIcon },
  { name: 'Capturas', href: '/screenshots', icon: CameraIcon },
  { name: 'Alertas', href: '/alerts', icon: BellAlertIcon },
  { name: 'Torneos', href: '/tournaments', icon: TrophyIcon },
];

const adminNavigation = [
  { name: 'Gestión de Usuarios', href: '/admin/users', icon: UserGroupIcon },
];

const Sidebar = ({ isOpen = true, onClose }) => {
  const { isAdmin } = useAuth();
  
  // Filtrar navegación basada en rol
  const navItems = [
    ...navigation,
    ...(isAdmin ? adminNavigation : []),
  ];
  
  return (
    <>
      {/* Sidebar móvil */}
      {isOpen !== undefined && (
        <div
          className={`fixed inset-0 z-40 lg:hidden ${
            isOpen ? 'block' : 'hidden'
          }`}
        >
          {/* Overlay oscuro */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={onClose}
          ></div>
          
          {/* Sidebar móvil con botón de cerrar */}
          <div className="fixed inset-0 z-40 flex">
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={onClose}
                >
                  <span className="sr-only">Cerrar sidebar</span>
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              
              {/* Logo */}
              <div className="flex flex-shrink-0 items-center px-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
                  <h1 className="text-xl font-bold text-gray-900">Anti-Cheat</h1>
                </div>
              </div>
              
              {/* Navegación */}
              <div className="mt-5 h-0 flex-1 overflow-y-auto">
                <nav className="px-2">
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          location.pathname.startsWith(item.href)
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center rounded-md px-2 py-2 text-base font-medium`}
                        onClick={onClose}
                      >
                        <item.icon
                          className={`${
                            location.pathname.startsWith(item.href)
                              ? 'text-primary-600'
                              : 'text-gray-500 group-hover:text-gray-500'
                          } mr-4 h-6 w-6 flex-shrink-0`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sidebar escritorio */}
      <div className="flex h-full flex-col border-r border-gray-200 bg-white">
        {/* Logo y nombre de la app */}
        <div className="flex h-16 flex-shrink-0 items-center border-b border-gray-200 px-4">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-lg font-bold text-gray-900">Anti-Cheat</h1>
          </div>
        </div>
        
        {/* Menú de navegación */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  location.pathname.startsWith(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
              >
                <item.icon
                  className={`${
                    location.pathname.startsWith(item.href)
                      ? 'text-primary-600'
                      : 'text-gray-500 group-hover:text-gray-500'
                  } mr-3 h-5 w-5 flex-shrink-0`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
