// frontend/src/components/players/SystemInfoPanel.jsx
import React, { useEffect, useState } from 'react';
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

  // Función para manejar diferentes formatos de case (camelCase vs PascalCase)
  const getValueCaseInsensitive = (obj, key) => {
    if (!obj) return null;
    
    // Intentar con la clave original
    if (obj[key] !== undefined) return obj[key];
    
    // Intentar con la primera letra en minúscula (camelCase)
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    if (obj[camelKey] !== undefined) return obj[camelKey];
    
    // Intentar con la primera letra en mayúscula (PascalCase)
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (obj[pascalKey] !== undefined) return obj[pascalKey];
    
    return null;
  };

  // Sección de información reutilizable
  const InfoSection = ({ title, icon: Icon, items }) => {
    // Filtrar items que tengan valor significativo
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

  // Registrar info recibida para depuración
  useEffect(() => {
    console.log("SystemInfoPanel recibió systemInfo:", systemInfo);
    console.log("SystemInfoPanel recibió hardwareInfo:", hardwareInfo);
  }, [systemInfo, hardwareInfo]);

  // Si no hay datos, mostrar mensaje indicativo
  if (Object.keys(systemInfo).length === 0 && Object.keys(hardwareInfo).length === 0) {
    return (
      <div className="bg-gray-50 p-6 text-center rounded-md">
        <p className="text-gray-500">No hay información del sistema disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información del Sistema Operativo */}
      <InfoSection
        title="Sistema Operativo"
        icon={ComputerDesktopIcon}
        items={[
          { 
            label: 'Versión de Windows', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'windowsVersion')) 
          },
          { 
            label: 'Versión de DirectX', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'directXVersion')) 
          },
          { 
            label: 'Versión de Framework', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'frameworkVersion')) 
          },
          { 
            label: 'Resolución de Pantalla', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'screenResolution')) 
          },
          { 
            label: 'Usuario de Windows', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'windowsUsername')) 
          },
          { 
            label: 'Nombre del Equipo', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'computerName')) 
          },
          { 
            label: 'Tipo de Firmware', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'firmwareType')) 
          },
          { 
            label: 'Zona Horaria', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'timeZone')) 
          },
          { 
            label: 'Fecha de Instalación', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'windowsInstallDate')) 
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
            value: formatValue(getValueCaseInsensitive(hardwareInfo, 'cpu')) 
          },
          { 
            label: 'Tarjeta Gráfica', 
            value: formatValue(getValueCaseInsensitive(hardwareInfo, 'gpu')) 
          },
          { 
            label: 'Memoria RAM', 
            value: formatValue(getValueCaseInsensitive(hardwareInfo, 'ram')) 
          },
          { 
            label: 'Placa Madre', 
            value: formatValue(getValueCaseInsensitive(hardwareInfo, 'motherboard')) 
          },
          { 
            label: 'Almacenamiento', 
            value: formatValue(getValueCaseInsensitive(hardwareInfo, 'storage')) 
          },
          { 
            label: 'Adaptadores de Red', 
            value: formatValue(getValueCaseInsensitive(hardwareInfo, 'networkAdapters')) 
          },
          { 
            label: 'Versión de BIOS', 
            value: formatValue(getValueCaseInsensitive(hardwareInfo, 'biosVersion')) 
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
            value: formatValue(getValueCaseInsensitive(systemInfo, 'lastBootTime')) 
          },
          { 
            label: 'Zona Horaria', 
            value: formatValue(getValueCaseInsensitive(systemInfo, 'timeZone')) 
          }
        ]}
      />
    </div>
  );
};

export default SystemInfoPanel;
