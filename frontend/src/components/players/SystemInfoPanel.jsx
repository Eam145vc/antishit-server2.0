import React, { useEffect } from 'react';
import { 
  CpuChipIcon, 
  ComputerDesktopIcon, 
  ClockIcon,
} from '@heroicons/react/24/outline';
import MonitorInfoPanel from './MonitorInfoPanel';

// Datos predeterminados para mostrar cuando no hay datos reales
const DEFAULT_SYSTEM_INFO = {
  windowsVersion: "Windows 10 Pro",
  directXVersion: "DirectX 12",
  screenResolution: "1920x1080",
  windowsUsername: "Usuario",
  computerName: "DESKTOP-GAMING",
  firmwareType: "UEFI",
  timeZone: "UTC-5",
  frameworkVersion: ".NET Framework 4.7.2",
  lastBootTime: "2025-04-02 08:30:00"
};

const DEFAULT_HARDWARE_INFO = {
  cpu: "Intel Core i7-9700K",
  gpu: "NVIDIA GeForce RTX 3070",
  ram: "16 GB DDR4",
  motherboard: "ASUS ROG STRIX Z390",
  storage: "1TB SSD + 2TB HDD",
  networkAdapters: "Intel Wireless AC-9560",
  biosVersion: "ASUS BIOS 2.17.1246"
};

const SystemInfoPanel = ({ systemInfo = {}, hardwareInfo = {} }) => {
  // Depuración - Inspeccionar exactamente qué datos recibimos
  useEffect(() => {
    console.log("SystemInfoPanel - systemInfo recibido:", systemInfo);
    console.log("SystemInfoPanel - hardwareInfo recibido:", hardwareInfo);
    console.log("Tipo de systemInfo:", typeof systemInfo);
    console.log("Propiedades de systemInfo:", Object.keys(systemInfo));
    console.log("Tipo de hardwareInfo:", typeof hardwareInfo);
    console.log("Propiedades de hardwareInfo:", Object.keys(hardwareInfo));
    
    // Verificar si hay información de monitores
    if (systemInfo && systemInfo.monitorsInfo) {
      console.log("Información de monitores:", systemInfo.monitorsInfo);
    }
  }, [systemInfo, hardwareInfo]);

  // Usar datos reales o predeterminados
  const effectiveSystemInfo = Object.keys(systemInfo || {}).length > 0 
    ? systemInfo 
    : DEFAULT_SYSTEM_INFO;

  const effectiveHardwareInfo = Object.keys(hardwareInfo || {}).length > 0 
    ? hardwareInfo 
    : DEFAULT_HARDWARE_INFO;

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

  // Crear arrays de items para cada sección
  const systemInfoItems = [
    { 
      label: 'Versión de Windows', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'windowsVersion')) 
    },
    { 
      label: 'Versión de DirectX', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'directXVersion')) 
    },
    { 
      label: 'Versión de Framework', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'frameworkVersion')) 
    },
    { 
      label: 'Resolución de Pantalla', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'screenResolution')) 
    },
    { 
      label: 'Usuario de Windows', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'windowsUsername')) 
    },
    { 
      label: 'Nombre del Equipo', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'computerName')) 
    },
    { 
      label: 'Tipo de Firmware', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'firmwareType')) 
    },
    { 
      label: 'Zona Horaria', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'timeZone')) 
    },
    { 
      label: 'Fecha de Instalación', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'windowsInstallDate')) 
    }
  ];

  const hardwareInfoItems = [
    { 
      label: 'Procesador', 
      value: formatValue(getPropertyValue(effectiveHardwareInfo, 'cpu')) 
    },
    { 
      label: 'Tarjeta Gráfica', 
      value: formatValue(getPropertyValue(effectiveHardwareInfo, 'gpu')) 
    },
    { 
      label: 'Memoria RAM', 
      value: formatValue(getPropertyValue(effectiveHardwareInfo, 'ram')) 
    },
    { 
      label: 'Placa Madre', 
      value: formatValue(getPropertyValue(effectiveHardwareInfo, 'motherboard')) 
    },
    { 
      label: 'Almacenamiento', 
      value: formatValue(getPropertyValue(effectiveHardwareInfo, 'storage')) 
    },
    { 
      label: 'Adaptadores de Red', 
      value: formatValue(getPropertyValue(effectiveHardwareInfo, 'networkAdapters')) 
    },
    { 
      label: 'Versión de BIOS', 
      value: formatValue(getPropertyValue(effectiveHardwareInfo, 'biosVersion')) 
    }
  ];

  const systemTimeItems = [
    { 
      label: 'Último Arranque', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'lastBootTime')) 
    },
    { 
      label: 'Zona Horaria', 
      value: formatValue(getPropertyValue(effectiveSystemInfo, 'timeZone')) 
    }
  ];

  // Mensaje debajo de las secciones para indicar que se están mostrando datos de ejemplo
  const UsingDemoDataMessage = () => {
    if (Object.keys(systemInfo || {}).length > 0 || Object.keys(hardwareInfo || {}).length > 0) {
      return null; // No mostrar mensaje si hay datos reales
    }
    
    return (
      <div className="mt-4 rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Nota: Se están mostrando datos de ejemplo porque no hay información real disponible del cliente.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Extraer información de monitores si está disponible
  const monitorInfoData = systemInfo && systemInfo.monitorsInfo 
    ? systemInfo.monitorsInfo 
    : [];

  return (
    <div className="space-y-6">
      {/* Sección de Monitores (nueva) */}
      {monitorInfoData && monitorInfoData.length > 0 && (
        <MonitorInfoPanel monitors={monitorInfoData} />
      )}

      {/* Información del Sistema Operativo */}
      <InfoSection
        title="Sistema Operativo"
        icon={ComputerDesktopIcon}
        items={systemInfoItems}
      />

      {/* Información de Hardware */}
      <InfoSection
        title="Hardware"
        icon={CpuChipIcon}
        items={hardwareInfoItems}
      />

      {/* Información de Tiempo de Sistema */}
      <InfoSection
        title="Tiempo de Sistema"
        icon={ClockIcon}
        items={systemTimeItems}
      />
      
      {/* Mensaje de datos demo */}
      <UsingDemoDataMessage />
    </div>
  );
};

export default SystemInfoPanel;
