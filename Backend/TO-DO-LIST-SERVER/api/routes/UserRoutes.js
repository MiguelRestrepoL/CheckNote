const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const {authenticateToken} = require('../middlewares/authMiddleware');

const UserController = new UserController();

router.get("/", (req, res) => UserController.getAll(req, res));
router.get("/:id", (req, res) => UserController.read(req, res));
router.post("/", (req, res) => UserController.create(req, res));
router.put("/:id", (req, res) => UserController.update(req, res));
router.delete("/:id", (req, res) => UserController.delete(req, res));
router.post('/', userController.create.bind(userController));


/**
 * GET /api/v1/users/me
 * Obtener perfil del usuario autenticado
 * Requiere: Token JWT válido
 * Respuesta: 200 con datos del usuario y estadísticas
 */
router.get('/me', authenticateToken, userController.getProfile.bind(userController));

/**
 * PUT /api/v1/users/me  
 * Actualizar perfil del usuario autenticado
 * Requiere: Token JWT válido
 * Body: { nombres?, apellidos?, edad?, correo?, contrasenaActual?, nuevaContrasena?, confirmarNuevaContrasena? }
 * Respuesta: 200 con usuario actualizado
 */
router.put('/me', authenticateToken, userController.updateProfile.bind(userController));

/**
 * DELETE /api/v1/users/me
 * Eliminar cuenta del usuario autenticado  
 * Requiere: Token JWT válido
 * Body: { contrasena: string, confirmacion: "ELIMINAR" }
 * Respuesta: 200 con confirmación de eliminación
 */
router.delete('/me', authenticateToken, userController.deleteProfile.bind(userController));

//  RUTAS ADICIONALES PROTEGIDAS

/**
 * GET /api/v1/users/:id
 * Obtener usuario específico por ID
 * Requiere: Token JWT válido (solo puede ver su propio perfil)
 * Respuesta: 200 con datos del usuario o 403 si no es el mismo usuario
 */
router.get('/:id', authenticateToken, userController.read.bind(userController));

/**
 * GET /api/v1/users
 * Listar todos los usuarios (restringido para admins)
 * Requiere: Token JWT válido + rol admin (futuro)
 * Respuesta: 403 por ahora (funcionalidad restringida)
 */
router.get('/', authenticateToken, userController.getAll.bind(userController));

module.exports = router;





