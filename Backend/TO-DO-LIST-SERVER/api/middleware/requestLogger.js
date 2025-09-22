// api/middleware/requestLogger.js

const logger = require('../utils/logger');

/**
 * Middleware para calcular tiempo de respuesta
 */
const responseTime = (req, res, next) => {
  const startTime = Date.now();
  
  // Interceptar el final de la respuesta
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    res.locals.responseTime = duration;
    
    // Restaurar método original y llamarlo con validación de argumentos
    res.end = originalEnd;
    
    // Verificar si chunk existe antes de pasarlo
    if (arguments.length === 0) {
      res.end.call(this);
    } else if (arguments.length === 1) {
      res.end.call(this, chunk);
    } else {
      res.end.call(this, chunk, encoding);
    }
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
  res.end = function(chunk, encoding) {
    try {
      // Log de la request con información completa
      const meta = {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime: res.locals.responseTime ? `${res.locals.responseTime}ms` : null,
        userAgent: req.get('User-Agent') || 'Unknown',
        ip: req.ip || req.connection?.remoteAddress || 'Unknown',
        userId: req.user ? (req.user._id ? req.user._id.toString() : 'authenticated') : 'anonymous',
        contentLength: res.get('content-length') || null,
        referer: req.get('Referer') || null,
        origin: req.get('Origin') || null
      };
      
      // Agregar preview del body de respuesta si existe
      if (chunk) {
        try {
          let bodyPreview = '';
          if (typeof chunk === 'string') {
            bodyPreview = chunk.substring(0, 100);
          } else if (Buffer.isBuffer(chunk)) {
            bodyPreview = chunk.toString('utf8', 0, 100);
          } else if (chunk && typeof chunk.toString === 'function') {
            bodyPreview = chunk.toString().substring(0, 100);
          }
          
          if (bodyPreview) {
            meta.bodyPreview = bodyPreview.replace(/\n/g, ' ').trim();
          }
        } catch (bodyError) {
          meta.bodyPreview = '[Error reading response body]';
        }
      }
      
      // Determinar nivel de log según status code
      if (res.statusCode >= 500) {
        logger.error(`${req.method} ${req.originalUrl || req.url} - ${res.statusCode}`, meta);
      } else if (res.statusCode >= 400) {
        logger.warn(`${req.method} ${req.originalUrl || req.url} - ${res.statusCode}`, meta);
      } else {
        logger.info(`${req.method} ${req.originalUrl || req.url} - ${res.statusCode}`, meta);
      }
    } catch (logError) {
      // Si hay error en el logging, log el error pero no crashear
      console.error('Error in requestLogger:', logError.message);
      logger.error('RequestLogger Error', {
        error: logError.message,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode
      });
    }
    
    // Restaurar método original y llamarlo
    res.end = originalEnd;
    
    // Llamar el método original con validación de argumentos
    if (arguments.length === 0) {
      res.end.call(this);
    } else if (arguments.length === 1) {
      res.end.call(this, chunk);
    } else {
      res.end.call(this, chunk, encoding);
    }
  };
  
  next();
};

/**
 * Middleware para logging de request body (solo en desarrollo)
 */
const requestBodyLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
    try {
      const sanitizedBody = { ...req.body };
      
      // Remover campos sensibles del log
      const sensitiveFields = ['contrasena', 'password', 'confirmarContrasena', 'currentPassword', 'newPassword'];
      sensitiveFields.forEach(field => {
        if (sanitizedBody[field]) {
          sanitizedBody[field] = '[HIDDEN]';
        }
      });
      
      logger.debug(`Request Body for ${req.method} ${req.originalUrl || req.url}`, {
        body: sanitizedBody,
        userId: req.user ? (req.user._id ? req.user._id.toString() : 'authenticated') : 'anonymous'
      });
    } catch (bodyLogError) {
      logger.error('Error logging request body:', bodyLogError.message);
    }
  }
  
  next();
};

/**
 * Middleware para detectar requests lentos
 */
const slowRequestDetector = (threshold = 1000) => {
  return (req, res, next) => {
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      try {
        const responseTime = res.locals.responseTime || 0;
        
        if (responseTime > threshold) {
          logger.warn(`Slow request detected: ${req.method} ${req.originalUrl || req.url}`, {
            responseTime: `${responseTime}ms`,
            threshold: `${threshold}ms`,
            userId: req.user ? (req.user._id ? req.user._id.toString() : 'authenticated') : 'anonymous',
            userAgent: req.get('User-Agent') || 'Unknown'
          });
        }
      } catch (slowLogError) {
        logger.error('Error in slowRequestDetector:', slowLogError.message);
      }
      
      // Restaurar método original y llamarlo
      res.end = originalEnd;
      
      // Llamar el método original con validación de argumentos
      if (arguments.length === 0) {
        res.end.call(this);
      } else if (arguments.length === 1) {
        res.end.call(this, chunk);
      } else {
        res.end.call(this, chunk, encoding);
      }
    };
    
    next();
  };
};

/**
 * Middleware para agregar headers de seguridad básicos
 */
const securityHeaders = (req, res, next) => {
  try {
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
  } catch (headerError) {
    logger.error('Error setting security headers:', headerError.message);
  }
  
  next();
};

/**
 * Middleware para agregar request ID único
 */
const requestId = (req, res, next) => {
  try {
    const id = generateRequestId();
    req.requestId = id;
    res.setHeader('X-Request-ID', id);
    
    // Agregar request ID al contexto de logging
    if (logger.logError && typeof logger.logError === 'function') {
      const originalLogError = logger.logError;
      logger.logError = (error, request) => {
        const meta = {
          requestId: id,
          error: {
            name: error?.name || 'Unknown',
            message: error?.message || 'No message',
            stack: error?.stack || 'No stack trace',
            code: error?.code || null,
            statusCode: error?.statusCode || null
          }
        };
        
        if (request) {
          meta.request = {
            method: request.method,
            url: request.url,
            userAgent: request.get('User-Agent') || 'Unknown',
            ip: request.ip || request.connection?.remoteAddress || 'Unknown',
            userId: request.user ? (request.user._id ? request.user._id.toString() : 'authenticated') : 'anonymous'
          };
        }
        
        logger.error(`Request ${id} - Error: ${error?.message || 'Unknown error'}`, meta);
      };
    }
  } catch (requestIdError) {
    logger.error('Error in requestId middleware:', requestIdError.message);
  }
  
  next();
};

/**
 * Generar ID único para request
 */
function generateRequestId() {
  try {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  } catch (generateError) {
    // Fallback si hay error generando ID
    return `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
}

module.exports = {
  responseTime,
  requestLogger,
  requestBodyLogger,
  slowRequestDetector,
  securityHeaders,
  requestId
};