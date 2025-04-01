// src/components/devices/DeviceTypeFilter.jsx
import { Link } from 'react-router-dom';
import {
  DeviceTabletIcon,
  ComputerDesktopIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

const DeviceTypeFilter = ({ deviceType, setDeviceType }) => {
  return (
    <div className="flex space-x-2">
      <Link
        to="/devices"
        onClick={() => setDeviceType('')}
        className={`flex items-center rounded-full px-3 py-1 text-sm ${
          !deviceType
            ? 'bg-primary-100 text-primary-800'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        Todos
      </Link>
      <Link
        to="/devices/by-type/usb"
        onClick={() => setDeviceType('usb')}
        className={`flex items-center rounded-full px-3 py-1 text-sm ${
          deviceType === 'usb'
            ? 'bg-primary-100 text-primary-800'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        <DeviceTabletIcon className="mr-1 h-4 w-4" />
        USB
      </Link>
      <Link
        to="/devices/by-type/pci"
        onClick={() => setDeviceType('pci')}
        className={`flex items-center rounded-full px-3 py-1 text-sm ${
          deviceType === 'pci'
            ? 'bg-primary-100 text-primary-800'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        <LightBulbIcon className="mr-1 h-4 w-4" />
        PCI
      </Link>
      <Link
        to="/devices/by-type/monitor"
        onClick={() => setDeviceType('monitor')}
        className={`flex items-center rounded-full px-3 py-1 text-sm ${
          deviceType === 'monitor'
            ? 'bg-primary-100 text-primary-800'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        <ComputerDesktopIcon className="mr-1 h-4 w-4" />
        Monitores
      </Link>
    </div>
  );
};

export default DeviceTypeFilter;