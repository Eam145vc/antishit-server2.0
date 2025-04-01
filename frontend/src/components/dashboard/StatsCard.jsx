import { Link } from 'react-router-dom';

const StatsCard = ({ title, value, valueDetail, total, icon: Icon, color = 'primary', href }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return {
          bg: 'bg-primary-100',
          text: 'text-primary-800',
          icon: 'text-primary-600'
        };
      case 'success':
        return {
          bg: 'bg-success-100',
          text: 'text-success-800',
          icon: 'text-success-600'
        };
      case 'warning':
        return {
          bg: 'bg-warning-100',
          text: 'text-warning-800',
          icon: 'text-warning-600'
        };
      case 'danger':
        return {
          bg: 'bg-danger-100',
          text: 'text-danger-800',
          icon: 'text-danger-600'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: 'text-gray-600'
        };
    }
  };
  
  const colorClasses = getColorClasses();
  
  const CardContent = () => (
    <div className="card h-full">
      <div className="flex items-center p-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses.bg}`}>
          <Icon className={`h-6 w-6 ${colorClasses.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-4">
          <h3 className="text-base font-medium text-gray-900">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {valueDetail && (
              <p className="ml-2 text-sm text-gray-500">{valueDetail}</p>
            )}
            {total !== undefined && (
              <p className="ml-2 text-sm text-gray-500">
                de {total} ({Math.round((value / total) * 100) || 0}%)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  return href ? (
    <Link to={href} className="block">
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
};

export default StatsCard;