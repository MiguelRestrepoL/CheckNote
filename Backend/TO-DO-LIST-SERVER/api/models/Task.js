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
  //  RELACIÓN CON USUARIO
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  }
}, {
  timestamps: true // createdAt, updatedAt automáticos
});

//  ÍNDICES PARA PERFORMANCE
taskSchema.index({ userId: 1, completada: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, prioridad: 1 });

//  MÉTODO PARA RESPUESTA JSON LIMPIA
taskSchema.methods.toJSON = function() {
  const task = this.toObject();
  return {
    id: task._id,
    titulo: task.titulo,
    descripcion: task.descripcion,
    completada: task.completada,
    prioridad: task.prioridad,
    fechaVencimiento: task.fechaVencimiento,
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
};

//  MÉTODOS ESTÁTICOS ÚTILES
taskSchema.statics.getPendingTasksCount = function(userId) {
  return this.countDocuments({ userId, completada: false });
};

taskSchema.statics.getCompletedTasksCount = function(userId) {
  return this.countDocuments({ userId, completada: true });
};

module.exports = mongoose.model('Task', taskSchema);