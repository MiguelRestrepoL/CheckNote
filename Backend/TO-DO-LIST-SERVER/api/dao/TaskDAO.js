const Task = require('../models/Task');
const mongoose = require('mongoose');

class TaskDAO {
  
  /**
   * Crear nueva tarea
   * @param {Object} taskData - Datos de la tarea
   * @returns {Object} Tarea creada con ID
   */
  static async createTask(taskData) {
    try {
      const task = new Task(taskData);
      const savedTask = await task.save();
      return savedTask;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todas las tareas de un usuario con filtros mejorados
   * @param {String} userId - ID del usuario
   * @param {Object} filters - Filtros opcionales
   * @returns {Array} Lista de tareas
   */
  static async getTasksByUserId(userId, filters = {}) {
    try {
      const query = { userId: userId };
      
      // NUEVO: Filtro por estado Kanban
      if (filters.estado) {
        query.estado = filters.estado;
      }
      
      // Mantener compatibilidad: filtro por completada
      if (filters.completada !== undefined) {
        if (filters.completada) {
          query.estado = 'terminada';
        } else {
          query.estado = { $ne: 'terminada' };
        }
      }
      
      if (filters.prioridad) {
        query.prioridad = filters.prioridad;
      }
      
      // Ordenar por fecha de creación (más recientes primero)
      const tasks = await Task.find(query)
        .sort({ createdAt: -1 })
        .lean();
        
      return tasks;
    } catch (error) {
      throw error;
    }
  }

  /**
   * NUEVO: Obtener tareas organizadas por tablero Kanban
   * @param {String} userId - ID del usuario
   * @returns {Object} Tareas organizadas por estado
   */
  static async getTasksByBoard(userId) {
    try {
      const tasks = await Task.find({ userId })
        .sort({ createdAt: -1 })
        .lean();
      
      return {
        pendiente: tasks.filter(task => task.estado === 'pendiente'),
        en_progreso: tasks.filter(task => task.estado === 'en_progreso'),
        terminada: tasks.filter(task => task.estado === 'terminada')
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * NUEVO: Obtener estadísticas del tablero Kanban
   * @param {String} userId - ID del usuario
   * @returns {Object} Estadísticas por estado
   */
  static async getBoardStats(userId) {
    try {
      const stats = await Task.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) }
        },
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * NUEVO: Cambiar estado de una tarea
   * @param {String} taskId - ID de la tarea
   * @param {String} userId - ID del usuario
   * @param {String} nuevoEstado - Nuevo estado ('pendiente', 'en_progreso', 'terminada')
   * @returns {Object|null} Tarea actualizada o null
   */
  static async updateTaskStatus(taskId, userId, nuevoEstado) {
    try {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return null;
      }

      const validStates = ['pendiente', 'en_progreso', 'terminada'];
      if (!validStates.includes(nuevoEstado)) {
        throw new Error(`Estado inválido: ${nuevoEstado}. Debe ser: ${validStates.join(', ')}`);
      }

      const updatedTask = await Task.findOneAndUpdate(
        { 
          _id: taskId, 
          userId: new mongoose.Types.ObjectId(userId) 
        },
        { 
          estado: nuevoEstado,
          completada: nuevoEstado === 'terminada', // Sincronizar completada
          updatedAt: new Date() 
        },
        { 
          new: true,
          runValidators: true
        }
      );
      
      return updatedTask;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener tarea por ID
   * @param {String} taskId - ID de la tarea
   * @returns {Object|null} Tarea encontrada o null
   */
  static async getTaskById(taskId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return null;
      }
      
      const task = await Task.findById(taskId).lean();
      return task;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener tarea por ID y verificar que pertenece al usuario
   * @param {String} taskId - ID de la tarea
   * @param {String} userId - ID del usuario
   * @returns {Object|null} Tarea si pertenece al usuario, null si no
   */
  static async getTaskByIdAndUser(taskId, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return null;
      }
      
      const task = await Task.findOne({
        _id: taskId,
        userId: userId
      }).lean();
      
      return task;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar tarea (modificado para manejar estados)
   * @param {String} taskId - ID de la tarea
   * @param {String} userId - ID del usuario (validar propiedad)
   * @param {Object} updateData - Datos a actualizar
   * @returns {Object|null} Tarea actualizada o null
   */
  static async updateTask(taskId, userId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return null;
      }

      // Validar estado si se proporciona
      if (updateData.estado) {
        const validStates = ['pendiente', 'en_progreso', 'terminada'];
        if (!validStates.includes(updateData.estado)) {
          throw new Error(`Estado inválido: ${updateData.estado}`);
        }
        // Sincronizar campo completada
        updateData.completada = updateData.estado === 'terminada';
      }

      // Si se actualiza completada, sincronizar estado
      if (updateData.completada !== undefined && !updateData.estado) {
        updateData.estado = updateData.completada ? 'terminada' : 'pendiente';
      }

      const updatedTask = await Task.findOneAndUpdate(
        { 
          _id: taskId, 
          userId: new mongoose.Types.ObjectId(userId) 
        },
        { 
          ...updateData, 
          updatedAt: new Date() 
        },
        { 
          new: true,
          runValidators: true
        }
      );
      
      return updatedTask;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar tarea
   * @param {String} taskId - ID de la tarea
   * @param {String} userId - ID del usuario (validar propiedad)
   * @returns {Object|null} Tarea eliminada o null
   */
  static async deleteTask(taskId, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return null;
      }

      const deletedTask = await Task.findOneAndDelete({
        _id: taskId,
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      return deletedTask;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marcar tarea como completada/pendiente (actualizado para Kanban)
   * @param {String} taskId - ID de la tarea
   * @param {String} userId - ID del usuario
   * @param {Boolean} completada - Estado de completado
   * @returns {Object|null} Tarea actualizada o null
   */
  static async toggleTaskStatus(taskId, userId, completada) {
    try {
      const estado = completada ? 'terminada' : 'pendiente';
      return await this.updateTask(taskId, userId, { 
        completada, 
        estado 
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de tareas del usuario (actualizado para Kanban)
   * @param {String} userId - ID del usuario
   * @returns {Object} Estadísticas completas
   */
  static async getTaskStats(userId) {
    try {
      const stats = await Task.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            // Estados Kanban
            pendiente: {
              $sum: { $cond: [{ $eq: ["$estado", "pendiente"] }, 1, 0] }
            },
            en_progreso: {
              $sum: { $cond: [{ $eq: ["$estado", "en_progreso"] }, 1, 0] }
            },
            terminada: {
              $sum: { $cond: [{ $eq: ["$estado", "terminada"] }, 1, 0] }
            },
            // Mantener compatibilidad
            completadas: {
              $sum: { $cond: [{ $eq: ["$completada", true] }, 1, 0] }
            },
            pendientes: {
              $sum: { $cond: [{ $eq: ["$completada", false] }, 1, 0] }
            },
            prioridadAlta: {
              $sum: { $cond: [{ $eq: ["$prioridad", "alta"] }, 1, 0] }
            }
          }
        }
      ]);

      return stats.length > 0 ? stats[0] : {
        total: 0,
        pendiente: 0,
        en_progreso: 0,
        terminada: 0,
        completadas: 0,
        pendientes: 0,
        prioridadAlta: 0
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * NUEVO: Obtener tareas próximas a vencer por estado
   * @param {String} userId - ID del usuario
   * @param {Number} days - Días de anticipación
   * @returns {Object} Tareas próximas a vencer por estado
   */
  static async getUpcomingTasksByState(userId, days = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const tasks = await Task.find({
        userId: new mongoose.Types.ObjectId(userId),
        fechaVencimiento: { 
          $gte: new Date(),
          $lte: futureDate
        },
        estado: { $ne: 'terminada' } // Excluir terminadas
      }).sort({ fechaVencimiento: 1 }).lean();

      return {
        pendiente: tasks.filter(task => task.estado === 'pendiente'),
        en_progreso: tasks.filter(task => task.estado === 'en_progreso')
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * NUEVO: Mover múltiples tareas a un estado
   * @param {Array} taskIds - IDs de las tareas
   * @param {String} userId - ID del usuario
   * @param {String} nuevoEstado - Nuevo estado
   * @returns {Number} Número de tareas actualizadas
   */
  static async bulkUpdateStatus(taskIds, userId, nuevoEstado) {
    try {
      const validStates = ['pendiente', 'en_progreso', 'terminada'];
      if (!validStates.includes(nuevoEstado)) {
        throw new Error(`Estado inválido: ${nuevoEstado}`);
      }

      const result = await Task.updateMany(
        {
          _id: { $in: taskIds.map(id => new mongoose.Types.ObjectId(id)) },
          userId: new mongoose.Types.ObjectId(userId)
        },
        {
          estado: nuevoEstado,
          completada: nuevoEstado === 'terminada',
          updatedAt: new Date()
        }
      );

      return result.modifiedCount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar todas las tareas de un usuario
   * @param {String} userId - ID del usuario
   * @returns {Number} Número de tareas eliminadas
   */
  static async deleteAllUserTasks(userId) {
    try {
      const result = await Task.deleteMany({
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      return result.deletedCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TaskDAO;