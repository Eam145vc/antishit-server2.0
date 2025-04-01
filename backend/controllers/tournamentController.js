// controllers/tournamentController.js
const Tournament = require('../models/Tournament');
const Player = require('../models/Player');
const { emitAlert } = require('../utils/socket');

// @desc    Crear nuevo torneo
// @route   POST /api/tournaments
// @access  Privado
const createTournament = async (req, res) => {
  try {
    const { name, description, startDate, endDate, channels } = req.body;

    // Validaciones
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Nombre y fechas son requeridos' });
    }

    // Crear nuevo torneo
    const tournament = await Tournament.create({
      name,
      description: description || '',
      startDate,
      endDate,
      judges: [req.user._id], // El creador es juez por defecto
      channels: channels || []
    });

    res.status(201).json(tournament);
  } catch (error) {
    console.error('Error creando torneo:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Actualizar torneo existente
// @route   PUT /api/tournaments/:id
// @access  Privado
const updateTournament = async (req, res) => {
  try {
    const { name, description, startDate, endDate, channels } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }

    // Actualizar campos
    tournament.name = name || tournament.name;
    tournament.description = description !== undefined ? description : tournament.description;
    tournament.startDate = startDate || tournament.startDate;
    tournament.endDate = endDate || tournament.endDate;
    
    if (channels) {
      tournament.channels = channels;
    }

    const updatedTournament = await tournament.save();
    res.json(updatedTournament);
  } catch (error) {
    console.error('Error actualizando torneo:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener todos los torneos
// @route   GET /api/tournaments
// @access  Privado
const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({})
      .populate('judges', 'name email')
      .sort({ startDate: -1 });
    
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener torneo por ID
// @route   GET /api/tournaments/:id
// @access  Privado
const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('judges', 'name email')
      .populate('players.player', 'activisionId lastSeen');
    
    if (tournament) {
      res.json(tournament);
    } else {
      res.status(404).json({ message: 'Torneo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Añadir jugador a torneo
// @route   POST /api/tournaments/:id/players
// @access  Privado
const addPlayerToTournament = async (req, res) => {
  try {
    const { activisionId, channelId } = req.body;
    
    if (!activisionId) {
      return res.status(400).json({ message: 'ID de Activision es requerido' });
    }
    
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }
    
    // Verificar si el jugador ya está en el torneo
    const playerExists = tournament.players.find(p => p.activisionId === activisionId);
    
    if (playerExists) {
      return res.status(400).json({ message: 'Jugador ya está en el torneo' });
    }
    
    // Buscar o crear jugador en la base de datos
    let player = await Player.findOne({ activisionId });
    
    if (!player) {
      player = await Player.create({
        activisionId,
        currentChannelId: channelId || 0
      });
    }
    
    // Añadir jugador al torneo
    tournament.players.push({
      player: player._id,
      activisionId,
      channelId: channelId || 0,
      status: 'registered'
    });
    
    // Añadir referencia del torneo al jugador
    if (!player.tournaments.includes(tournament._id)) {
      player.tournaments.push(tournament._id);
      await player.save();
    }
    
    await tournament.save();
    
    // Notificar a través de socket.io
    global.io?.to(`tournament:${tournament._id}`).emit('player-added', {
      tournamentId: tournament._id,
      activisionId,
      channelId: channelId || 0,
      addedBy: req.user.name,
      timestamp: new Date()
    });
    
    res.json(tournament);
  } catch (error) {
    console.error('Error añadiendo jugador:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Eliminar jugador de torneo
// @route   DELETE /api/tournaments/:id/players/:playerId
// @access  Privado
const removePlayerFromTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }
    
    // Buscar índice del jugador en el torneo
    const playerIndex = tournament.players.findIndex(
      p => p.player.toString() === req.params.playerId
    );
    
    if (playerIndex === -1) {
      return res.status(404).json({ message: 'Jugador no encontrado en el torneo' });
    }
    
    // Guardar activisionId antes de eliminar
    const activisionId = tournament.players[playerIndex].activisionId;
    
    // Eliminar jugador del torneo
    tournament.players.splice(playerIndex, 1);
    await tournament.save();
    
    // Eliminar referencia al torneo del jugador
    await Player.updateOne(
      { _id: req.params.playerId },
      { $pull: { tournaments: tournament._id } }
    );
    
    // Notificar a través de socket.io
    global.io?.to(`tournament:${tournament._id}`).emit('player-removed', {
      tournamentId: tournament._id,
      activisionId,
      removedBy: req.user.name,
      timestamp: new Date()
    });
    
    res.json({ message: 'Jugador eliminado del torneo' });
  } catch (error) {
    console.error('Error eliminando jugador:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cambiar estado del torneo
// @route   PUT /api/tournaments/:id/status
// @access  Privado
const changeTournamentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['upcoming', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }
    
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }
    
    tournament.status = status;
    await tournament.save();
    
    // Notificar a través de socket.io
    global.io?.emit('tournament-status-changed', {
      tournamentId: tournament._id,
      name: tournament.name,
      status,
      changedBy: req.user.name,
      timestamp: new Date()
    });
    
    res.json(tournament);
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Asignar juez a torneo
// @route   POST /api/tournaments/:id/judges
// @access  Privado (Admin)
const assignJudgeToTournament = async (req, res) => {
  try {
    const { judgeId } = req.body;
    
    if (!judgeId) {
      return res.status(400).json({ message: 'ID de juez es requerido' });
    }
    
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Torneo no encontrado' });
    }
    
    // Verificar si el juez ya está asignado
    if (tournament.judges.includes(judgeId)) {
      return res.status(400).json({ message: 'Juez ya está asignado al torneo' });
    }
    
    // Añadir juez
    tournament.judges.push(judgeId);
    await tournament.save();
    
    res.json(tournament);
  } catch (error) {
    console.error('Error asignando juez:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTournament,
  updateTournament,
  getTournaments,
  getTournamentById,
  addPlayerToTournament,
  removePlayerFromTournament,
  changeTournamentStatus,
  assignJudgeToTournament
};
