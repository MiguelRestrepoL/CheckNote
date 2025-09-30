const TaskDAO = require('../dao/TaskDAO');
/**
 * Controller for task management operations
 * Handles CRUD operations, Kanban board, and task status management
 */
class TaskController {

 /**
   * Validate authenticated user and extract user ID
   * @private
   * @param {Object} req - Express request object
   * @param {Object} req.user - User object from JWT middleware
   * @param {string} req.user._id - User's MongoDB ObjectId
   * @param {Object} res - Express response object
   * @returns {Object} Validation result
   * @returns {boolean} returns.error - Whether validation failed
   * @returns {string} [returns.userId] - User's ID if validation passed
   * @returns {Object} [returns.response] - Error response if validation failed
   */
  _validateUser(req, res) {
    if (!req.user) {
      return { 
        error: true, 
        response: res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        })
      };
    }

    if (!req.user._id) {
      return { 
        error: true, 
        response: res.status(401).json({
          success: false,
          message: 'Datos de usuario inválidos'
        })
      };
    }

    return { error: false, userId: req.user._id };
  }

 /**
   * Create a new task for authenticated user
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.titulo - Task title (required, 2-100 chars)
   * @param {string} [req.body.descripcion] - Task description (max 500 chars)
   * @param {string} [req.body.prioridad='media'] - Priority level (baja|media|alta)
   * @param {string} [req.body.estado='pendiente'] - Kanban state (pendiente|en_progreso|terminada)
   * @param {Date} [req.body.fechaVencimiento] - Due date (must be future)
   * @param {Object} req.user - Authenticated user from middleware
   * @param {string} req.user._id - User's ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 201 with created task
   * @throws {ValidationError} When validation fails (400)
   * @throws {AuthenticationError} When user not authenticated (401)
   */
  async create(req, res) {
    try {
      // Validar usuario primero
      const userValidation = this._validateUser(req, res);
      if (userValidation.error) {
        return userValidation.response;
      }
      
      const { titulo, descripcion, prioridad, fechaVencimiento, estado } = req.body;
      const userId = userValidation.userId;

      // Validación de campos requeridos
      if (!titulo || titulo.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El título de la tarea es requerido',
          required: ['titulo']
        });
      }

      // Validar prioridad si se proporciona
      if (prioridad && !['baja', 'media', 'alta'].includes(prioridad)) {
        return res.status(400).json({
          success: false,
          message: 'La prioridad debe ser: baja, media o alta'
        });
      }

      // NUEVO: Validar estado si se proporciona
      if (estado && !['pendiente', 'en_progreso', 'terminada'].includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'El estado debe ser: pendiente, en_progreso o terminada'
        });
      }

      // Validar fecha de vencimiento si se proporciona
      if (fechaVencimiento) {
        const fecha = new Date(fechaVencimiento);
        if (isNaN(fecha.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Formato de fecha inválido'
          });
        }
        
        if (fecha <= new Date()) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de vencimiento debe ser futura'
          });
        }
      }

      // Crear tarea
      const taskData = {
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || '',
        prioridad: prioridad || 'media',
        estado: estado || 'pendiente',
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
        userId
      };

      const newTask = await TaskDAO.createTask(taskData);

      return res.status(201).json({
        success: true,
        message: 'Tarea creada exitosamente',
        id: newTask._id,
        task: newTask.toJSON()
      });

    } catch (error) {
      console.error('Error al crear tarea:', error);

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: validationErrors
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

/**
   * Get all tasks for authenticated user with optional filters
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {boolean} [req.query.completada] - Filter by completion status
   * @param {string} [req.query.prioridad] - Filter by priority (baja|media|alta)
   * @param {string} [req.query.estado] - Filter by Kanban state (pendiente|en_progreso|terminada)
   * @param {number} [req.query.limite] - Limit number of results
   * @param {Object} req.user - Authenticated user
   * @param {string} req.user._id - User's ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with tasks array and statistics
   * @throws {AuthenticationError} When user not authenticated (401)
   */
  async getAll(req, res) {
    try {
      // Validar usuario primero
      const userValidation = this._validateUser(req, res);
      if (userValidation.error) {
        return userValidation.response;
      }
      
      const userId = userValidation.userId;
      const { completada, prioridad, estado, limite } = req.query;

      // Construir filtros
      const filters = {};
      
      // NUEVO: Filtro por estado Kanban
      if (estado && ['pendiente', 'en_progreso', 'terminada'].includes(estado)) {
        filters.estado = estado;
      }
      
      // Mantener compatibilidad con filtro completada
      if (completada !== undefined && !estado) {
        filters.completada = completada === 'true';
      }
      
      if (prioridad && ['baja', 'media', 'alta'].includes(prioridad)) {
        filters.prioridad = prioridad;
      }

      let tasks = await TaskDAO.getTasksByUserId(userId, filters);

      if (limite && !isNaN(parseInt(limite))) {
        tasks = tasks.slice(0, parseInt(limite));
      }

      // NUEVO: Obtener estadísticas expandidas
      const stats = await TaskDAO.getTaskStats(userId);

      return res.status(200).json({
        success: true,
        message: `${tasks.length} tarea(s) encontrada(s)`,
        tasks,
        stats: {
          total: stats.total,
          // Nuevas estadísticas Kanban
          pendiente: stats.pendiente,
          en_progreso: stats.en_progreso,
          terminada: stats.terminada,
          // Mantener compatibilidad
          completadas: stats.completadas,
          pendientes: stats.pendientes,
          prioridadAlta: stats.prioridadAlta
        },
        filters: {
          estado: estado || 'todas',
          completada: completada !== undefined ? (completada === 'true') : 'todas',
          prioridad: prioridad || 'todas'
        }
      });

    } catch (error) {
      console.error('Error al obtener tareas:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

 /**
   * Get complete Kanban board with tasks organized by state
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user from middleware
   * @param {string} req.user._id - User's ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with board data organized by columns
   * @returns {Object} returns.board - Tasks grouped by state (pendiente, en_progreso, terminada)
   * @returns {Object} returns.stats - Statistics for each column
   * @throws {AuthenticationError} When user not authenticated (401)
   */
  async getKanbanBoard(req, res) {
    try {
      // Validar usuario primero
      const userValidation = this._validateUser(req, res);
      if (userValidation.error) {
        return userValidation.response;
      }
      
      const userId = userValidation.userId;

      const board = await TaskDAO.getTasksByBoard(userId);
      const stats = await TaskDAO.getBoardStats(userId);

      return res.status(200).json({
        success: true,
        message: 'Tablero Kanban obtenido exitosamente',
        data: {
          board: {
            pendiente: board.pendiente,
            en_progreso: board.en_progreso,
            terminada: board.terminada
          },
          stats: {
            pendiente: stats.pendiente,
            en_progreso: stats.en_progreso,
            terminada: stats.terminada,
            total: stats.total
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo tablero Kanban:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Update task status/column in Kanban board
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Task ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.estado - New state (pendiente|en_progreso|terminada)
   * @param {Object} req.user - Authenticated user
   * @param {string} req.user._id - User's ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with updated task
   * @throws {ValidationError} When estado is invalid (400)
   * @throws {NotFoundError} When task not found (404)
   */
  async updateTaskStatus(req, res) {
    try {
      // Validar usuario primero
      const userValidation = this._validateUser(req, res);
      if (userValidation.error) {
        return userValidation.response;
      }
      
      const { id } = req.params;
      const { estado } = req.body;
      const userId = userValidation.userId;

      // Validar estado
      if (!estado || !['pendiente', 'en_progreso', 'terminada'].includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Debe ser: pendiente, en_progreso o terminada'
        });
      }

      const updatedTask = await TaskDAO.updateTaskStatus(id, userId, estado);
      
      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Tarea movida a ${estado.replace('_', ' ')}`,
        task: updatedTask.toJSON()
      });

    } catch (error) {
      console.error('Error actualizando estado de tarea:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Error actualizando estado'
      });
    }
  }

/**
   * Update multiple tasks to same status (bulk operation)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string[]} req.body.taskIds - Array of task IDs to update
   * @param {string} req.body.estado - New state for all tasks (pendiente|en_progreso|terminada)
   * @param {Object} req.user - Authenticated user
   * @param {string} req.user._id - User's ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with count of updated tasks
   * @throws {ValidationError} When taskIds invalid or estado invalid (400)
   */
  async bulkUpdateStatus(req, res) {
    try {
      // Validar usuario primero
      const userValidation = this._validateUser(req, res);
      if (userValidation.error) {
        return userValidation.response;
      }
      
      const { taskIds, estado } = req.body;
      const userId = userValidation.userId;

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de tareas'
        });
      }

      if (!estado || !['pendiente', 'en_progreso', 'terminada'].includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido'
        });
      }

      const updatedCount = await TaskDAO.bulkUpdateStatus(taskIds, userId, estado);

      return res.status(200).json({
        success: true,
        message: `${updatedCount} tarea(s) actualizada(s) a ${estado.replace('_', ' ')}`,
        updatedCount
      });

    } catch (error) {
      console.error('Error en actualización masiva:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
  
/**
   * Get specific task by ID with ownership validation
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Task ID
   * @param {Object} req.user - Authenticated user
   * @param {string} req.user._id - User's ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with task data
   * @throws {NotFoundError} When task not found or doesn't belong to user (404)
   */
  async getById(req, res) {
    try {
      // Validar usuario primero
      const userValidation = this._validateUser(req, res);
      if (userValidation.error) {
        return userValidation.response;
      }
      
      const { id } = req.params;
      const userId = userValidation.userId;

      const task = await TaskDAO.getTaskByIdAndUser(id, userId);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tarea encontrada',
        task
      });

    } catch (error) {
      console.error('Error al obtener tarea:', error);
      return res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

   /**
   * Update task fields with validation
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Task ID
   * @param {Object} req.body - Request body
   * @param {string} [req.body.titulo] - New title
   * @param {string} [req.body.descripcion] - New description
   * @param {boolean} [req.body.completada] - Completion status
   * @param {string} [req.body.estado] - Kanban state (pendiente|en_progreso|terminada)
   * @param {string} [req.body.prioridad] - Priority (baja|media|alta)
   * @param {Date} [req.body.fechaVencimiento] - Due date
   * @param {Object} req.user - Authenticated user
   * @param {string} req.user._id - User's ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with updated task
   * @throws {ValidationError} When validation fails (400)
   * @throws {NotFoundError} When task not found (404)
   */
  async update(req, res) {
    try {
      // Validar usuario primero
      const userValidation = this._validateUser(req, res);
      if (userValidation.error) {
        return userValidation.response;
      }
      
      const { id } = req.params;
      const userId = userValidation.userId;
      const { titulo, descripcion, completada, estado, prioridad, fechaVencimiento } = req.body;

      const existingTask = await TaskDAO.getTaskByIdAndUser(id, userId);
      
      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      const updateData = {};

      if (titulo !== undefined) {
        if (!titulo || titulo.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'El título no puede estar vacío'
          });
        }
        updateData.titulo = titulo.trim();
      }

      if (descripcion !== undefined) {
        updateData.descripcion = descripcion?.trim() || '';
      }

      // NUEVO: Manejar actualización de estado
      if (estado !== undefined) {
        if (!['pendiente', 'en_progreso', 'terminada'].includes(estado)) {
          return res.status(400).json({
            success: false,
            message: 'Estado inválido'
          });
        }
        updateData.estado = estado;
      }

      // Mantener compatibilidad con completada
      if (completada !== undefined && estado === undefined) {
        updateData.completada = Boolean(completada);
      }

      if (prioridad !== undefined) {
        if (!['baja', 'media', 'alta'].includes(prioridad)) {
          return res.status(400).json({
            success: false,
            message: 'La prioridad debe ser: baja, media o alta'
          });
        }
        updateData.prioridad = prioridad;
      }

      if (fechaVencimiento !== undefined) {
        if (fechaVencimiento) {
          const fecha = new Date(fechaVencimiento);
          if (isNaN(fecha.getTime())) {
            return res.status(400).json({
              success: false,
              message: 'Formato de fecha inválido'
            });
          }
          updateData.fechaVencimiento = fecha;
        } else {
          updateData.fechaVencimiento = null;
        }
      }

      const updatedTask = await TaskDAO.updateTask(id, userId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Tarea actualizada exitosamente',
        task: updatedTask.toJSON()
      });

    } catch (error) {
      console.error('Error al actualizar tarea:', error);

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: validationErrors
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

  /**
   * Delete task by ID with ownership validation
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Task ID to delete
   * @param {Object} req.user - Authenticated user
   * @param {string} req.user._id - User's ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with deletion confirmation
   * @throws {NotFoundError} When task not found or doesn't belong to user (404)
   */
  async delete(req, res) {
    try {
      // Validar usuario primero
      const userValidation = this._validateUser(req, res);
      if (userValidation.error) {
        return userValidation.response;
      }
      
      const { id } = req.params;
      const userId = userValidation.userId;

      const deletedTask = await TaskDAO.deleteTask(id, userId);

      if (!deletedTask) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tarea eliminada exitosamente',
        deletedTask: {
          id: deletedTask._id,
          titulo: deletedTask.titulo
        }
      });

    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      return res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }
/**
   * Toggle task completion status (completed/pending)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Task ID
   * @param {Object} req.user - Authenticated user
   * @param {string} req.user._id - User's ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with updated task
   * @throws {NotFoundError} When task not found (404)
   */
  async toggleStatus(req, res) {
    try {
      // Validar usuario primero
      const userValidation = this._validateUser(req, res);
      if (userValidation.error) {
        return userValidation.response;
      }
      
      const { id } = req.params;
      const userId = userValidation.userId;

      const currentTask = await TaskDAO.getTaskByIdAndUser(id, userId);
      
      if (!currentTask) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      const newStatus = !currentTask.completada;
      const updatedTask = await TaskDAO.toggleTaskStatus(id, userId, newStatus);

      return res.status(200).json({
        success: true,
        message: `Tarea marcada como ${newStatus ? 'completada' : 'pendiente'}`,
        task: updatedTask.toJSON()
      });

    } catch (error) {
      console.error('Error al cambiar estado de tarea:', error);
      return res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }
}

module.exports = TaskController;
