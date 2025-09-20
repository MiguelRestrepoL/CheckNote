const express = require('express');
const AuthController = require('../controllers/AuthController');
const { 
  loginLimiter, 
  apiLimiter, 
  passwordResetLimiter
} = require('../middleware/rateLimitMiddleware');

const router = express.Router();
const authController = new AuthController();

// LOGIN
router.post('/login', 
  loginLimiter,
  authController.login.bind(authController)
);

// VERIFICAR TOKEN
router.post('/verify', 
  apiLimiter,
  authController.verifyToken.bind(authController)
);

// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
router.post('/request-password-reset', 
  passwordResetLimiter,
  authController.requestPasswordReset.bind(authController)
);

// RESTABLECER CONTRASEÑA
router.post('/reset-password', 
  passwordResetLimiter,
  authController.resetPassword.bind(authController)
);

// RUTAS DE DESARROLLO
if (process.env.NODE_ENV === 'development') {
  router.get('/security-stats', 
    apiLimiter,
    authController.getSecurityStats.bind(authController)
  );

  router.post('/cleanup-security', 
    apiLimiter,
    authController.cleanupSecurityData.bind(authController)
  );
}

module.exports = router;