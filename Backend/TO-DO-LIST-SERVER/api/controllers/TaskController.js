const TaskDAO = require('../dao/TaskDAO');

class TaskController {

  /**
   * Crear nueva tarea
   * @param {Request} req - Request de Express (con req.user del middleware)
   * @param {Response} res - Response de Express
   */
  async create(req, res) {
    try {
      const { titulo, descripcion, prioridad, fechaVencimiento } = req.body;
      const userId = req.user._id; // Del middleware authenticateToken

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
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
        userId
      };

      const newTask = await TaskDAO.createTask(taskData);

      // Respuesta exitosa HTTP 201
      res.status(201).json({
        success: true,
        message: 'Tarea creada exitosamente',
        id: newTask._id,
        task: newTask.toJSON()
      });

    } catch (error) {
      console.error('Error al crear tarea:', error);

      // Manejo de errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: validationErrors
        });
      }

      // Error interno del servidor
      res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

  /**
   * Obtener todas las tareas del usuario autenticado
   * @param {Request} req - Request con query params opcionales
   * @param {Response} res - Response de Express
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const { completada, prioridad, limite } = req.query;

      // Construir filtros
      const filters = {};
      
      if (completada !== undefined) {
        filters.completada = completada === 'true';
      }
      
      if (prioridad && ['baja', 'media', 'alta'].includes(prioridad)) {
        filters.prioridad = prioridad;
      }

      // Obtener tareas con filtros
      let tasks = await TaskDAO.getTasksByUserId(userId, filters);

      // Aplicar límite si se especifica
      if (limite && !isNaN(parseInt(limite))) {
        tasks = tasks.slice(0, parseInt(limite));
      }

      // Obtener estadísticas del usuario
      const stats = await TaskDAO.getTaskStats(userId);

      // Respuesta exitosa HTTP 200
      res.status(200).json({
        success: true,
        message: `${tasks.length} tarea(s) encontrada(s)`,
        tasks,
        stats: {
          total: stats.total,
          completadas: stats.completadas,
          pendientes: stats.pendientes,
          prioridadAlta: stats.prioridadAlta
        },
        filters: {
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
   * Obtener tarea por ID (solo si pertenece al usuario)
   * @param {Request} req - Request con params.id
   * @param {Response} res - Response de Express  
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
   * Actualizar tarea por ID
   * @param {Request} req - Request con params.id y body
   * @param {Response} res - Response de Express
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { titulo, descripcion, completada, prioridad, fechaVencimiento } = req.body;

      // Verificar que la tarea existe y pertenece al usuario
      const existingTask = await TaskDAO.getTaskByIdAndUser(id, userId);
      
      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      // Construir objeto de actualización
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

      if (completada !== undefined) {
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

      // Actualizar tarea
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
   * Eliminar tarea por ID
   * @param {Request} req - Request con params.id
   * @param {Response} res - Response de Express
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
   * Cambiar estado de completado de una tarea
   * @param {Request} req - Request con params.id
   * @param {Response} res - Response de Express
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Obtener tarea actual
      const currentTask = await TaskDAO.getTaskByIdAndUser(id, userId);
      
      if (!currentTask) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      // Cambiar estado
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

module.exports =  TaskController;