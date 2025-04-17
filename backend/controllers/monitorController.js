// Función auxiliar para procesar dispositivos
async function processDevices(playerId, devices) {
  try {
    for (const deviceInfo of devices) {
      // Buscar si el dispositivo ya existe
      let device = await Device.findOne({
        player: playerId,
        deviceId: deviceInfo.deviceId
      });
      
      // Verificar si es un dispositivo DMA sospechoso
      const isDMA = isDMADevice(deviceInfo);
      
      if (device) {
        // Actualizar información si existe
        device.name = deviceInfo.name || device.name;
        device.description = deviceInfo.description || device.description;
        device.manufacturer = deviceInfo.manufacturer || device.manufacturer;
        device.type = deviceInfo.type || device.type;
        device.status = deviceInfo.status || device.status;
        device.connectionStatus = deviceInfo.connectionStatus || device.connectionStatus;
        device.deviceClass = deviceInfo.deviceClass || device.deviceClass;
        device.classGuid = deviceInfo.classGuid || device.classGuid;
        device.driver = deviceInfo.driver || device.driver;
        device.hardwareId = deviceInfo.hardwareId || device.hardwareId;
        device.locationInfo = deviceInfo.locationInfo || device.locationInfo;
        device.resources = deviceInfo.resources || device.resources || {};
        
        // Si es un DMA, marcar explícitamente como sospechoso
        if (isDMA) {
          device.trustLevel = 'Suspicious';
          device.isDMA = true;
          
          // Añadir nota/tag para alertar sobre DMA
          if (!device.tags) device.tags = [];
          if (!device.tags.includes('DMA')) {
            device.tags.push('DMA');
          }
        } else {
          // Mantener el nivel de confianza actual o el nuevo
          device.trustLevel = deviceInfo.trustLevel || device.trustLevel;
        }
        
        // Determinar si es un monitor
        if (deviceInfo.type?.toLowerCase().includes('monitor') ||
            deviceInfo.name?.toLowerCase().includes('monitor') ||
            deviceInfo.description?.toLowerCase().includes('monitor') ||
            deviceInfo.name?.toLowerCase().includes('display')) {
          device.isMonitor = true;
          
          // Extraer información del monitor
          if (deviceInfo.description && deviceInfo.description.includes('x')) {
            device.monitorInfo = {
              ...device.monitorInfo,
              resolution: deviceInfo.description
            };
          }
        }
        
        // Registrar conexión si cambió el estado
        if (deviceInfo.connectionStatus && 
            device.connectionStatus !== deviceInfo.connectionStatus) {
          device.connectionHistory.push({
            status: deviceInfo.connectionStatus,
            timestamp: new Date()
          });
        }
        
        await device.save();
        
        // Emitir alerta si es un DMA y no se emitió antes
        if (isDMA && !device.dmaAlertSent) {
          device.dmaAlertSent = true;
          await device.save();
          
          const player = await Player.findById(playerId);
          if (player) {
            emitAlert({
              type: 'dma-device-detected',
              playerId: player._id,
              activisionId: player.activisionId,
              channelId: player.currentChannelId,
              deviceId: device._id,
              message: `¡ALERTA CRÍTICA! Dispositivo DMA detectado: ${device.name || 'Dispositivo desconocido'}`,
              details: `Descripción: ${device.description || 'N/A'} | ID: ${device.deviceId}`,
              severity: 'high',
              trustLevel: 'Suspicious',
              timestamp: new Date()
            });
          }
        }
      } else {
        // Crear nuevo dispositivo
        const newDevice = {
          player: playerId,
          ...deviceInfo,
          // Si es DMA, marcar explícitamente como sospechoso
          trustLevel: isDMA ? 'Suspicious' : (deviceInfo.trustLevel || 'Unknown'),
          isDMA: isDMA,
          tags: isDMA ? ['DMA'] : [],
          dmaAlertSent: false,
          resources: deviceInfo.resources || {},
          connectionHistory: [{
            status: deviceInfo.connectionStatus || 'Connected',
            timestamp: new Date()
          }]
        };
        
        // Determinar si es un monitor
        if (deviceInfo.type?.toLowerCase().includes('monitor') ||
            deviceInfo.name?.toLowerCase().includes('monitor') ||
            deviceInfo.description?.toLowerCase().includes('monitor') ||
            deviceInfo.name?.toLowerCase().includes('display')) {
          newDevice.isMonitor = true;
          
          // Extraer información del monitor
          if (deviceInfo.description && deviceInfo.description.includes('x')) {
            newDevice.monitorInfo = {
              resolution: deviceInfo.description,
              refreshRate: '',
              connectionType: ''
            };
          }
        }

        const createdDevice = await Device.create(newDevice);
        
        // Emitir alerta por DMA o dispositivo externo
        const player = await Player.findById(playerId);
        if (player) {
          if (isDMA) {
            // Alerta especial para DMA
            emitAlert({
              type: 'dma-device-detected',
              playerId: player._id,
              activisionId: player.activisionId,
              channelId: player.currentChannelId,
              deviceId: createdDevice._id,
              message: `¡ALERTA CRÍTICA! Dispositivo DMA detectado: ${deviceInfo.name || 'Dispositivo desconocido'}`,
              details: `Descripción: ${deviceInfo.description || 'N/A'} | ID: ${deviceInfo.deviceId}`,
              severity: 'high',
              trustLevel: 'Suspicious',
              timestamp: new Date()
            });
            
            // Marcar alerta como enviada
            createdDevice.dmaAlertSent = true;
            await createdDevice.save();
          }
          else if (deviceInfo.trustLevel === 'External' || deviceInfo.trustLevel === 'Suspicious') {
            // Alerta para otros dispositivos sospechosos
            emitAlert({
              type: 'new-device',
              playerId: player._id,
              activisionId: player.activisionId,
              channelId: player.currentChannelId,
              message: `Nuevo dispositivo detectado: ${deviceInfo.name}`,
              deviceId: deviceInfo.deviceId,
              trustLevel: deviceInfo.trustLevel,
              severity: 'medium',
              timestamp: new Date()
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error procesando dispositivos:', error);
  }
}
