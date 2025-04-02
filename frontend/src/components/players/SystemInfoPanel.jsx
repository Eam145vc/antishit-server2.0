// frontend/src/components/players/SystemInfoPanel.jsx
import { 
  CpuChipIcon, 
  DeviceTabletIcon, 
  ComputerDesktopIcon, 
  LanguageIcon,
  ClockIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

const SystemInfoPanel = ({ systemInfo = {} }) => {
  // Valores por defecto para prevenir errores
  const {
    windowsVersion = 'No disponible',
    directXVersion = 'No disponible',
    gpuDriverVersion = 'No disponible',
    screenResolution = 'No disponible',
    windowsUsername = 'No disponible',
    computerName = 'No disponible',
    firmwareType = 'No disponible',
    timeZone = 'No disponible',
    windowsInstallDate = 'No disponible',
    lastBootTime = 'No disponible',
    frameworkVersion = 'No disponible',
    languageSettings = 'No disponible'
  } = systemInfo;

  // Información adicional de hardware si está disponible
  const hardwareInfo = systemInfo.hardwareInfo || {};
  const {
    cpu = 'No disponible',
    gpu = 'No disponible',
    ram = 'No disponible',
    motherboard = 'No disponible',
    storage = 'No disponible',
    networkAdapters = 'No disponible',
    biosVersion = 'No disponible'
  } = hardwareInfo;

  // Componente para renderizar secciones de información
  const InfoSection = ({ icon: Icon, title, items }) => (
    <div className="card">
      <div className="card-header flex items-center">
        <Icon className="mr-2 h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="card-body">
        <dl className="divide-y divide-gray-200">
          {items.map((item, index) => (
            item.value && (
              <div key={index} className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {item.value}
                </dd>
              </div>
            )
          ))}
        </dl>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Información del Sistema Operativo */}
      <InfoSection
        icon={ComputerDesktopIcon}
        title="Sistema Operativo"
        items={[
          { label: 'Versión de Windows', value: windowsVersion },
          { label: 'Versión de DirectX', value: directXVersion },
          { label: 'Versión de Framework', value: frameworkVersion },
          { label: 'Resolución de Pantalla', value: screenResolution },
          { label: 'Usuario de Windows', value: windowsUsername },
          { label: 'Nombre del Equipo', value: computerName },
          { label: 'Tipo de Firmware', value: firmwareType },
          { label: 'Zona Horaria', value: timeZone },
          { label: 'Idioma', value: languageSettings },
          { label: 'Fecha de Instalación', value: windowsInstallDate },
        ]}
      />

      {/* Información de Hardware */}
      <InfoSection
        icon={CpuChipIcon}
        title="Hardware"
        items={[
          { label: 'Procesador', value: cpu },
          { label: 'Tarjeta Gráfica', value: gpu },
          { label: 'Memoria RAM', value: ram },
          { label: 'Placa Madre', value: motherboard },
          { label: 'Almacenamiento', value: storage },
          { label: 'Adaptadores de Red', value: networkAdapters },
          { label: 'Versión de BIOS', value: biosVersion },
          { label: 'Version de Driver GPU', value: gpuDriverVersion },
        ]}
      />

      {/* Información de Tiempo y Arranque */}
      <InfoSection
        icon={ClockIcon}
        title="Tiempo de Sistema"
        items={[
          { label: 'Último Arranque', value: lastBootTime },
          { label: 'Zona Horaria', value: timeZone },
        ]}
      />
    </div>
  );
};

export default SystemInfoPanel;
