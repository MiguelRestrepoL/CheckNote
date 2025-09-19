const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

<<<<<<< HEAD
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login de usuario - HTTP 200 con JWT válido por 2h
 * @access  Public
 */
router.post('/login', AuthController.login);

/**
 * @route   POST /api/v1/auth/verify
 * @desc    Verificar token JWT válido
 * @access  Private
 */
router.post('/verify', AuthController.verifyToken);
=======
const authController = new AuthController(); // ✅ Crear instancia

router.post('/login', (req, res) => authController.login(req, res));
router.post('/verify', (req, res) => authController.verifyToken(req, res));
>>>>>>> origin/Daniel_!

module.exports = router;