// models/Alert.js - Modelo para Alertas
const mongoose = require('mongoose');

const alertSchema = mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  activisionId: String,
  channelId: Number,
  message: {
    type: String,
    required: true
  },
  details: String,
  severity: {
    type: String,
    enum: ['high', 'medium', 'info'],
    default: 'info',
    required: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  trustLevel: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
