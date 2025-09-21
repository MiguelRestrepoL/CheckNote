const TaskDAO = require('../dao/TaskDAO');

class TaskController {

  /**
   * Crear nueva tarea (modificado para incluir estado)
   * @param {Request} req - Request de Express (con req.user del middleware)
   * @param {Response} res - Response de Express
   */
  async create(req, res) {
    try {
      const { titulo, descripcion, prioridad, fechaVencimiento, estado } = req.body;
      const userId = req.user._id;

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
        estado: estado || 'pendiente', // NUEVO: Por defecto pendiente
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
        userId
      };

      const newTask = await TaskDAO.createTask(taskData);

      res.status(201).json({
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

      res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

  /**
   * Obtener todas las tareas del usuario (actualizado con filtro por estado)
   * @param {Request} req - Request con query params opcionales
   * @param {Response} res - Response de Express
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;
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

      res.status(200).json({
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
      res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

  /**
   * NUEVO: Obtener tablero Kanban completo
   * @param {Request} req - Request de Express
   * @param {Response} res - Response de Express
   */
  async getKanbanBoard(req, res) {
    try {
      const userId = req.user.id;
      
      const board = await TaskDAO.getTasksByBoard(userId);
      const stats = await TaskDAO.getBoardStats(userId);

      res.status(200).json({
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
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * NUEVO: Cambiar estado de tarea (para arrastrar y soltar)
   * @param {Request} req - Request con params.id y body.estado
   * @param {Response} res - Response de Express
   */
  async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const userId = req.user.id;

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

      res.status(200).json({
        success: true,
        message: `Tarea movida a ${estado.replace('_', ' ')}`,
        task: updatedTask.toJSON()
      });

    } catch (error) {
      console.error('Error actualizando estado de tarea:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error actualizando estado'
      });
    }
  }

  /**
   * NUEVO: Actualizar múltiples tareas a un estado
   * @param {Request} req - Request con body.taskIds y body.estado
   * @param {Response} res - Response de Express
   */
  async bulkUpdateStatus(req, res) {
    try {
      const { taskIds, estado } = req.body;
      const userId = req.user.id;

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

      res.status(200).json({
        success: true,
        message: `${updatedCount} tarea(s) actualizada(s) a ${estado.replace('_', ' ')}`,
        updatedCount
      });

    } catch (error) {
      console.error('Error en actualización masiva:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener tarea por ID (sin cambios)
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const task = await TaskDAO.getTaskByIdAndUser(id, userId);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tarea encontrada',
        task
      });

    } catch (error) {
      console.error('Error al obtener tarea:', error);
      res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

  /**
   * Actualizar tarea (modificado para manejar estados)
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
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

      res.status(200).json({
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

      res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

  /**
   * Eliminar tarea (sin cambios)
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deletedTask = await TaskDAO.deleteTask(id, userId);

      if (!deletedTask) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tarea eliminada exitosamente',
        deletedTask: {
          id: deletedTask._id,
          titulo: deletedTask.titulo
        }
      });

    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

  /**
   * Cambiar estado de completado (actualizado para Kanban)
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const currentTask = await TaskDAO.getTaskByIdAndUser(id, userId);
      
      if (!currentTask) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      const newStatus = !currentTask.completada;
      const updatedTask = await TaskDAO.toggleTaskStatus(id, userId, newStatus);

      res.status(200).json({
        success: true,
        message: `Tarea marcada como ${newStatus ? 'completada' : 'pendiente'}`,
        task: updatedTask.toJSON()
      });

    } catch (error) {
      console.error('Error al cambiar estado de tarea:', error);
      res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }
}

module.exports = TaskController;