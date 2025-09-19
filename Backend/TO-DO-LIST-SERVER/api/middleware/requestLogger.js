// api/middleware/requestLogger.js

const logger = require('../utils/logger');

/**
 * Middleware para calcular tiempo de respuesta
 */
const responseTime = (req, res, next) => {
  const startTime = Date.now();
  
  // Interceptar el final de la respuesta
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    res.locals.responseTime = duration;
    
    // Restaurar método original y llamarlo
    res.end = originalEnd;
    res.end.apply(this, args);
  };
  
  next();
};

/**
 * Middleware para logging de requests
 */
const requestLogger = (req, res, next) => {
  // Interceptar el final de la respuesta para hacer el log
  if (req.url === '/favicon.ico' || req.url.startsWith('/static/')) {
    return next();
  }
  const originalEnd = res.end;
  res.end = function(...args) {
    // Log de la request con información completa
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: res.locals.responseTime ? `${res.locals.responseTime}ms` : null,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user ? req.user._id.toString() : 'anonymous',
      contentLength: res.get('content-length') || null,
      referer: req.get('Referer') || null
    };
    
    // Determinar nivel de log según status code
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} - ${res.statusCode}`, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} - ${res.statusCode}`, meta);
    } else {
      logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode}`, meta);
    }
    
    // Restaurar método original y llamarlo
    res.end = originalEnd;
    res.end.apply(this, args);
  };
  
  next();
};

/**
 * Middleware para logging de request body (solo en desarrollo)
 */
const requestBodyLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    
    // Remover campos sensibles del log
    const sensitiveFields = ['contrasena', 'password', 'confirmarContrasena', 'currentPassword', 'newPassword'];
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[HIDDEN]';
      }
    });
    
    logger.debug(`Request Body for ${req.method} ${req.originalUrl}`, {
      body: sanitizedBody,
      userId: req.user ? req.user._id.toString() : 'anonymous'
    });
  }
  
  next();
};

/**
 * Middleware para detectar requests lentos
 */
const slowRequestDetector = (threshold = 1000) => {
  return (req, res, next) => {
    const originalEnd = res.end;
    res.end = function(...args) {
      const responseTime = res.locals.responseTime || 0;
      
      if (responseTime > threshold) {
        logger.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, {
          responseTime: `${responseTime}ms`,
          threshold: `${threshold}ms`,
          userId: req.user ? req.user._id.toString() : 'anonymous',
          userAgent: req.get('User-Agent')
        });
      }
      
      // Restaurar método original y llamarlo
      res.end = originalEnd;
      res.end.apply(this, args);
    };
    
    next();
  };
};

/**
 * Middleware para agregar headers de seguridad básicos
 */
const securityHeaders = (req, res, next) => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Habilitar protección XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Remover header X-Powered-By
  res.removeHeader('X-Powered-By');
  
  // Content Security Policy básico
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
};

/**
 * Middleware para agregar request ID único
 */
const requestId = (req, res, next) => {
  const id = generateRequestId();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  
  // Agregar request ID al contexto de logging
  const originalLogError = logger.logError;
  logger.logError = (error, request) => {
    const meta = {
      requestId: id,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      }
    };
    
    if (request) {
      meta.request = {
        method: request.method,
        url: request.url,
        userAgent: request.get('User-Agent'),
        ip: request.ip || request.connection.remoteAddress,
        userId: request.user ? request.user._id : 'anonymous'
      };
    }
    
    logger.error(`Request ${id} - Error: ${error.message}`, meta);
  };
  
  next();
};

/**
 * Generar ID único para request
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = {
  responseTime,
  requestLogger,
  requestBodyLogger,
  slowRequestDetector,
  securityHeaders,
  requestId
};