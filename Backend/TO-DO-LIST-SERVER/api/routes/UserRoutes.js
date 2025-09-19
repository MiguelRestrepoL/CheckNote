const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const {authenticateToken} = require('../middleware/authMiddleware'); // ✅ Ruta correcta

const userController = new UserController(); // ✅ Una sola instancia

// RUTAS PÚBLICAS
router.post("/Registro", (req, res) => userController.create(req, res));

// RUTAS PROTEGIDAS - PERFIL
router.get('/me', authenticateToken, (req, res) => userController.getProfile(req, res));
router.put('/me', authenticateToken, (req, res) => userController.updateProfile(req, res));
router.delete('/me', authenticateToken, (req, res) => userController.deleteProfile(req, res));

// RUTAS PROTEGIDAS - ADMIN
router.get('/:id', authenticateToken, (req, res) => userController.read(req, res));
router.get('/', authenticateToken, (req, res) => userController.getAll(req, res));

module.exports = router;
