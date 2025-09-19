const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

const authController = new AuthController(); // ✅ Crear instancia

router.post('/login', (req, res) => authController.login(req, res));
router.post('/verify', (req, res) => authController.verifyToken(req, res));

module.exports = router;