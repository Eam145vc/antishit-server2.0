// frontend/src/components/players/SystemInfoPanel.jsx
import React from 'react';
import { 
  CpuChipIcon, 
  ComputerDesktopIcon, 
  ClockIcon,
  ServerIcon,
  DeviceTabletIcon
} from '@heroicons/react/24/outline';

const SystemInfoPanel = ({ systemInfo = {}, hardwareInfo = {} }) => {
  // Función para formatear valores nulos o undefined
  const formatValue = (value, fallback = 'No disponible') => {
    return value && value !== 'N/A' ? value : fallback;
  };

  // Sección de información reutilizable
  const InfoSection = ({ title, icon: Icon, items }) => {
    // Filtrar items que tengan valor
    const filteredItems = items.filter(item => 
      item.value && item.value !== 'No disponible'
    );

    if (filteredItems.length === 0) {
      return null;
    }

    return (
      <div className="card mb-4">
        <div className="card-header flex items-center">
          <Icon className="mr-2 h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <div className="card-body">
          <dl className="divide-y divide-gray-200">
            {filteredItems.map((item, index) => (
              <div key={index} className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Información del Sistema Operativo */}
      <InfoSection
        title="Sistema Operativo"
        icon={ComputerDesktopIcon}
        items={[
          { 
            label: 'Versión de Windows', 
            value: formatValue(systemInfo.windowsVersion) 
          },
          { 
            label: 'Versión de DirectX', 
            value: formatValue(systemInfo.directXVersion) 
          },
          { 
            label: 'Versión de Framework', 
            value: formatValue(systemInfo.frameworkVersion) 
          },
          { 
            label: 'Resolución de Pantalla', 
            value: formatValue(systemInfo.screenResolution) 
          },
          { 
            label: 'Usuario de Windows', 
            value: formatValue(systemInfo.windowsUsername) 
          },
          { 
            label: 'Nombre del Equipo', 
            value: formatValue(systemInfo.computerName) 
          },
          { 
            label: 'Tipo de Firmware', 
            value: formatValue(systemInfo.firmwareType) 
          },
          { 
            label: 'Zona Horaria', 
            value: formatValue(systemInfo.timeZone) 
          },
          { 
            label: 'Fecha de Instalación', 
            value: formatValue(systemInfo.windowsInstallDate) 
          }
        ]}
      />

      {/* Información de Hardware */}
      <InfoSection
        title="Hardware"
        icon={CpuChipIcon}
        items={[
          { 
            label: 'Procesador', 
            value: formatValue(hardwareInfo.cpu) 
          },
          { 
            label: 'Tarjeta Gráfica', 
            value: formatValue(hardwareInfo.gpu) 
          },
          { 
            label: 'Memoria RAM', 
            value: formatValue(hardwareInfo.ram) 
          },
          { 
            label: 'Placa Madre', 
            value: formatValue(hardwareInfo.motherboard) 
          },
          { 
            label: 'Almacenamiento', 
            value: formatValue(hardwareInfo.storage) 
          },
          { 
            label: 'Adaptadores de Red', 
            value: formatValue(hardwareInfo.networkAdapters) 
          },
          { 
            label: 'Versión de BIOS', 
            value: formatValue(hardwareInfo.biosVersion) 
          }
        ]}
      />

      {/* Información de Tiempo de Sistema */}
      <InfoSection
        title="Tiempo de Sistema"
        icon={ClockIcon}
        items={[
          { 
            label: 'Último Arranque', 
            value: formatValue(systemInfo.lastBootTime) 
          },
          { 
            label: 'Zona Horaria', 
            value: formatValue(systemInfo.timeZone) 
          }
        ]}
      />
    </div>
  );
};

export default SystemInfoPanel;
