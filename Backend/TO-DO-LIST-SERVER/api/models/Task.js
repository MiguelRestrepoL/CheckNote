/**
 * @fileoverview Task Model - Mongoose schema for task management with Kanban board support
 * @module models/Task
 * @requires mongoose
 * 
 * @description
 * Defines the Task model with full Kanban board functionality while maintaining
 * backward compatibility with the boolean 'completada' field. Includes:
 * - Three-state workflow: pendiente → en_progreso → terminada
 * - Task properties: title, description, priority, due date
 * - User relationship and ownership
 * - Performance indexes for queries
 * - Board statistics and state transitions
 * - Automatic synchronization between 'estado' and 'completada' fields
 * 
 * @example
 * // Create a new task
 * const task = new Task({
 *   titulo: 'Complete documentation',
 *   descripcion: 'Finish JSDoc for Task model',
 *   estado: 'pendiente',
 *   prioridad: 'alta',
 *   userId: mongoose.Types.ObjectId('...')
 * });
 * await task.save();
 * 
 * @example
 * // Move task through Kanban states
 * await task.moveToState('en_progreso');
 * await task.moveToState('terminada');
 * 
 * @example
 * // Get board statistics
 * const stats = await Task.getBoardStats(userId);
 * // Returns: { pendiente: 5, en_progreso: 3, terminada: 12, total: 20 }
 */
const mongoose = require('mongoose');
/**
 * @typedef {Object} TaskDocument
 * @property {string} titulo - Task title (2-100 characters)
 * @property {string} descripcion - Task description (max 500 characters)
 * @property {('pendiente'|'en_progreso'|'terminada')} estado - Kanban state
 * @property {boolean} completada - Completion status (backward compatibility)
 * @property {('baja'|'media'|'alta')} prioridad - Task priority level
 * @property {Date} [fechaVencimiento] - Due date (must be future date)
 * @property {mongoose.Types.ObjectId} userId - Owner user reference
 * @property {Date} createdAt - Creation timestamp (auto-generated)
 * @property {Date} updatedAt - Last update timestamp (auto-generated)
 */


/**
 * Task Schema Definition
 * 
 * @type {mongoose.Schema<TaskDocument>}
 * 
 * @description
 * Mongoose schema for tasks with Kanban board support. Features:
 * - Dual-state system: 'estado' (Kanban) + 'completada' (legacy boolean)
 * - Automatic synchronization between both state fields
 * - Rich validation rules for all fields
 * - Performance indexes for common queries
 * - Virtual properties for compatibility
 * 
 * State Flow:
 * 1. pendiente (default) - Task created, not started
 * 2. en_progreso - Task in progress
 * 3. terminada - Task completed
 */
const taskSchema = new mongoose.Schema({
  /**
   * Task title
   * 
   * @type {String}
   * @required
   * @minlength 2
   * @maxlength 100
   * 
   * @description
   * Main identifier of the task. Required field with length constraints.
   * Automatically trimmed to remove leading/trailing whitespace.
   * 
   * @example
   * titulo: 'Implement user authentication'
   * titulo: 'Fix bug in payment module'
   */
  titulo: {
    type: String,
    required: [true, 'El título de la tarea es requerido'],
    trim: true,
    minlength: [2, 'El título debe tener al menos 2 caracteres'],
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  /**
   * Task description
   * 
   * @type {String}
   * @maxlength 500
   * @default ''
   * 
   * @description
   * Detailed description of the task. Optional field with maximum length.
   * Automatically trimmed and defaults to empty string if not provided.
   * 
   * @example
   * descripcion: 'Implement JWT-based authentication with refresh tokens'
   */
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    default: ''
  },
    /**
   * Kanban board state
   * 
   * @type {String}
   * @enum {string} ['pendiente', 'en_progreso', 'terminada']
   * @default 'pendiente'
   * 
   * @description
   * Current state of the task in the Kanban board. Three possible values:
   * - 'pendiente': Task created but not started
   * - 'en_progreso': Task currently being worked on
   * - 'terminada': Task completed
   * 
   * This field is automatically synchronized with the 'completada' boolean
   * field for backward compatibility.
   * 
   * @example
   * estado: 'pendiente'    // New task
   * estado: 'en_progreso'  // Working on it
   * estado: 'terminada'    // Done
   */
  estado: {
    type: String,
    enum: {
      values: ['pendiente', 'en_progreso', 'terminada'],
      message: 'El estado debe ser: pendiente, en_progreso o terminada'
    },
    default: 'pendiente'
  },
    /**
   * Completion status (legacy field)
   * 
   * @type {Boolean}
   * @default false
   * 
   * @description
   * Boolean completion flag maintained for backward compatibility with
   * previous versions of the application. This field is automatically
   * synchronized with the 'estado' field:
   * - true when estado === 'terminada'
   * - false when estado === 'pendiente' or 'en_progreso'
   * 
   * @deprecated Use 'estado' field for Kanban functionality
   * 
   * @example
   * completada: false  // Synced with estado !== 'terminada'
   * completada: true   // Synced with estado === 'terminada'
   */
  completada: {
    type: Boolean,
    default: false
  },
    /**
   * Task priority level
   * 
   * @type {String}
   * @enum {string} ['baja', 'media', 'alta']
   * @default 'media'
   * 
   * @description
   * Priority classification for the task. Three levels:
   * - 'baja': Low priority, can be done later
   * - 'media': Normal priority (default)
   * - 'alta': High priority, should be done soon
   * 
   * Used for filtering and sorting tasks by importance.
   * 
   * @example
   * prioridad: 'alta'   // Critical task
   * prioridad: 'media'  // Normal task
   * prioridad: 'baja'   // Nice to have
   */
  prioridad: {
    type: String,
    enum: {
      values: ['baja', 'media', 'alta'],
      message: 'La prioridad debe ser: baja, media o alta'
    },
    default: 'media'
  },
   /**
   * Due date for the task
   * 
   * @type {Date}
   * @optional
   * 
   * @description
   * Optional deadline for task completion. If provided, must be a future date.
   * Validation ensures the date is after the current time to prevent
   * creating tasks with past due dates.
   * 
   * @example
   * fechaVencimiento: new Date('2025-12-31')  // Valid future date
   * fechaVencimiento: null                     // No deadline
   */
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
  /**
   * Task owner reference
   * 
   * @type {mongoose.Schema.Types.ObjectId}
   * @ref User
   * @required
   * 
   * @description
   * Reference to the User who owns this task. Required field that establishes
   * the one-to-many relationship between users and tasks.
   * 
   * Used for:
   * - Task ownership and access control
   * - Filtering tasks by user
   * - Population in queries
   * 
   * @example
   * userId: mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
   */
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  }
}, {
  /**
   * Schema Options
   * 
   * @property {boolean} timestamps - Auto-generate createdAt and updatedAt
   * 
   * @description
   * Enables automatic timestamp management:
   * - createdAt: Set when document is first saved
   * - updatedAt: Updated on every save operation
   */
  timestamps: true // createdAt, updatedAt automáticos
});

/**
 * Compound index: userId + estado
 * 
 * @index
 * 
 * @description
 * Primary index for Kanban board queries. Optimizes queries that filter
 * tasks by user and state (most common operation in the app).
 * 
 * Used by:
 * - GET /tasks/board (get all tasks organized by state)
 * - GET /tasks?estado=pendiente (filter by state)
 * - State transition operations
 * 
 * @example Query
 * Task.find({ userId: '...', estado: 'pendiente' })
 */
taskSchema.index({ userId: 1, estado: 1 });
/**
 * Compound index: userId + completada
 * 
 * @index
 * 
 * @description
 * Legacy index maintained for backward compatibility. Supports queries
 * using the old boolean 'completada' field instead of 'estado'.
 * 
 * @deprecated Use userId + estado index for new queries
 * 
 * @example Query
 * Task.find({ userId: '...', completada: false })
 */
taskSchema.index({ userId: 1, completada: 1 }); 
/**
 * Compound index: userId + createdAt (descending)
 * 
 * @index
 * 
 * @description
 * Optimizes queries that fetch tasks sorted by creation date (newest first).
 * Common pattern for displaying recent tasks.
 * 
 * @example Query
 * Task.find({ userId: '...' }).sort({ createdAt: -1 })
 */
taskSchema.index({ userId: 1, createdAt: -1 });
/**
 * Compound index: userId + prioridad
 * 
 * @index
 * 
 * @description
 * Supports filtering and sorting tasks by priority level.
 * Used for priority-based task lists.
 * 
 * @example Query
 * Task.find({ userId: '...', prioridad: 'alta' })
 */
taskSchema.index({ userId: 1, prioridad: 1 });

/**
 * Virtual property: completadaVirtual (getter)
 * 
 * @virtual
 * @returns {boolean} true if estado === 'terminada', false otherwise
 * 
 * @description
 * Provides a computed boolean value based on the estado field.
 * Allows code to check completion status without directly using 'completada'.
 * 
 * @example
 * const isComplete = task.completadaVirtual;  // true if terminada
 */
taskSchema.virtual('completadaVirtual').get(function() {
  return this.estado === 'terminada';
});
/**
 * Virtual property: completadaVirtual (setter)
 * 
 * @virtual
 * @param {boolean} value - true to mark as completed, false for pending
 * 
 * @description
 * Allows setting estado through a boolean value. Converts:
 * - true → estado = 'terminada'
 * - false → estado = 'pendiente'
 * 
 * Note: Does not set to 'en_progreso', only toggles between pendiente/terminada.
 * 
 * @example
 * task.completadaVirtual = true;   // Sets estado to 'terminada'
 * task.completadaVirtual = false;  // Sets estado to 'pendiente'
 */
taskSchema.virtual('completadaVirtual').set(function(value) {
  this.estado = value ? 'terminada' : 'pendiente';
});

/**
 * Pre-save middleware: Synchronize estado and completada fields
 * 
 * @middleware
 * @hook pre-save
 * 
 * @description
 * Ensures estado and completada fields are always synchronized before saving.
 * This maintains backward compatibility while using the new Kanban system.
 * 
 * Synchronization rules:
 * 1. If 'estado' is modified → update 'completada' to match
 *    - estado === 'terminada' → completada = true
 *    - estado !== 'terminada' → completada = false
 * 
 * 2. If 'completada' is modified (and estado is not) → update 'estado'
 *    - completada = true → estado = 'terminada'
 *    - completada = false → estado = 'pendiente'
 * 
 * Priority: 'estado' changes take precedence over 'completada' changes.
 * 
 * @example
 * // Scenario 1: Update estado
 * task.estado = 'terminada';
 * await task.save();  // completada automatically set to true
 * 
 * @example
 * // Scenario 2: Update completada (legacy code)
 * task.completada = true;
 * await task.save();  // estado automatically set to 'terminada'
 */
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

/**
 * Convert task to JSON format
 * 
 * @instance
 * @method toJSON
 * @returns {Object} Task object ready for API response
 * 
 * @description
 * Transforms the Mongoose document to a clean JSON object suitable for
 * API responses. Includes all relevant fields with proper naming.
 * 
 * Transformations:
 * - _id → id
 * - Includes both 'estado' and 'completada' for compatibility
 * - Returns all task properties
 * - Includes timestamps
 * 
 * @example
 * const task = await Task.findById(id);
 * const json = task.toJSON();
 * // {
 * //   id: '507f1f77bcf86cd799439011',
 * //   titulo: 'Complete docs',
 * //   estado: 'en_progreso',
 * //   completada: false,
 * //   ...
 * // }
 */
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

/**
 * Get count of pending tasks
 * 
 * @static
 * @method getPendingTasksCount
 * @param {string|ObjectId} userId - User ID to count tasks for
 * @returns {Promise<number>} Number of pending tasks
 * 
 * @description
 * Returns the count of tasks in 'pendiente' state for a specific user.
 * Optimized query using the userId + estado index.
 * 
 * @example
 * const pendingCount = await Task.getPendingTasksCount(userId);
 * console.log(`You have ${pendingCount} pending tasks`);
 */
taskSchema.statics.getPendingTasksCount = function(userId) {
  return this.countDocuments({ userId, estado: 'pendiente' });
};
/**
 * Get count of in-progress tasks
 * 
 * @static
 * @method getInProgressTasksCount
 * @param {string|ObjectId} userId - User ID to count tasks for
 * @returns {Promise<number>} Number of in-progress tasks
 * 
 * @description
 * Returns the count of tasks in 'en_progreso' state for a specific user.
 * Useful for tracking active work.
 * 
 * @example
 * const activeCount = await Task.getInProgressTasksCount(userId);
 * console.log(`${activeCount} tasks currently in progress`);
 */
taskSchema.statics.getInProgressTasksCount = function(userId) {
  return this.countDocuments({ userId, estado: 'en_progreso' });
};
/**
 * Get count of completed tasks
 * 
 * @static
 * @method getCompletedTasksCount
 * @param {string|ObjectId} userId - User ID to count tasks for
 * @returns {Promise<number>} Number of completed tasks
 * 
 * @description
 * Returns the count of tasks in 'terminada' state for a specific user.
 * Useful for productivity statistics.
 * 
 * @example
 * const completedCount = await Task.getCompletedTasksCount(userId);
 * console.log(`You've completed ${completedCount} tasks!`);
 */
taskSchema.statics.getCompletedTasksCount = function(userId) {
  return this.countDocuments({ userId, estado: 'terminada' });
};

/**
 * Get complete board statistics
 * 
 * @static
 * @method getBoardStats
 * @param {string|ObjectId} userId - User ID to get statistics for
 * @returns {Promise<Object>} Statistics object with counts per state
 * @returns {number} return.pendiente - Count of pending tasks
 * @returns {number} return.en_progreso - Count of in-progress tasks
 * @returns {number} return.terminada - Count of completed tasks
 * @returns {number} return.total - Total count of all tasks
 * 
 * @description
 * Calculates comprehensive Kanban board statistics using MongoDB aggregation.
 * Returns counts for all three states plus total count in a single query.
 * 
 * Performance: Uses aggregation pipeline with $group for efficient counting.
 * Returns zeroes for states with no tasks.
 * 
 * @example
 * const stats = await Task.getBoardStats(userId);
 * console.log(stats);
 * // {
 * //   pendiente: 5,
 * //   en_progreso: 3,
 * //   terminada: 12,
 * //   total: 20
 * // }
 * 
 * @example
 * // Use in dashboard
 * const stats = await Task.getBoardStats(req.user.id);
 * res.json({
 *   message: 'Board statistics',
 *   data: stats
 * });
 */
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

/**
 * Move task to new Kanban state
 * 
 * @instance
 * @method moveToState
 * @param {('pendiente'|'en_progreso'|'terminada')} newState - Target state
 * @returns {Promise<TaskDocument>} Updated task document
 * @throws {Error} If newState is invalid
 * 
 * @description
 * Safely transitions a task to a new Kanban state with validation.
 * Automatically updates the 'completada' field for backward compatibility.
 * Saves the document to the database.
 * 
 * Valid state transitions:
 * - pendiente → en_progreso → terminada
 * - Can move to any state from any state (no restrictions)
 * 
 * @example
 * // Move task through workflow
 * await task.moveToState('en_progreso');
 * console.log(task.estado);      // 'en_progreso'
 * console.log(task.completada);  // false
 * 
 * await task.moveToState('terminada');
 * console.log(task.estado);      // 'terminada'
 * console.log(task.completada);  // true
 * 
 * @example
 * // Error handling
 * try {
 *   await task.moveToState('invalid_state');
 * } catch (error) {
 *   console.error(error.message);  // 'Estado inválido: invalid_state'
 * }
 */
taskSchema.methods.moveToState = function(newState) {
  const validStates = ['pendiente', 'en_progreso', 'terminada'];
  if (!validStates.includes(newState)) {
    throw new Error(`Estado inválido: ${newState}`);
  }
  
  this.estado = newState;
  this.completada = newState === 'terminada';
  return this.save();
};

/**
 * Get tasks organized by Kanban board columns
 * 
 * @static
 * @method getTasksByBoard
 * @param {string|ObjectId} userId - User ID to get tasks for
 * @returns {Promise<Object>} Object with tasks grouped by state
 * @returns {TaskDocument[]} return.pendiente - Array of pending tasks
 * @returns {TaskDocument[]} return.en_progreso - Array of in-progress tasks
 * @returns {TaskDocument[]} return.terminada - Array of completed tasks
 * 
 * @description
 * Fetches all tasks for a user and organizes them into Kanban board columns.
 * Tasks are sorted by creation date (newest first) within each column.
 * 
 * Returns a ready-to-use structure for Kanban board UI:
 * - Each state has its own array of tasks
 * - Empty arrays if no tasks in that state
 * - Tasks include all fields
 * 
 * @example
 * const board = await Task.getTasksByBoard(userId);
 * console.log(board);
 * // {
 * //   pendiente: [task1, task2, task3],
 * //   en_progreso: [task4, task5],
 * //   terminada: [task6, task7, task8, task9]
 * // }
 * 
 * @example
 * // Use in Kanban board endpoint
 * router.get('/board', authMiddleware, async (req, res) => {
 *   const board = await Task.getTasksByBoard(req.user.id);
 *   res.json({
 *     success: true,
 *     data: board
 *   });
 * });
 * 
 * @example
 * // Frontend can directly map columns
 * const columns = {
 *   'To Do': board.pendiente,
 *   'In Progress': board.en_progreso,
 *   'Done': board.terminada
 * };
 */
taskSchema.statics.getTasksByBoard = async function(userId) {
  const tasks = await this.find({ userId }).sort({ createdAt: -1 });
  
  return {
    pendiente: tasks.filter(task => task.estado === 'pendiente'),
    en_progreso: tasks.filter(task => task.estado === 'en_progreso'),
    terminada: tasks.filter(task => task.estado === 'terminada')
  };
};
/**
 * Task Model
 * 
 * @exports Task
 * @type {mongoose.Model<TaskDocument>}
 * 
 * @description
 * Exported Mongoose model for Task collection. Use this to:
 * - Create new tasks
 * - Query existing tasks
 * - Update task states
 * - Get board statistics
 * - Perform all CRUD operations
 * 
 * Collection name: 'tasks' (auto-pluralized by Mongoose)
 * 
 * @example
 * const Task = require('./models/Task');
 * 
 * // Create task
 * const task = new Task({ titulo: 'New task', userId: '...' });
 * await task.save();
 * 
 * // Query tasks
 * const tasks = await Task.find({ userId: '...' });
 * 
 * // Get statistics
 * const stats = await Task.getBoardStats(userId);
 */
module.exports = mongoose.model('Task', taskSchema);
