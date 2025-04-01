const express = require('express');
const router = express.Router();
const { 
  createTournament,
  updateTournament,
  getTournaments,
  getTournamentById,
  addPlayerToTournament,
  removePlayerFromTournament,
  changeTournamentStatus,
  assignJudgeToTournament
} = require('../controllers/tournamentController');
const { protect, admin } = require('../middleware/auth');

// Rutas simplificadas
router.post('/', protect, createTournament);
router.get('/', protect, getTournaments);
router.get('/:id', protect, getTournamentById);
router.put('/:id', protect, updateTournament);
router.put('/:id/status', protect, changeTournamentStatus);
router.post('/:id/players', protect, addPlayerToTournament);
router.delete('/:id/players/:playerId', protect, removePlayerFromTournament);
router.post('/:id/judges', protect, admin, assignJudgeToTournament);

module.exports = router;
