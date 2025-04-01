// src/components/players/SystemInfoPanel.jsx
import { CpuChipIcon, DeviceTabletIcon, ComputerDesktopIcon, LanguageIcon } from '@heroicons/react/24/outline';

const SystemInfoPanel = ({ player }) => {
  const { systemInfo, hardwareInfo } = player;
  
  const infoSections = [
    {
      title: 'Sistema',
      icon: ComputerDesktopIcon,
      items: [
        { label: 'Windows', value: systemInfo?.windowsVersion },
        { label: 'DirectX', value: systemInfo?.directXVersion },
        { label: 'Controlador GPU', value: systemInfo?.gpuDriverVersion },
        { label: 'Resolución', value: systemInfo?.screenResolution },
        { label: 'Usuario', value: systemInfo?.windowsUsername },
        { label: 'Nombre PC', value: systemInfo?.computerName },
        { label: 'Firmware', value: systemInfo?.firmwareType },
        { label: 'Zona Horaria', value: systemInfo?.timeZone },
        { label: 'Framework', value: systemInfo?.frameworkVersion },
      ].filter(item => item.value)
    },
    {
      title: 'Hardware',
      icon: CpuChipIcon,
      items: [
        { label: 'CPU', value: hardwareInfo?.cpu },
        { label: 'GPU', value: hardwareInfo?.gpu },
        { label: 'RAM', value: hardwareInfo?.ram },
        { label: 'Placa Madre', value: hardwareInfo?.motherboard },
        { label: 'Almacenamiento', value: hardwareInfo?.storage },
        { label: 'BIOS', value: hardwareInfo?.biosVersion },
      ].filter(item => item.value)
    },
    {
      title: 'Red',
      icon: LanguageIcon,
      items: [
        { label: 'Adaptadores', value: hardwareInfo?.networkAdapters },
      ].filter(item => item.value)
    },
    {
      title: 'Inicialización',
      icon: DeviceTabletIcon,
      items: [
        { label: 'PC inicio', value: player.pcStartTime },
        { label: 'Cliente inicio', value: player.clientStartTime ? new Date(player.clientStartTime).toLocaleString() : null },
        { label: 'Windows instalado', value: systemInfo?.windowsInstallDate },
      ].filter(item => item.value)
    }
  ];
  
  if (!systemInfo && !hardwareInfo) {
    return (
      <div className="rounded-md bg-gray-50 p-6 text-center">
        <p className="text-gray-500">No hay información disponible</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {infoSections.map((section) => (
          <div key={section.title} className="card">
            <div className="card-header flex items-center">
              <section.icon className="mr-2 h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
            </div>
            <div className="card-body">
              <dl className="divide-y divide-gray-200">
                {section.items.map((item) => (
                  <div key={item.label} className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ))}
      </div>
      
      {/* HWIDs para detección de cuentas duplicadas */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Hardware IDs</h3>
        </div>
        <div className="card-body">
          {player.hardwareIds?.length > 0 ? (
            <div className="space-y-3">
              {player.hardwareIds.map((hwid, index) => (
                <div
                  key={index}
                  className="break-all rounded-md bg-gray-50 p-3 text-xs font-mono text-gray-700"
                >
                  {hwid}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay identificadores de hardware registrados</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemInfoPanel;