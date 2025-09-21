const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
  registerLimiter, 
  apiLimiter 
} = require('../middleware/rateLimitMiddleware');

const router = express.Router();
const userController = new UserController();

// REGISTRO DE USUARIO
router.post('/Registro', 
  registerLimiter,
  userController.create.bind(userController)
);

// RUTAS PROTEGIDAS
router.get('/me', 
  apiLimiter,
  authenticateToken, 
  userController.getProfile.bind(userController)
);

router.put('/me', 
  apiLimiter,
  authenticateToken, 
  userController.updateProfile.bind(userController)
);

router.delete('/me', 
  apiLimiter,
  authenticateToken, 
  userController.deleteProfile.bind(userController)
);

module.exports = router;