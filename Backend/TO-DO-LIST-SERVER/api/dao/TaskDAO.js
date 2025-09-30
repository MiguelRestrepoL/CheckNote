const Task = require('../models/Task');
const mongoose = require('mongoose');
/**
 * Data Access Object for Task operations
 * Handles all database interactions for Task model
 * Includes Kanban board functionality with three states: pendiente, en_progreso, terminada
 * All methods are static and throw errors to be handled by controllers
 */
class TaskDAO {
  /**
   * Create a new task in the database
   * @async
   * @static
   * @param {Object} taskData - Task data to create
   * @param {string} taskData.titulo - Task title
   * @param {string} [taskData.descripcion] - Task description
   * @param {string} [taskData.prioridad='media'] - Priority (baja|media|alta)
   * @param {string} [taskData.estado='pendiente'] - Kanban state (pendiente|en_progreso|terminada)
   * @param {Date} [taskData.fechaVencimiento] - Due date
   * @param {string} taskData.userId - Owner user ID
   * @returns {Promise<Object>} Created task document
   * @throws {MongoError} When database operation fails
   * @throws {ValidationError} When Mongoose validation fails
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
   * Get all tasks for a user with optional filters
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @param {Object} [filters={}] - Optional filters
   * @param {string} [filters.estado] - Filter by Kanban state (pendiente|en_progreso|terminada)
   * @param {boolean} [filters.completada] - Filter by completion (maps to estado)
   * @param {string} [filters.prioridad] - Filter by priority (baja|media|alta)
   * @returns {Promise<Array<Object>>} Array of task documents sorted by creation date
   * @throws {MongoError} When database operation fails
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
   * Get tasks organized by Kanban board columns
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @returns {Promise<Object>} Tasks grouped by state
   * @returns {Array<Object>} returns.pendiente - Tasks in pending state
   * @returns {Array<Object>} returns.en_progreso - Tasks in progress
   * @returns {Array<Object>} returns.terminada - Completed tasks
   * @throws {MongoError} When database operation fails
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
   * Get statistics for Kanban board columns
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @returns {Promise<Object>} Statistics by state
   * @returns {number} returns.pendiente - Count of pending tasks
   * @returns {number} returns.en_progreso - Count of in-progress tasks
   * @returns {number} returns.terminada - Count of completed tasks
   * @returns {number} returns.total - Total task count
   * @throws {MongoError} When database operation fails
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
   * Update task Kanban state with ownership validation
   * Automatically synchronizes completada field when moving to/from terminada
   * @async
   * @static
   * @param {string} taskId - Task's MongoDB ObjectId
   * @param {string} userId - User's MongoDB ObjectId for ownership validation
   * @param {string} nuevoEstado - New state (pendiente|en_progreso|terminada)
   * @returns {Promise<Object|null>} Updated task or null if not found/unauthorized
   * @throws {Error} When estado is invalid
   * @throws {MongoError} When database operation fails
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
   * Get task by ID without ownership validation
   * @async
   * @static
   * @param {string} taskId - Task's MongoDB ObjectId
   * @returns {Promise<Object|null>} Task document or null if not found
   * @throws {MongoError} When database operation fails
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
   * Get task by ID with ownership validation
   * @async
   * @static
   * @param {string} taskId - Task's MongoDB ObjectId
   * @param {string} userId - User's MongoDB ObjectId for ownership validation
   * @returns {Promise<Object|null>} Task document or null if not found/unauthorized
   * @throws {MongoError} When database operation fails
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
   * Update task fields with ownership validation
   * Automatically synchronizes estado and completada fields
   * @async
   * @static
   * @param {string} taskId - Task's MongoDB ObjectId
   * @param {string} userId - User's MongoDB ObjectId for ownership validation
   * @param {Object} updateData - Fields to update
   * @param {string} [updateData.titulo] - New title
   * @param {string} [updateData.descripcion] - New description
   * @param {string} [updateData.estado] - New Kanban state
   * @param {boolean} [updateData.completada] - New completion status
   * @param {string} [updateData.prioridad] - New priority
   * @param {Date} [updateData.fechaVencimiento] - New due date
   * @returns {Promise<Object|null>} Updated task or null if not found/unauthorized
   * @throws {Error} When estado is invalid
   * @throws {MongoError} When database operation fails
   * @throws {ValidationError} When validation fails
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
   * Delete task with ownership validation
   * @async
   * @static
   * @param {string} taskId - Task's MongoDB ObjectId to delete
   * @param {string} userId - User's MongoDB ObjectId for ownership validation
   * @returns {Promise<Object|null>} Deleted task or null if not found/unauthorized
   * @throws {MongoError} When database operation fails
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
   * Toggle task completion status
   * Maps completion to Kanban states (completada=true → terminada, false → pendiente)
   * @async
   * @static
   * @param {string} taskId - Task's MongoDB ObjectId
   * @param {string} userId - User's MongoDB ObjectId for ownership validation
   * @param {boolean} completada - New completion status
   * @returns {Promise<Object|null>} Updated task or null if not found/unauthorized
   * @throws {MongoError} When database operation fails
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
   * Get comprehensive task statistics for user
   * Includes both Kanban states and legacy completion fields
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @returns {Promise<Object>} Complete statistics object
   * @returns {number} returns.total - Total task count
   * @returns {number} returns.pendiente - Pending tasks count
   * @returns {number} returns.en_progreso - In-progress tasks count
   * @returns {number} returns.terminada - Completed tasks count
   * @returns {number} returns.completadas - Legacy completed count
   * @returns {number} returns.pendientes - Legacy pending count
   * @returns {number} returns.prioridadAlta - High priority tasks count
   * @throws {MongoError} When database operation fails
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
   * Get tasks due within specified days, excluding completed
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @param {number} [days=7] - Days ahead to look for due dates
   * @returns {Promise<Object>} Upcoming tasks grouped by state
   * @returns {Array<Object>} returns.pendiente - Pending tasks due soon
   * @returns {Array<Object>} returns.en_progreso - In-progress tasks due soon
   * @throws {MongoError} When database operation fails
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
   * Update multiple tasks to same state (bulk operation)
   * @async
   * @static
   * @param {Array<string>} taskIds - Array of task MongoDB ObjectIds
   * @param {string} userId - User's MongoDB ObjectId for ownership validation
   * @param {string} nuevoEstado - New state for all tasks (pendiente|en_progreso|terminada)
   * @returns {Promise<number>} Number of tasks successfully updated
   * @throws {Error} When estado is invalid
   * @throws {MongoError} When database operation fails
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
   * Delete all tasks for a user
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @returns {Promise<number>} Number of tasks deleted
   * @throws {MongoError} When database operation fails
   * @description Used when deleting user account
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
