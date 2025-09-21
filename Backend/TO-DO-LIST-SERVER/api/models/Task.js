const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título de la tarea es requerido'],
    trim: true,
    minlength: [2, 'El título debe tener al menos 2 caracteres'],
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    default: ''
  },
  // NUEVO: Campo estado para Kanban
  estado: {
    type: String,
    enum: {
      values: ['pendiente', 'en_progreso', 'terminada'],
      message: 'El estado debe ser: pendiente, en_progreso o terminada'
    },
    default: 'pendiente'
  },
  // MANTENER: Campo completada para compatibilidad
  completada: {
    type: Boolean,
    default: false
  },
  prioridad: {
    type: String,
    enum: {
      values: ['baja', 'media', 'alta'],
      message: 'La prioridad debe ser: baja, media o alta'
    },
    default: 'media'
  },
  fechaVencimiento: {
    type: Date,
    validate: {
      validator: function(fecha) {
        // Si se proporciona fecha, debe ser futura
        if (fecha) {
          return fecha > new Date();
        }
        return true;
      },
      message: 'La fecha de vencimiento debe ser futura'
    }
  },
  // RELACIÓN CON USUARIO
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  }
}, {
  timestamps: true // createdAt, updatedAt automáticos
});

// ÍNDICES PARA PERFORMANCE (actualizados para Kanban)
taskSchema.index({ userId: 1, estado: 1 });
taskSchema.index({ userId: 1, completada: 1 }); // Mantener para compatibilidad
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, prioridad: 1 });

// VIRTUAL PARA COMPATIBILIDAD: completada basada en estado
taskSchema.virtual('completadaVirtual').get(function() {
  return this.estado === 'terminada';
});

taskSchema.virtual('completadaVirtual').set(function(value) {
  this.estado = value ? 'terminada' : 'pendiente';
});

// MIDDLEWARE PRE-SAVE: Sincronizar completada con estado
taskSchema.pre('save', function(next) {
  // Si se cambia el estado, actualizar completada
  if (this.isModified('estado')) {
    this.completada = this.estado === 'terminada';
  }
  // Si se cambia completada, actualizar estado
  else if (this.isModified('completada')) {
    this.estado = this.completada ? 'terminada' : 'pendiente';
  }
  next();
});

// MÉTODO PARA RESPUESTA JSON LIMPIA (actualizado)
taskSchema.methods.toJSON = function() {
  const task = this.toObject();
  return {
    id: task._id,
    titulo: task.titulo,
    descripcion: task.descripcion,
    estado: task.estado, // NUEVO: incluir estado
    completada: task.completada, // Mantener para compatibilidad
    prioridad: task.prioridad,
    fechaVencimiento: task.fechaVencimiento,
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
};

// MÉTODOS ESTÁTICOS ÚTILES (actualizados para Kanban)
taskSchema.statics.getPendingTasksCount = function(userId) {
  return this.countDocuments({ userId, estado: 'pendiente' });
};

taskSchema.statics.getInProgressTasksCount = function(userId) {
  return this.countDocuments({ userId, estado: 'en_progreso' });
};

taskSchema.statics.getCompletedTasksCount = function(userId) {
  return this.countDocuments({ userId, estado: 'terminada' });
};

// NUEVO: Método para obtener estadísticas completas del tablero
taskSchema.statics.getBoardStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$estado',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    pendiente: 0,
    en_progreso: 0,
    terminada: 0,
    total: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

// NUEVO: Método para mover tarea entre estados
taskSchema.methods.moveToState = function(newState) {
  const validStates = ['pendiente', 'en_progreso', 'terminada'];
  if (!validStates.includes(newState)) {
    throw new Error(`Estado inválido: ${newState}`);
  }
  
  this.estado = newState;
  this.completada = newState === 'terminada';
  return this.save();
};

// NUEVO: Método estático para obtener tareas por tablero
taskSchema.statics.getTasksByBoard = async function(userId) {
  const tasks = await this.find({ userId }).sort({ createdAt: -1 });
  
  return {
    pendiente: tasks.filter(task => task.estado === 'pendiente'),
    en_progreso: tasks.filter(task => task.estado === 'en_progreso'),
    terminada: tasks.filter(task => task.estado === 'terminada')
  };
};

module.exports = mongoose.model('Task', taskSchema);