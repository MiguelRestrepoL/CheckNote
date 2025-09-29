const rateLimit = require('express-rate-limit');

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos de login. Intenta de nuevo en 10 minutos.',
    retryAfter: '10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    message: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.',
    retryAfter: '1 hora'
  }
});

// Rate limiting general
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  }
});

// Rate limiting para password reset
const passwordResetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 30 minutos
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de recuperación. Intenta de nuevo en 10 minutos.',
    retryAfter: '10 minutos'
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  passwordResetLimiter
};
