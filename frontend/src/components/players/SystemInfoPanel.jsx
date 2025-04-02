// frontend/src/components/players/SystemInfoPanel.jsx
import React, { useEffect } from 'react';
import { 
  CpuChipIcon, 
  ComputerDesktopIcon, 
  ClockIcon,
} from '@heroicons/react/24/outline';

const SystemInfoPanel = ({ systemInfo = {}, hardwareInfo = {} }) => {
  // Depuración - Inspeccionar exactamente qué datos recibimos
  useEffect(() => {
    console.log("SystemInfoPanel - systemInfo recibido:", systemInfo);
    console.log("SystemInfoPanel - hardwareInfo recibido:", hardwareInfo);
    console.log("Tipo de systemInfo:", typeof systemInfo);
    console.log("Propiedades de systemInfo:", Object.keys(systemInfo));
    console.log("Tipo de hardwareInfo:", typeof hardwareInfo);
    console.log("Propiedades de hardwareInfo:", Object.keys(hardwareInfo));
  }, [systemInfo, hardwareInfo]);

  // Función para formatear valores nulos o undefined
  const formatValue = (value, fallback = 'No disponible') => {
    return value && value !== 'N/A' ? value : fallback;
  };

  // Función para acceder a propiedades independientemente del formato (case-insensitive)
  const getPropertyValue = (obj, propertyName) => {
    if (!obj || typeof obj !== 'object') return null;
    
    // Intentar acceso directo
    if (obj[propertyName] !== undefined) return obj[propertyName];
    
    // Intentar camelCase (primera letra minúscula)
    const camelCaseKey = propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
    if (obj[camelCaseKey] !== undefined) return obj[camelCaseKey];
    
    // Intentar PascalCase (primera letra mayúscula)
    const pascalCaseKey = propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
    if (obj[pascalCaseKey] !== undefined) return obj[pascalCaseKey];
    
    // Intentar buscar cualquier propiedad que coincida ignorando mayúsculas/minúsculas
    const lowerCaseProperty = propertyName.toLowerCase();
    for (const key in obj) {
      if (key.toLowerCase() === lowerCaseProperty) {
        return obj[key];
      }
    }
    
    return null;
  };

  // Determinar si tenemos datos reales para mostrar
  const hasSystemInfo = systemInfo && Object.keys(systemInfo).length > 0;
  const hasHardwareInfo = hardwareInfo && Object.keys(hardwareInfo).length > 0;
  
  // Si no hay datos, mostrar mensaje
  if (!hasSystemInfo && !hasHardwareInfo) {
    return (
      <div className="bg-gray-50 p-6 text-center rounded-md">
        <p className="text-gray-500">No hay información del sistema disponible</p>
        <p className="text-xs text-gray-400 mt-2">Datos recibidos: systemInfo={JSON.stringify(systemInfo)}, hardwareInfo={JSON.stringify(hardwareInfo)}</p>
      </div>
    );
  }

  // Sección de información reutilizable
  const InfoSection = ({ title, icon: Icon, items, visible = true }) => {
    if (!visible) return null;
    
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

  // Crear arrays de items para cada sección
  const systemInfoItems = [
    { 
      label: 'Versión de Windows', 
      value: formatValue(getPropertyValue(systemInfo, 'windowsVersion')) 
    },
    { 
      label: 'Versión de DirectX', 
      value: formatValue(getPropertyValue(systemInfo, 'directXVersion')) 
    },
    { 
      label: 'Versión de Framework', 
      value: formatValue(getPropertyValue(systemInfo, 'frameworkVersion')) 
    },
    { 
      label: 'Resolución de Pantalla', 
      value: formatValue(getPropertyValue(systemInfo, 'screenResolution')) 
    },
    { 
      label: 'Usuario de Windows', 
      value: formatValue(getPropertyValue(systemInfo, 'windowsUsername')) 
    },
    { 
      label: 'Nombre del Equipo', 
      value: formatValue(getPropertyValue(systemInfo, 'computerName')) 
    },
    { 
      label: 'Tipo de Firmware', 
      value: formatValue(getPropertyValue(systemInfo, 'firmwareType')) 
    },
    { 
      label: 'Zona Horaria', 
      value: formatValue(getPropertyValue(systemInfo, 'timeZone')) 
    },
    { 
      label: 'Fecha de Instalación', 
      value: formatValue(getPropertyValue(systemInfo, 'windowsInstallDate')) 
    }
  ];

  const hardwareInfoItems = [
    { 
      label: 'Procesador', 
      value: formatValue(getPropertyValue(hardwareInfo, 'cpu')) 
    },
    { 
      label: 'Tarjeta Gráfica', 
      value: formatValue(getPropertyValue(hardwareInfo, 'gpu')) 
    },
    { 
      label: 'Memoria RAM', 
      value: formatValue(getPropertyValue(hardwareInfo, 'ram')) 
    },
    { 
      label: 'Placa Madre', 
      value: formatValue(getPropertyValue(hardwareInfo, 'motherboard')) 
    },
    { 
      label: 'Almacenamiento', 
      value: formatValue(getPropertyValue(hardwareInfo, 'storage')) 
    },
    { 
      label: 'Adaptadores de Red', 
      value: formatValue(getPropertyValue(hardwareInfo, 'networkAdapters')) 
    },
    { 
      label: 'Versión de BIOS', 
      value: formatValue(getPropertyValue(hardwareInfo, 'biosVersion')) 
    }
  ];

  const systemTimeItems = [
    { 
      label: 'Último Arranque', 
      value: formatValue(getPropertyValue(systemInfo, 'lastBootTime')) 
    },
    { 
      label: 'Zona Horaria', 
      value: formatValue(getPropertyValue(systemInfo, 'timeZone')) 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Información del Sistema Operativo */}
      <InfoSection
        title="Sistema Operativo"
        icon={ComputerDesktopIcon}
        items={systemInfoItems}
        visible={hasSystemInfo}
      />

      {/* Información de Hardware */}
      <InfoSection
        title="Hardware"
        icon={CpuChipIcon}
        items={hardwareInfoItems}
        visible={hasHardwareInfo}
      />

      {/* Información de Tiempo de Sistema */}
      <InfoSection
        title="Tiempo de Sistema"
        icon={ClockIcon}
        items={systemTimeItems}
        visible={hasSystemInfo}
      />
    </div>
  );
};

export default SystemInfoPanel;
