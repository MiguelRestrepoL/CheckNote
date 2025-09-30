

# 📋 **COMPLETE PROJECT CONTEXT - TO-DO-LIST-SERVER with JSDoc Documentation** ## 🎯 **PROJECT STATUS - Updated September 2025** **Completed Phases:** - ✅ **PHASE 1** - BASE AUTHENTICATION (JWT + bcrypt) - ✅ **PHASE 2** - TASK MANAGEMENT (CRUD + Kanban board) - ✅ **PHASE 3** - USER PROFILE

pasted

¡Perfecto! Veo que el proyecto está muy bien organizado y ya tienes 6 archivos documentados (30% completado). Continuemos con la documentación de los servicios según tu plan.

📋 Siguiente Paso: Documentar AccountSecurityService.js
Para continuar con la documentación JSDoc en inglés, necesito que me envíes el archivo:

api/services/AccountSecurityService.js
Una vez que me lo envíes, lo documentaré siguiendo el mismo patrón establecido en los archivos ya completados:

✅ Estándar de Documentación Aplicado
javascript
/**
 * @file AccountSecurityService.js
 * @description Account security management with blocking, rate limiting, and threat detection
 * @module services/AccountSecurityService
 * @requires mongoose
 * @requires ../models/User
 * @requires ../utils/logger
 */

/**
 * Service class for managing account security features
 * @class
 */
class AccountSecurityService {
  /**
   * Checks if account is blocked due to failed login attempts
   * @async
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Security status
   * @property {boolean} isBlocked - Whether account is blocked
   * @property {Date|null} blockedUntil - Block expiration time
   * @throws {Error} If database operation fails
   */
  async checkAccountStatus(userId) {
    // ...
  }
}
📦 Lo que incluiré:
✅ File header con descripción completa
✅ Class-level documentation
✅ Detailed method documentation con:
@async para métodos asíncronos
@param con tipos y descripciones
@returns con estructura detallada
@throws para excepciones
@property para objetos de retorno complejos
✅ Inline comments para lógica compleja
✅ Consistency con los 6 archivos ya documentados
🎯 Orden de Prioridad Confirmado
Priority 1 - Services (Next 3 files):

📄 AccountSecurityService.js ← ENVÍAME ESTE AHORA
PasswordResetService.js
EmailService.js
Priority 2 - Middleware: errorHandler.js, requestLogger.js, rateLimitMiddleware.js

Priority 3 - Models: User.js, Task.js

Priority 4 - Routes/Utils: Archivos de rutas + CustomErrors.js

¿Listo para continuar? 🚀
Por favor envíame el contenido de AccountSecurityService.js y procederé con la documentación JSDoc completa en inglés.



// services/EmailService.js - IMPLEMENTACIÓN CON RESEND const { Resend } = require('resend'); const fs = require('fs').promises; const path = require('path'); class EmailService { constructor() { this.resend = null; this.isConfigured = false; this.templateCache = new Map(); } //

pasted

de services ya solo me falta EmailService.js para completar esa seccion de prioridad 1, entonces te voy  a pasar

EmailService.js

¡Perfecto! Ya recibí el archivo EmailService.js. Procederé a documentarlo completamente con JSDoc en inglés, siguiendo el mismo patrón de alta calidad establecido en los 6 archivos anteriores.

EmailService.js - JSDoc Documented
Código 
Continuar

EmailService.js - JSDoc Documented
Código ∙ Versión 2 
✅ EmailService.js - Documentación Completada
He finalizado la documentación completa del archivo EmailService.js con JSDoc en inglés.

📊 Resumen de la Documentación
Componentes Documentados:
Componente	Tipo	Descripción
EmailService	Class	Main service class with full documentation
constructor()	Constructor	Initializes service properties
initialize()	Async Method	Resend API setup and verification
verifyConfiguration()	Async Method	API key validation
loadTemplate()	Async Method	Template loading with caching
getDefaultTemplate()	Method	Built-in HTML templates
replaceVariables()	Method	Variable interpolation
sendEmail()	Async Method	Core email sending functionality
extractDomain()	Method	Domain extraction utility
htmlToText()	Method	HTML to text conversion
sendPasswordResetEmail()	Async Method	Password recovery emails
sendPasswordChangedConfirmation()	Async Method	Change confirmation emails
sendAccountBlockedEmail()	Async Method	Security alert emails
sendTestEmail()	Async Method	Configuration testing
getStats()	Method	Service statistics
emailService	Singleton	Exported instance
Total: 16 elementos documentados con ~730 líneas

🎯 Características de la Documentación:
✅ File-level header con descripción completa del módulo
✅ Class documentation con propósito y ejemplos
✅ Constructor documentation con propiedades privadas
✅ Method documentation con:

@async para métodos asíncronos
@param con tipos detallados
@returns con estructura de objetos
@throws para excepciones
@description con detalles de implementación
@example para uso práctico
@property para objetos complejos
✅ Singleton pattern documentation
✅ Template descriptions (3 email templates)
✅ Environment variables referenced
✅ Error handling documented
✅ Development mode behavior explained

📈 PROGRESO ACTUALIZADO DEL PROYECTO
PRIORITY 1 - SERVICES (3 archivos)
✅ EmailService.js          → COMPLETADO 📝
❌ AccountSecurityService.js → PENDIENTE
❌ PasswordResetService.js   → PENDIENTE

Progreso Services: 33% (1/3)
Documentación Total del Proyecto:
Archivos Documentados:     7/20 (35%)
Líneas Documentadas:       ~3,040 líneas

COMPLETADOS:
✅ UserController.js        (~440 líneas)
✅ TaskController.js        (~620 líneas)
✅ AuthController.js        (~480 líneas)
✅ UserDAO.js              (~230 líneas)
✅ TaskDAO.js              (~450 líneas)
✅ authMiddleware.js       (~90 líneas)
✅ EmailService.js         (~730 líneas) ⭐ NUEVO
🚀 SIGUIENTE PASO
Para continuar con la Priority 1 (Services), necesito los siguientes archivos:

1️⃣ AccountSecurityService.js ← PRÓXIMO
Account blocking logic
Failed login tracking
Security event logging
Rate limiting enforcement
2️⃣ PasswordResetService.js
Token generation
Token validation
Reset flow management
¿Listo para continuar? 🎯
Por favor envíame el contenido de AccountSecurityService.js para proceder con su documentación JSDoc completa en inglés.



// api/middleware/errorHandler.js const logger = require('../utils/logger'); const { AppError } = require('../errors/CustomErrors'); /** * Convertir errores de Mongoose a errores personalizados */ const handleMongooseError = (error) => { // Error de validación de Mongoose if (error.name ===

pasted

vamos a documentar middleware

vamos a comenzar por ErrorHandler.js

¡Perfecto! Vamos a documentar errorHandler.js del middleware. Este es un archivo crítico para el manejo de errores en toda la aplicación.

errorHandler.js - JSDoc Documented
Código 
✅ errorHandler.js - Documentación Completada
He finalizado la documentación completa del archivo errorHandler.js con JSDoc en inglés de alta calidad.

📊 Resumen de la Documentación
Componentes Documentados:
Componente	Tipo	Descripción
Module Header	File Doc	Complete file description with error types
handleMongooseError()	Function	Mongoose error conversion (3 error types)
handleJWTError()	Function	JWT error conversion (2 error types)
sendErrorDev()	Function	Development error response formatter
sendErrorProd()	Function	Production error response formatter
globalErrorHandler()	Middleware	Main error handling middleware
notFoundHandler()	Middleware	404 route handler
catchAsync()	HOF	Async error wrapper utility
handleUnhandledRejection()	Function	Process-level promise rejection handler
handleUncaughtException()	Function	Process-level exception handler
Module Exports	Documentation	Usage examples for all exports
Total: 11 elementos documentados con ~350 líneas de documentación

🎯 Características Destacadas de la Documentación:
✅ Error Type Matrix - Tabla completa de errores manejados
✅ Environment-Specific Behavior - Dev vs Prod explicado
✅ Mongoose Error Handling - 3 tipos documentados
✅ JWT Error Handling - 2 tipos documentados
✅ Process-Level Handlers - Unhandled rejections & exceptions
✅ catchAsync Pattern - Con ejemplos before/after
✅ Security Considerations - Operational vs Programming errors
✅ Integration Examples - Setup completo en index.js
✅ Best Practices - Recomendaciones de uso
✅ Error Flow Diagrams - Paso a paso del procesamiento

📈 PROGRESO ACTUALIZADO DEL PROYECTO
PRIORITY 2 - MIDDLEWARE (6 archivos)
✅ errorHandler.js           → COMPLETADO 📝
❌ requestLogger.js          → PENDIENTE
❌ rateLimitMiddleware.js    → PENDIENTE

PRIORITY 1 - SERVICES (3 archivos)
✅ EmailService.js           → COMPLETADO 📝
❌ AccountSecurityService.js → PENDIENTE
❌ PasswordResetService.js   → PENDIENTE

Progreso Middleware: 17% (1/6)
Progreso Services: 33% (1/3)
Documentación Total del Proyecto:
Archivos Documentados:     8/20 (40%)
Líneas Documentadas:       ~3,390 líneas

COMPLETADOS:
✅ UserController.js        (~440 líneas)
✅ TaskController.js        (~620 líneas)
✅ AuthController.js        (~480 líneas)
✅ UserDAO.js              (~230 líneas)
✅ TaskDAO.js              (~450 líneas)
✅ authMiddleware.js       (~90 líneas)
✅ EmailService.js         (~730 líneas)
✅ errorHandler.js         (~350 líneas) ⭐ NUEVO
🚀 SIGUIENTE PASO
Para continuar con los middleware, necesito:

Opción A: Continuar con Middleware
requestLogger.js - Request logging, response time, slow request detection
rateLimitMiddleware.js - Rate limiting implementation
Opción B: Completar Services primero
AccountSecurityService.js - Account blocking, security tracking
PasswordResetService.js - Token management, password reset
¿Cuál prefieres documentar ahora? 🎯

📝 requestLogger.js (continuar middleware)
🔒 AccountSecurityService.js (completar services)
🔑 PasswordResetService.js (completar services)
Envíame el archivo que quieras documentar a continuación. ¡Vamos muy bien con el 40% completado! 🚀


los de SERVICES ya dalos por completados por que ya los documente ( AccountSecurityService.js y PasswordResetService.js) ya los hice

¡Excelente! 🎉 Entonces ya tienes SERVICES 100% completados. Actualicemos el progreso:

📊 PROGRESO ACTUALIZADO - SERVICES COMPLETADOS
✅ PRIORITY 1 - SERVICES (3/3) - 100% COMPLETADO
✅ EmailService.js           → COMPLETADO 📝
✅ AccountSecurityService.js → COMPLETADO 📝 (por ti)
✅ PasswordResetService.js   → COMPLETADO 📝 (por ti)

🔄 PRIORITY 2 - MIDDLEWARE (1/6) - 17%
✅ errorHandler.js           → COMPLETADO 📝
❌ requestLogger.js          → PENDIENTE
❌ rateLimitMiddleware.js    → PENDIENTE
Documentación Total del Proyecto:
Archivos Documentados:     10/20 (50%) 🎉 ¡MITAD DEL CAMINO!
Líneas Documentadas:       ~4,500+ líneas

COMPLETADOS:
Priority 1 (Controllers/DAOs): 6 archivos ✅
  ✅ UserController.js
  ✅ TaskController.js
  ✅ AuthController.js
  ✅ UserDAO.js
  ✅ TaskDAO.js
  ✅ authMiddleware.js

Priority 1 (Services): 3 archivos ✅ 100%
  ✅ EmailService.js
  ✅ AccountSecurityService.js
  ✅ PasswordResetService.js

Priority 2 (Middleware): 1 archivo ✅
  ✅ errorHandler.js
🚀 SIGUIENTE PASO: COMPLETAR MIDDLEWARE
Para completar la sección de Priority 2 (Middleware), necesito documentar:

📋 Archivos Pendientes de Middleware:
requestLogger.js ← PRÓXIMO
Request logging
Response time tracking
Slow request detection
HTTP method/status tracking
rateLimitMiddleware.js
Rate limiting implementation
Request tracking per IP/user
Block logic after limits
¿Listo para continuar? 🎯

Por favor envíame el contenido de requestLogger.js para proceder con su documentación JSDoc completa en inglés.

Después de estos 2 archivos de middleware, nos quedarían:

Priority 3: Models (User.js, Task.js)
Priority 4: Routes y CustomErrors
¡Vamos excelente! Ya llevamos el 50% del proyecto documentado. 🚀



// api/middleware/requestLogger.js const logger = require('../utils/logger'); /** * Middleware para calcular tiempo de respuesta */ const responseTime = (req, res, next) => { const startTime = Date.now(); // Interceptar el final de la respuesta const originalEnd = res.end; res.end = f

pasted

requestLogger.js

requestLogger.js - JSDoc Documented
Código 
✅ requestLogger.js - Documentación Completada
He finalizado la documentación completa del archivo requestLogger.js con JSDoc en inglés de alta calidad.

📊 Resumen de la Documentación
Componentes Documentados:
Componente	Tipo	Descripción
Module Header	File Doc	Complete middleware suite overview
responseTime()	Middleware	Response time calculation and tracking
requestLogger()	Middleware	Main request/response logger with metadata
requestBodyLogger()	Middleware	Request body logger (dev only) with sanitization
slowRequestDetector()	Middleware Factory	Configurable slow request detection
securityHeaders()	Middleware	Security headers injection (5 headers)
requestId()	Middleware	Unique request ID generation and tracking
generateRequestId()	Private Function	Request ID generator with fallback
Module Exports	Documentation	Complete setup examples
Total: 9 elementos documentados con ~420 líneas de documentación

🎯 Características Destacadas de la Documentación:
✅ 6 Middleware Functions completamente documentados
✅ Security Headers - Explicación de cada header (X-Frame-Options, CSP, etc.)
✅ Middleware Chain Order - Ejemplos del orden correcto
✅ Sensitive Data Sanitization - Lista de campos protegidos
✅ Log Level Auto-Selection - Basado en HTTP status codes
✅ Performance Monitoring - Slow request detection
✅ Request Tracing - Unique ID system
✅ Error Handling - Graceful degradation en todos los middleware
✅ Development vs Production - Comportamiento diferenciado
✅ Complete Setup Examples - Configuración completa de la app

📈 PROGRESO ACTUALIZADO DEL PROYECTO
✅ PRIORITY 1 - SERVICES (3/3) - 100% COMPLETADO
✅ EmailService.js
✅ AccountSecurityService.js
✅ PasswordResetService.js

🔄 PRIORITY 2 - MIDDLEWARE (2/6) - 33%
✅ errorHandler.js           → COMPLETADO 📝
✅ requestLogger.js          → COMPLETADO 📝 ⭐ NUEVO
❌ rateLimitMiddleware.js    → PENDIENTE (último de middleware)
Documentación Total del Proyecto:
Archivos Documentados:     11/20 (55%)
Líneas Documentadas:       ~4,810 líneas

COMPLETADOS:
Priority 1 (Core - 9 archivos): 100% ✅
  ✅ UserController.js
  ✅ TaskController.js
  ✅ AuthController.js
  ✅ UserDAO.js
  ✅ TaskDAO.js
  ✅ authMiddleware.js
  ✅ EmailService.js
  ✅ AccountSecurityService.js
  ✅ PasswordResetService.js

Priority 2 (Middleware - 2/6): 33%
  ✅ errorHandler.js
  ✅ requestLogger.js
  ❌ rateLimitMiddleware.js → PRÓXIMO
🚀 SIGUIENTE PASO: ÚLTIMO MIDDLEWARE
Para completar la sección de Middleware, solo falta:

📋 rateLimitMiddleware.js ← PRÓXIMO Y ÚLTIMO DE MIDDLEWARE
Rate limiting implementation
Request tracking per IP/user
Block logic after limit exceeded
Memory-based rate limiting
Después de este archivo, pasaremos a:

Priority 3: Models (User.js, Task.js)
Priority 4: Routes y CustomErrors
¿Listo para el último middleware?

Por favor envíame el contenido de rateLimitMiddleware.js para completar la sección de middleware (llegaremos al 100% de middleware documentado).

¡Ya llevamos el 55% del proyecto total! 🚀






/**
 * @file requestLogger.js
 * @description HTTP request logging and monitoring middleware for Express
 * @module middleware/requestLogger
 * @requires ../utils/logger
 * 
 * @description
 * Provides comprehensive request tracking and monitoring including:
 * - Response time calculation and tracking
 * - Request/response logging with metadata
 * - Request body logging (development only)
 * - Slow request detection and alerting
 * - Security headers injection
 * - Unique request ID generation
 * 
 * Features:
 * - Auto-detection of log level based on HTTP status
 * - Sensitive data sanitization in logs
 * - Response body preview (first 100 chars)
 * - User tracking (authenticated vs anonymous)
 * - IP address and User-Agent logging
 * - Static resource filtering
 * 
 * @example
 * // Setup in index.js
 * const {
 *   responseTime,
 *   requestLogger,
 *   slowRequestDetector,
 *   securityHeaders,
 *   requestId
 * } = require('./middleware/requestLogger');
 * 
 * app.use(requestId);
 * app.use(responseTime);
 * app.use(securityHeaders);
 * app.use(requestLogger);
 * app.use(slowRequestDetector(1000)); // 1 second threshold
 */

const logger = require('../utils/logger');

/**
 * Middleware to calculate response time for each request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @description
 * Intercepts the response end event to calculate request duration:
 * - Records start time when request enters middleware
 * - Calculates duration when response is sent
 * - Stores duration in res.locals.responseTime for other middleware
 * - Preserves original res.end() functionality
 * 
 * **Implementation Details:**
 * - Uses Date.now() for millisecond precision
 * - Wraps res.end() to intercept completion
 * - Handles all res.end() call signatures (0-2 arguments)
 * - Restores original method after execution
 * 
 * **Usage Chain:**
 * Should be placed early in middleware chain before other loggers
 * that depend on response time data
 * 
 * @example
 * app.use(responseTime);
 * app.use(requestLogger); // Can access res.locals.responseTime
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
 * Main request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @description
 * Comprehensive request/response logging with automatic log level selection:
 * 
 * **Logged Metadata:**
 * - HTTP method and URL
 * - Response status code
 * - Response time (from responseTime middleware)
 * - User-Agent string
 * - Client IP address
 * - User ID (authenticated) or 'anonymous'
 * - Content-Length header
 * - Referer and Origin headers
 * - Response body preview (first 100 characters)
 * 
 * **Log Levels (Auto-Selected):**
 * - ERROR: Status codes 500-599
 * - WARN: Status codes 400-499
 * - INFO: Status codes 200-399
 * 
 * **Filtering:**
 * - Skips /favicon.ico requests
 * - Skips /static/ resources
 * 
 * **Error Handling:**
 * - Catches logging errors without crashing app
 * - Falls back to console.error if logger fails
 * - Always completes request even if logging fails
 * 
 * @example
 * app.use(responseTime); // Must be before requestLogger
 * app.use(requestLogger);
 * 
 * @example
 * // Log output for successful request
 * // INFO: GET /api/users - 200 {
 * //   method: 'GET',
 * //   url: '/api/users',
 * //   statusCode: 200,
 * //   responseTime: '45ms',
 * //   userId: '507f1f77bcf86cd799439011',
 * //   ip: '192.168.1.1'
 * // }
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
 * Request body logging middleware (development only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @description
 * Logs request body for debugging purposes with security considerations:
 * 
 * **Security Features:**
 * - Only active in development environment
 * - Automatically sanitizes sensitive fields
 * - Replaces passwords with '[HIDDEN]' in logs
 * 
 * **Sanitized Fields:**
 * - contrasena
 * - password
 * - confirmarContrasena
 * - currentPassword
 * - newPassword
 * 
 * **Conditions for Logging:**
 * - NODE_ENV === 'development'
 * - req.body exists and is not empty
 * - Error handling to prevent crashes
 * 
 * **Logged Metadata:**
 * - Sanitized request body
 * - User ID (if authenticated)
 * - HTTP method and URL
 * 
 * @example
 * // Only in development
 * if (process.env.NODE_ENV === 'development') {
 *   app.use(express.json());
 *   app.use(requestBodyLogger);
 * }
 * 
 * @example
 * // Log output (password hidden)
 * // DEBUG: Request Body for POST /api/auth/login {
 * //   body: { correo: 'user@example.com', contrasena: '[HIDDEN]' },
 * //   userId: 'anonymous'
 * // }
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
 * Slow request detection middleware factory
 * @param {number} [threshold=1000] - Response time threshold in milliseconds
 * @returns {Function} Express middleware function
 * 
 * @description
 * Creates middleware that detects and logs requests exceeding time threshold:
 * 
 * **Features:**
 * - Configurable threshold (default: 1000ms = 1 second)
 * - Logs warnings when threshold exceeded
 * - Tracks user and user agent for slow requests
 * - Helps identify performance bottlenecks
 * 
 * **Logged Metadata:**
 * - Actual response time
 * - Configured threshold
 * - User ID (if authenticated)
 * - User-Agent string
 * - HTTP method and URL
 * 
 * **Dependencies:**
 * Requires responseTime middleware to be registered first
 * 
 * **Use Cases:**
 * - Performance monitoring
 * - Identifying slow database queries
 * - Detecting N+1 query problems
 * - API endpoint optimization
 * 
 * @example
 * // Use with default 1 second threshold
 * app.use(responseTime);
 * app.use(slowRequestDetector());
 * 
 * @example
 * // Custom 500ms threshold for faster alerts
 * app.use(slowRequestDetector(500));
 * 
 * @example
 * // Log output when threshold exceeded
 * // WARN: Slow request detected: GET /api/users {
 * //   responseTime: '1523ms',
 * //   threshold: '1000ms',
 * //   userId: '507f1f77bcf86cd799439011',
 * //   userAgent: 'Mozilla/5.0...'
 * // }
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
 * Security headers middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @description
 * Adds basic security headers to all responses:
 * 
 * **Headers Added:**
 * 
 * 1. **X-Frame-Options: DENY**
 *    - Prevents clickjacking attacks
 *    - Disallows embedding in iframes
 * 
 * 2. **X-Content-Type-Options: nosniff**
 *    - Prevents MIME type sniffing
 *    - Forces browser to respect declared content type
 * 
 * 3. **X-XSS-Protection: 1; mode=block**
 *    - Enables browser XSS filter
 *    - Blocks page if XSS attack detected
 * 
 * 4. **Content-Security-Policy: default-src 'self'**
 *    - Basic CSP policy
 *    - Only allows resources from same origin
 * 
 * 5. **X-Powered-By: (removed)**
 *    - Removes Express fingerprinting header
 *    - Reduces information disclosure
 * 
 * **Error Handling:**
 * - Catches header errors without crashing
 * - Logs errors for monitoring
 * - Continues request even if header setting fails
 * 
 * @example
 * // Apply to all routes
 * app.use(securityHeaders);
 * 
 * @example
 * // Response headers added
 * // X-Frame-Options: DENY
 * // X-Content-Type-Options: nosniff
 * // X-XSS-Protection: 1; mode=block
 * // Content-Security-Policy: default-src 'self'
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
 * Request ID middleware for request tracking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @description
 * Generates and attaches unique ID to each request for tracing:
 * 
 * **Features:**
 * - Generates unique ID using timestamp + random string
 * - Attaches ID to req.requestId
 * - Adds X-Request-ID response header
 * - Enhances logger.logError() with request ID
 * - Enables request tracing across logs
 * 
 * **ID Format:**
 * - Base36 timestamp + random Base36 string
 * - Example: 'l8x9k2j5h3p4q6r8'
 * - Fallback format: 'req_[timestamp]_[random]'
 * 
 * **Use Cases:**
 * - Debugging distributed systems
 * - Tracing requests across microservices
 * - Correlating logs from different sources
 * - Support ticket investigation
 * 
 * **Logger Enhancement:**
 * Wraps logger.logError() to automatically include:
 * - Request ID
 * - Error details (name, message, stack, code)
 * - Request details (method, url, IP, user)
 * 
 * @example
 * // Place early in middleware chain
 * app.use(requestId);
 * 
 * @example
 * // Access request ID in route handlers
 * app.get('/api/users', (req, res) => {
 *   console.log('Request ID:', req.requestId);
 *   res.json({ requestId: req.requestId });
 * });
 * 
 * @example
 * // Response includes X-Request-ID header
 * // X-Request-ID: l8x9k2j5h3p4q6r8
 * 
 * @example
 * // Enhanced error logs
 * // ERROR: Request l8x9k2j5h3p4q6r8 - Error: User not found {
 * //   requestId: 'l8x9k2j5h3p4q6r8',
 * //   error: { name: 'AppError', message: 'User not found', ... },
 * //   request: { method: 'GET', url: '/api/users/123', ... }
 * // }
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
 * Generates unique request ID
 * @returns {string} Unique request identifier
 * @private
 * 
 * @description
 * Creates unique ID using combination of timestamp and random value:
 * - Converts Date.now() to base36 for compactness
 * - Adds random base36 string for uniqueness
 * - Falls back to simpler format if generation fails
 * 
 * **Format Examples:**
 * - Normal: 'l8x9k2j5h3p4q6r8'
 * - Fallback: 'req_1696012345678_742'
 * 
 * **Collision Probability:**
 * Extremely low due to timestamp + random combination
 * 
 * @example
 * const id = generateRequestId();
 * // Returns: 'l8x9k2j5h3p4q6r8'
 */
function generateRequestId() {
  try {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  } catch (generateError) {
    // Fallback si hay error generando ID
    return `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
}
/**
 * @exports middleware/requestLogger
 * @description Exported logging and monitoring middleware utilities
 * 
 * @example
 * // Complete setup in index.js
 * const {
 *   responseTime,
 *   requestLogger,
 *   requestBodyLogger,
 *   slowRequestDetector,
 *   securityHeaders,
 *   requestId
 * } = require('./middleware/requestLogger');
 * 
 * // Order matters!
 * app.use(requestId);           // 1. Generate request ID
 * app.use(responseTime);        // 2. Start timing
 * app.use(securityHeaders);     // 3. Add security headers
 * app.use(express.json());      // 4. Parse body
 * app.use(requestBodyLogger);   // 5. Log body (dev only)
 * app.use(requestLogger);       // 6. Log requests
 * app.use(slowRequestDetector(1000)); // 7. Detect slow requests
 * 
 * // ... your routes ...
 * 
 * @example
 * // Production setup (minimal)
 * app.use(requestId);
 * app.use(responseTime);
 * app.use(securityHeaders);
 * app.use(requestLogger);
 * app.use(slowRequestDetector(2000)); // 2 second threshold
 */
module.exports = {
  responseTime,
  requestLogger,
  requestBodyLogger,
  slowRequestDetector,
  securityHeaders,
  requestId
};
