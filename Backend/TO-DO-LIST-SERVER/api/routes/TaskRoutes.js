// api/routes/TaskRoutes.js - VERSIÓN MEJORADA FASE 5
const express = require('express');
const TaskController = require('../controllers/TaskController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();
const taskController = new TaskController();

// 🔒 TODAS LAS RUTAS PROTEGIDAS CON JWT Y RATE LIMITING

// CREAR TAREA
router.post('/', 
  apiLimiter,
  authenticateToken, 
  taskController.create.bind(taskController)
);

// OBTENER TODAS MIS TAREAS (con filtros y paginación)
router.get('/', 
  apiLimiter,
  authenticateToken, 
  taskController.getAll.bind(taskController)
);

// OBTENER TAREA ESPECÍFICA POR ID
router.get('/:id', 
  apiLimiter,
  authenticateToken, 
  taskController.getById.bind(taskController)
);

// ACTUALIZAR TAREA
router.put('/:id', 
  apiLimiter,
  authenticateToken, 
  taskController.update.bind(taskController)
);

// ELIMINAR TAREA
router.delete('/:id', 
  apiLimiter,
  authenticateToken, 
  taskController.delete.bind(taskController)
);

module.exports = router;