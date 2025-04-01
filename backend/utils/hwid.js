// utils/hwid.js
const Player = require('../models/Player');
const { emitAlert } = require('./socket');

/**
 * Genera un identificador de hardware único combinando varios componentes
 * @param {Object} hardwareInfo Información de hardware del jugador
 * @returns {String} HWID generado
 */
const generateHWID = (hardwareInfo) => {
  try {
    if (!hardwareInfo) return null;
    
    // Combinar información relevante del hardware
    const components = [
      hardwareInfo.cpu,
      hardwareInfo.motherboard,
      hardwareInfo.gpu,
      hardwareInfo.biosVersion,
      hardwareInfo.hardwareId
    ];
    
    // Filtrar campos vacíos y unir
    return components.filter(item => item).join('|');
  } catch (error) {
    console.error('Error generando HWID:', error);
    return null;
  }
};

/**
 * Registra y actualiza el HWID de un jugador
 * @param {String} playerId ID del jugador
 * @param {String} activisionId ID de Activision
 * @param {Object} hardwareInfo Información de hardware
 */
const trackHWID = async (playerId, activisionId, hardwareInfo) => {
  try {
    if (!hardwareInfo) return;
    
    // Generar HWID
    const hwid = generateHWID(hardwareInfo);
    if (!hwid) return;
    
    // Buscar jugador
    const player = await Player.findById(playerId);
    if (!player) return;
    
    // Verificar si el HWID ya está registrado
    if (!player.hardwareIds.includes(hwid)) {
      // Agregar nuevo HWID
      player.hardwareIds.push(hwid);
      await player.save();
      
      // Verificar si este HWID está asociado a otras cuentas
      const matchingPlayers = await Player.find({
        hardwareIds: hwid,
        _id: { $ne: playerId }
      }).select('activisionId');
      
      // Si hay otras cuentas con el mismo HWID, emitir alerta
      if (matchingPlayers.length > 0) {
        const otherAccounts = matchingPlayers.map(p => p.activisionId);
        
        emitAlert({
          type: 'hwid-duplicate',
          playerId: player._id,
          activisionId,
          channelId: player.currentChannelId,
          message: `Posible cuenta duplicada: ${activisionId}`,
          details: `HWID coincide con otras cuentas: ${otherAccounts.join(', ')}`,
          severity: 'high',
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error registrando HWID:', error);
  }
};

/**
 * Detecta jugadores con HWIDs duplicados
 * @returns {Array} Lista de grupos de jugadores con HWIDs coincidentes
 */
const detectDuplicateHWID = async () => {
  try {
    // Obtener todos los jugadores con HWIDs
    const players = await Player.find({ 
      hardwareIds: { $exists: true, $ne: [] } 
    }).select('activisionId hardwareIds lastSeen');
    
    const hwidsMap = {};
    
    // Agrupar jugadores por HWID
    players.forEach(player => {
      player.hardwareIds.forEach(hwid => {
        if (!hwidsMap[hwid]) {
          hwidsMap[hwid] = [];
        }
        hwidsMap[hwid].push({
          playerId: player._id,
          activisionId: player.activisionId,
          lastSeen: player.lastSeen
        });
      });
    });
    
    // Filtrar solo HWIDs con múltiples jugadores
    const duplicateGroups = Object.entries(hwidsMap)
      .filter(([hwid, playerList]) => playerList.length > 1)
      .map(([hwid, playerList]) => ({
        hwid,
        players: playerList.sort((a, b) => b.lastSeen - a.lastSeen)
      }));
    
    return duplicateGroups;
  } catch (error) {
    console.error('Error detectando HWIDs duplicados:', error);
    return [];
  }
};

module.exports = {
  generateHWID,
  trackHWID,
  detectDuplicateHWID
};