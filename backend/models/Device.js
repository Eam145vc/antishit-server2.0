// models/Device.js - Modelo para Dispositivos
const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  name: String,
  description: String,
  manufacturer: String,
  type: String, // USB, PCI, Monitor, etc.
  status: String,
  connectionStatus: String,
  deviceClass: String,
  classGuid: String,
  driver: String,
  hardwareId: String,
  locationInfo: String,
  trustLevel: {
    type: String,
    enum: ['Trusted', 'Unknown', 'External', 'Suspicious'],
    default: 'Unknown'
  },
  connectionHistory: [{
    status: {
      type: String,
      enum: ['Connected', 'Disconnected']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Campos adicionales para monitores
  isMonitor: {
    type: Boolean,
    default: false
  },
  monitorInfo: {
    resolution: String,
    refreshRate: String,
    connectionType: String // HDMI, DisplayPort, etc.
  }
}, {
  timestamps: true
});

const Device = mongoose.model('Device', deviceSchema);
module.exports = Device;
