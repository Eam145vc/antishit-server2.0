import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Routes from './routes';
import Layout from './components/layout/Layout';
import { useAuth } from './context/AuthContext';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  
  // Si la ruta es login, mostrar sin layout
  const isLoginPage = window.location.pathname === '/login';

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
