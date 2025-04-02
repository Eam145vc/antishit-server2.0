import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Routes from './routes';
import Layout from './components/layout/Layout';
import { useAuth } from './context/AuthContext';

const App = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </HashRouter>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  
  // Si la ruta es login, mostrar sin layout
  const isLoginPage = window.location.hash.includes('/login');

  return (
    <>
      <Toaster position="top-right" />
      {isLoginPage || !user ? (
        <Routes />
      ) : (
        <Layout>
          <Routes />
        </Layout>
      )}
    </>
  );
};

export default App;
