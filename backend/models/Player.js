// models/Player.js - Modelo para Jugadores
const mongoose = require('mongoose');

const playerSchema = mongoose.Schema({
  activisionId: {
    type: String,
    required: true,
    unique: true
  },
  nickname: String,
  email: String,
  currentChannelId: {
    type: Number,
    default: 0
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isGameRunning: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  clientStartTime: Date,
  pcStartTime: String,
  hardwareIds: [String],
  systemInfo: {
    windowsVersion: String,
    directXVersion: String,
    gpuDriverVersion: String,
    screenResolution: String,
    windowsUsername: String,
    computerName: String,
    windowsInstallDate: String,
    lastBootTime: String,
    firmwareType: String,
    languageSettings: String,
    timeZone: String,
    frameworkVersion: String
  },
  hardwareInfo: {
    cpu: String,
    gpu: String,
    ram: String,
    motherboard: String,
    storage: String,
    networkAdapters: String,
    audioDevices: String,
    biosVersion: String,
    hardwareId: String
  },
  tournaments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  }],
  suspiciousActivity: {
    type: Boolean,
    default: false
  },
  notes: String
}, {
  timestamps: true
});

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
