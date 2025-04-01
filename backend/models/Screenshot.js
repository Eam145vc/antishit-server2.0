// models/Screenshot.js - Modelo para Capturas de Pantalla
const mongoose = require('mongoose');

const screenshotSchema = mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  activisionId: {
    type: String,
    required: true
  },
  channelId: {
    type: Number,
    required: true
  },
  imageData: {
    type: String, // Base64
    required: true
  },
  capturedAt: {
    type: Date,
    default: Date.now
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
});

const Screenshot = mongoose.model('Screenshot', screenshotSchema);
module.exports = Screenshot;
