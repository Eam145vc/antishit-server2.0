// models/Tournament.js - Modelo para torneos
const tournamentSchema = mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    description: String,
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    players: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      activisionId: String,
      channelId: Number,
      status: {
        type: String,
        enum: ['registered', 'active', 'disqualified', 'completed'],
        default: 'registered'
      }
    }],
    judges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    status: {
      type: String,
      enum: ['upcoming', 'in-progress', 'completed'],
      default: 'upcoming'
    },
    channels: [{
      id: Number,
      name: String,
      maxPlayers: Number
    }],
    notes: String
  }, {
    timestamps: true
  });
  
  const Tournament = mongoose.model('Tournament', tournamentSchema);
  module.exports = Tournament;