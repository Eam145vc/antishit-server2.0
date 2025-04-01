import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSocket } from '../../context/SocketContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { connected } = useSocket();
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar para móvil */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Sidebar estática para escritorio */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>
      
      {/* Contenido principal */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <Navbar 
          onMenuClick={() => setSidebarOpen(true)} 
          socketConnected={connected}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl space-y-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;