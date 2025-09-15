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
   * Obtener todas las tareas de un usuario
   * @param {String} userId - ID del usuario
   * @param {Object} filters - Filtros opcionales
   * @returns {Array} Lista de tareas
   */
  static async getTasksByUserId(userId, filters = {}) {
    try {
      const query = { userId: new mongoose.Types.ObjectId(userId) };
      
      // Aplicar filtros opcionales
      if (filters.completada !== undefined) {
        query.completada = filters.completada;
      }
      
      if (filters.prioridad) {
        query.prioridad = filters.prioridad;
      }
      
      // Ordenar por fecha de creación (más recientes primero)
      const tasks = await Task.find(query)
        .sort({ createdAt: -1 })
        .lean(); // Mejor performance
        
      return tasks;
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
        userId: new mongoose.Types.ObjectId(userId)
      }).lean();
      
      return task;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar tarea
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

      // Solo actualizar si la tarea pertenece al usuario
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
          new: true,  // Retornar documento actualizado
          runValidators: true  // Ejecutar validaciones de Mongoose
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

      // Solo eliminar si la tarea pertenece al usuario
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
   * Marcar tarea como completada/pendiente
   * @param {String} taskId - ID de la tarea
   * @param {String} userId - ID del usuario
   * @param {Boolean} completada - Estado de completado
   * @returns {Object|null} Tarea actualizada o null
   */
  static async toggleTaskStatus(taskId, userId, completada) {
    try {
      return await this.updateTask(taskId, userId, { completada });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de tareas del usuario
   * @param {String} userId - ID del usuario
   * @returns {Object} Estadísticas
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
        completadas: 0,
        pendientes: 0,
        prioridadAlta: 0
      };
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