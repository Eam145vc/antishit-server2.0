import { useRoutes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import routes from './routes';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

const App = () => {
  const { user } = useAuth();
  const routeElement = useRoutes(routes);

  // Si la ruta es login, mostrar sin layout
  const isLoginPage = window.location.pathname === '/login';

  return (
    <>
      <Toaster position="top-right" />
      {isLoginPage || !user ? (
        routeElement
      ) : (
        <Layout>{routeElement}</Layout>
      )}
    </>
  );
};

export default App;