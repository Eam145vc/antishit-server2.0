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
    type: String, // Base64 con prefijo data:image
    required: true,
    validate: {
      validator: function(v) {
        // Validar que sea una cadena base64 válida
        const base64Regex = /^data:image\/(png|jpeg|jpg|gif|bmp);base64,([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;
        return base64Regex.test(v);
      },
      message: 'La imagen debe ser una cadena base64 válida con prefijo data:image'
    }
  },
  capturedAt: {
    type: Date,
    default: Date.now
  },
  // Campo específico de source mejorado para distinguir el origen
  source: {
    type: String,
    enum: ['user', 'judge'],
    default: 'user'
  },
  // Tipo explícito para mejor categorización
  type: {
    type: String,
    enum: ['user-submitted', 'judge-requested', 'scheduled'],
    default: 'user-submitted'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Almacenar metadatos adicionales de la solicitud
  requestInfo: {
    type: Object,
    default: null
  },
  notes: String,
  
  // Campos para metadatos adicionales
  resolution: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  }
}, {
  timestamps: true,
  
  // Método para obtener la imagen sin datos binarios
  toJSON: {
    transform: function(doc, ret) {
      // Opcional: truncar imageData para consultas
      if (ret.imageData && ret.imageData.length > 100) {
        ret.imagePreview = ret.imageData.substring(0, 100) + '...';
      }
      return ret;
    }
  }
});

// Middleware pre-save para normalizar datos de imagen
screenshotSchema.pre('save', function(next) {
  // Asegurar que la imagen tenga el prefijo correcto
  if (this.imageData && !this.imageData.startsWith('data:image')) {
    this.imageData = `data:image/png;base64,${this.imageData}`;
  }
  
  // Calcular resolución si es posible (opcional)
  try {
    const base64Data = this.imageData.split(',')[1];
    this.fileSize = base64Data.length * 0.75; // Aproximado
  } catch (error) {
    console.warn('No se pudo calcular el tamaño de la imagen');
  }
  
  // Asegurar que source y type sean consistentes
  if (this.source === 'judge' && this.type !== 'judge-requested') {
    this.type = 'judge-requested';
  } else if (this.source === 'user' && this.type !== 'user-submitted') {
    this.type = 'user-submitted';
  }
  
  next();
});

const Screenshot = mongoose.model('Screenshot', screenshotSchema);
module.exports = Screenshot;
