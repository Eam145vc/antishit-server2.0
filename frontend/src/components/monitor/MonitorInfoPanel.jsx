import React from 'react';
import { 
  ComputerDesktopIcon, 
  DeviceTabletIcon, 
  TagIcon, 
  CpuChipIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

const MonitorInfoPanel = ({ monitors = [] }) => {
  if (!monitors || monitors.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-6 text-center">
        <p className="text-gray-500">No hay información de monitores disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-gray-50 p-4 mb-4">
        <div className="flex items-center mb-2">
          <ComputerDesktopIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-base font-medium text-gray-700">Configuración de Pantallas</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {monitors.map((monitor, index) => (
            <div key={index} className="bg-white p-4 rounded-md shadow border-l-4 border-primary-500">
              <div className="flex justify-between items-start">
                <div className="font-medium text-gray-800">
                  {monitor.manufacturer} {monitor.model || `Monitor ${index + 1}`}
                </div>
                {monitor.isPrimary && (
                  <span className="inline-flex items-center rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-800">
                    Primario
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm">
                  <ArrowsPointingOutIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Resolución: {monitor.resolution || 'Desconocida'}</span>
                </div>

                {monitor.serialNumber && (
                  <div className="flex items-center text-sm">
                    <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">S/N: {monitor.serialNumber}</span>
                  </div>
                )}

                {monitor.yearOfManufacture && (
                  <div className="flex items-center text-sm">
                    <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      Fabricación: {monitor.yearOfManufacture}
                      {monitor.weekOfManufacture ? ` (Semana ${monitor.weekOfManufacture})` : ''}
                    </span>
                  </div>
                )}

                {monitor.graphicsCard && (
                  <div className="flex items-center text-sm">
                    <CpuChipIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 truncate" title={monitor.graphicsCard}>
                      GPU: {monitor.graphicsCard.length > 30 ? 
                        `${monitor.graphicsCard.substring(0, 27)}...` : 
                        monitor.graphicsCard}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonitorInfoPanel;
