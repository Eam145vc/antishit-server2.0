// models/MonitorData.js - Modelo para datos de monitoreo
const monitorDataSchema = mongoose.Schema({
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
    usbDevices: [{
      deviceId: String,
      name: String,
      type: String,
      trustLevel: String
    }],
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