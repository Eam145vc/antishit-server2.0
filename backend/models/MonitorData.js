const mongoose = require('mongoose');

const usbDeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  name: { type: String },
  description: { type: String },
  manufacturer: { type: String },
  type: { type: String },
  status: { type: String },
  connectionStatus: { type: String },
  deviceClass: { type: String },
  classGuid: { type: String },
  driver: { type: String },
  hardwareId: { type: String },
  locationInfo: { type: String },
  trustLevel: { 
    type: String, 
    enum: ['Trusted', 'Unknown', 'External', 'Suspicious'],
    default: 'Unknown'
  }
}, { _id: false });

const monitorDataSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  activisionId: {
    type: String,
    required: true
  },
  channelId: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isGameRunning: Boolean,
  pcStartTime: String,
  processes: [{
    name: String,
    pid: Number,
    filePath: String,
    fileHash: String,
    commandLine: String,
    fileVersion: String,
    isSigned: Boolean,
    signatureInfo: String,
    memoryUsage: Number,
    startTime: String,
    suspicious: {
      type: Boolean,
      default: false
    }
  }],
  usbDevices: [usbDeviceSchema],
  networkConnections: [{
    localAddress: String,
    localPort: Number,
    remoteAddress: String,
    remotePort: Number,
    protocol: String,
    state: String,
    processId: Number,
    processName: String
  }],
  loadedDrivers: [{
    name: String,
    displayName: String,
    description: String,
    pathName: String,
    version: String,
    isSigned: Boolean,
    signatureInfo: String,
    startType: String,
    state: String
  }]
}, {
  timestamps: true
});

const MonitorData = mongoose.model('MonitorData', monitorDataSchema);
module.exports = MonitorData;
