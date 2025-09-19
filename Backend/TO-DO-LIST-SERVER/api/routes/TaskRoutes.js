const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');
const { authenticateToken } = require('../middleware/authMiddleware');

<<<<<<< HEAD
// 🛡️ TODAS LAS RUTAS DE TAREAS ESTÁN PROTEGIDAS CON JWT

/**
 * @route   POST /api/v1/tasks
 * @desc    Crear nueva tarea - HTTP 201 con ID de nueva tarea
 * @access  Private (requiere JWT)
 */
router.post('/', authenticateToken, TaskController.create);

/**
 * @route   GET /api/v1/tasks
 * @desc    Obtener todas las tareas del usuario autenticado - respuesta ≤ 500ms
 * @query   ?completada=true|false&prioridad=baja|media|alta&limite=10
 * @access  Private (requiere JWT)
 */
router.get('/', authenticateToken, TaskController.getAll);

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Obtener tarea específica por ID (solo si pertenece al usuario)
 * @access  Private (requiere JWT)
 */
router.get('/:id', authenticateToken, TaskController.getById);

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Actualizar tarea por ID - editar tarea (solo si es del usuario)
 * @access  Private (requiere JWT)
 */
router.put('/:id', authenticateToken, TaskController.update);

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Eliminar tarea por ID (solo si es del usuario)
 * @access  Private (requiere JWT)
 */
router.delete('/:id', authenticateToken, TaskController.delete);

/**
 * @route   PATCH /api/v1/tasks/:id/toggle
 * @desc    Cambiar estado completada/pendiente de una tarea
 * @access  Private (requiere JWT)
 */
router.patch('/:id/toggle', authenticateToken, TaskController.toggleStatus);
=======
const taskController = new TaskController(); // ✅ Crear instancia

router.post('/', authenticateToken, (req, res) => taskController.create(req, res));
router.get('/', authenticateToken, (req, res) => taskController.getAll(req, res));
router.get('/:id', authenticateToken, (req, res) => taskController.getById(req, res));
router.put('/:id', authenticateToken, (req, res) => taskController.update(req, res));
router.delete('/:id', authenticateToken, (req, res) => taskController.delete(req, res));


>>>>>>> origin/Daniel_!

module.exports = router;