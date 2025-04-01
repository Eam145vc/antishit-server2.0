import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <div className="rounded-full bg-warning-100 p-3">
        <ExclamationTriangleIcon 
          className="h-12 w-12 text-warning-600" 
          aria-hidden="true" 
        />
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
        Página no encontrada
      </h1>
      <p className="mt-2 text-base text-gray-500">
        Lo sentimos, no pudimos encontrar la página que estás buscando.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="text-base font-medium text-primary-600 hover:text-primary-500"
        >
          Volver al Dashboard
          <span aria-hidden="true"> &rarr;</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;