const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');
const { authenticateToken } = require('../middleware/authMiddleware');

const taskController = new TaskController(); // ✅ Crear instancia

router.post('/', authenticateToken, (req, res) => taskController.create(req, res));
router.get('/', authenticateToken, (req, res) => taskController.getAll(req, res));
router.get('/:id', authenticateToken, (req, res) => taskController.getById(req, res));
router.put('/:id', authenticateToken, (req, res) => taskController.update(req, res));
router.delete('/:id', authenticateToken, (req, res) => taskController.delete(req, res));



module.exports = router;