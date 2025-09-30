/**
 * @fileoverview Custom Error Classes - Standardized error handling for the application
 * @module errors/CustomErrors
 * 
 * @description
 * Defines a hierarchy of custom error classes that extend the base Error class.
 * Provides standardized error responses with consistent structure across the API.
 * 
 * All errors include:
 * - HTTP status code
 * - Status type ('fail' for 4xx, 'error' for 5xx)
 * - Error code (machine-readable identifier)
 * - Human-readable message
 * - Optional details object
 * - Timestamp (ISO 8601 format)
 * - Operational flag (distinguishes expected vs unexpected errors)
 * 
 * Error hierarchy:
 * - AppError (base class)
 *   ├── ValidationError (400)
 *   ├── AuthenticationError (401)
 *   ├── AuthorizationError (403)
 *   ├── NotFoundError (404)
 *   ├── ConflictError (409)
 *   ├── RateLimitError (429)
 *   ├── InternalServerError (500)
 *   ├── DatabaseError (503)
 *   └── ServiceUnavailableError (503)
 * 
 * @example
 * // Throw validation error
 * throw new ValidationError('Invalid email format', {
 *   field: 'email',
 *   value: 'invalid-email'
 * });
 * 
 * @example
 * // Throw not found error
 * const user = await User.findById(id);
 * if (!user) {
 *   throw new NotFoundError('Usuario');
 * }
 * 
 * @example
 * // Error middleware catches and formats
 * app.use((err, req, res, next) => {
 *   if (err instanceof AppError) {
 *     res.status(err.statusCode).json({
 *       status: err.status,
 *       code: err.code,
 *       message: err.message,
 *       details: err.details,
 *       timestamp: err.timestamp
 *     });
 *   }
 * });
 */


/**
 * Base application error class
 * 
 * @class AppError
 * @extends Error
 * 
 * @description
 * Base class for all custom application errors. Provides common structure
 * and properties for error handling throughout the application.
 * 
 * Features:
 * - Standardized error format
 * - HTTP status code mapping
 * - Machine-readable error codes
 * - Operational error flag (vs programming errors)
 * - Stack trace capture
 * - Timestamp for logging
 * 
 * The 'isOperational' flag distinguishes between:
 * - Operational errors: Expected errors (validation, not found, etc.)
 * - Programming errors: Unexpected bugs (should crash in development)
 * 
 * @property {string} message - Human-readable error message
 * @property {number} statusCode - HTTP status code (4xx or 5xx)
 * @property {string} status - 'fail' for 4xx, 'error' for 5xx
 * @property {string|null} code - Machine-readable error code
 * @property {Object|null} details - Additional error details
 * @property {boolean} isOperational - true for expected errors
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} stack - Error stack trace
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} [code=null] - Error code identifier
 * @param {Object} [details=null] - Additional error information
 * 
 * @example
 * // Direct usage (usually subclasses are used instead)
 * throw new AppError('Something went wrong', 500, 'GENERIC_ERROR');
 * 
 * @example
 * // Check if error is operational
 * if (err.isOperational) {
 *   // Safe to send to client
 *   res.status(err.statusCode).json({ error: err.message });
 * } else {
 *   // Programming error - log and send generic message
 *   console.error(err);
 *   res.status(500).json({ error: 'Internal server error' });
 * }
 */
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    /**
     * HTTP status code
     * @type {number}
     */
    this.statusCode = statusCode;
    /**
     * Status type: 'fail' for 4xx (client errors), 'error' for 5xx (server errors)
     * @type {string}
     */
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    /**
     * Machine-readable error code
     * @type {string|null}
     */
    this.code = code;
     /**
     * Additional error details (validation errors, field info, etc.)
     * @type {Object|null}
     */
    this.details = details;
     /**
     * Flag indicating this is an operational (expected) error
     * @type {boolean}
     */
    
    this.isOperational = true;
    /**
     * Timestamp when error occurred
     * @type {string}
     */
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class (400 Bad Request)
 * 
 * @class ValidationError
 * @extends AppError
 * 
 * @description
 * Used for client input validation failures. Thrown when request data
 * doesn't meet requirements (format, type, constraints, etc.).
 * 
 * Common scenarios:
 * - Invalid email format
 * - Missing required fields
 * - Value out of range
 * - Type mismatch
 * - Schema validation failures
 * 
 * @param {string} message - Validation error description
 * @param {Object} [details=null] - Validation error details
 * @param {string} [details.field] - Field that failed validation
 * @param {*} [details.value] - Invalid value provided
 * @param {string} [details.constraint] - Constraint that was violated
 * 
 * @example
 * // Basic validation error
 * throw new ValidationError('El correo electrónico no es válido');
 * 
 * @example
 * // With detailed field information
 * throw new ValidationError('Email inválido', {
 *   field: 'email',
 *   value: 'not-an-email',
 *   constraint: 'Must be valid email format'
 * });
 * 
 * @example
 * // Multiple validation errors
 * throw new ValidationError('Errores de validación', {
 *   errors: [
 *     { field: 'email', message: 'Email inválido' },
 *     { field: 'password', message: 'Muy corta' }
 *   ]
 * });
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication error class (401 Unauthorized)
 * 
 * @class AuthenticationError
 * @extends AppError
 * 
 * @description
 * Used when authentication fails. Indicates the user's credentials are
 * invalid or missing. Requires re-authentication.
 * 
 * Common scenarios:
 * - Invalid username/password
 * - Missing authentication token
 * - Expired token
 * - Invalid token signature
 * - Account locked/suspended
 * 
 * @param {string} [message='Credenciales incorrectas'] - Authentication error message
 * 
 * @example
 * // Default message
 * throw new AuthenticationError();
 * 
 * @example
 * // Custom message for token expiry
 * throw new AuthenticationError('Token expirado. Inicia sesión nuevamente.');
 * 
 * @example
 * // Use in auth middleware
 * if (!token) {
 *   throw new AuthenticationError('Token de autenticación requerido');
 * }
 */
class AuthenticationError extends AppError {
  constructor(message = 'Credenciales incorrectas') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization error class (403 Forbidden)
 * 
 * @class AuthorizationError
 * @extends AppError
 * 
 * @description
 * Used when user is authenticated but doesn't have permission for the
 * requested action. Authentication succeeded but authorization failed.
 * 
 * Common scenarios:
 * - Accessing other user's resources
 * - Insufficient role/permissions
 * - Operation not allowed in current state
 * - Account lacks required privileges
 * 
 * @param {string} [message='No tienes permisos para realizar esta acción'] - Authorization error message
 * 
 * @example
 * // Default message
 * throw new AuthorizationError();
 * 
 * @example
 * // Custom permission message
 * throw new AuthorizationError('Solo administradores pueden eliminar usuarios');
 * 
 * @example
 * // Use in resource ownership check
 * if (task.userId.toString() !== req.user.id) {
 *   throw new AuthorizationError('No puedes modificar tareas de otros usuarios');
 * }
 */
class AuthorizationError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found error class (404 Not Found)
 * 
 * @class NotFoundError
 * @extends AppError
 * 
 * @description
 * Used when a requested resource doesn't exist in the database.
 * Automatically formats message with resource name.
 * 
 * Common scenarios:
 * - User ID not found
 * - Task ID not found
 * - Route not found
 * - Referenced entity missing
 * 
 * @param {string} [resource='Recurso'] - Name of the resource not found
 * 
 * @example
 * // Default message: "Recurso no encontrado"
 * throw new NotFoundError();
 * 
 * @example
 * // Specific resource: "Usuario no encontrado"
 * const user = await User.findById(id);
 * if (!user) {
 *   throw new NotFoundError('Usuario');
 * }
 * 
 * @example
 * // Multiple words: "Tarea pendiente no encontrada"
 * throw new NotFoundError('Tarea pendiente');
 */
class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND_ERROR');
  }
}

/**
 * Conflict error class (409 Conflict)
 * 
 * @class ConflictError
 * @extends AppError
 * 
 * @description
 * Used when request conflicts with current state of the server.
 * Commonly for duplicate entries or constraint violations.
 * 
 * Common scenarios:
 * - Duplicate email/username
 * - Unique constraint violation
 * - Resource already exists
 * - State conflict (e.g., deleting in-use resource)
 * 
 * @param {string} message - Conflict description
 * 
 * @example
 * // Duplicate email
 * const existingUser = await User.findOne({ email });
 * if (existingUser) {
 *   throw new ConflictError('El correo electrónico ya está registrado');
 * }
 * 
 * @example
 * // Username taken
 * throw new ConflictError('El nombre de usuario no está disponible');
 * 
 * @example
 * // Handle MongoDB duplicate key error
 * catch (err) {
 *   if (err.code === 11000) {
 *     throw new ConflictError('Ya existe un registro con estos datos');
 *   }
 * }
 */
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Rate limit error class (429 Too Many Requests)
 * 
 * @class RateLimitError
 * @extends AppError
 * 
 * @description
 * Used when client exceeds rate limits. Indicates too many requests
 * in a given time window.
 * 
 * Common scenarios:
 * - Too many login attempts
 * - API rate limit exceeded
 * - Password reset spam
 * - Registration flood
 * 
 * Typically thrown by rate limiting middleware.
 * 
 * @param {string} [message='Demasiadas solicitudes. Intenta más tarde.'] - Rate limit message
 * 
 * @example
 * // Default message
 * throw new RateLimitError();
 * 
 * @example
 * // Specific limit message
 * throw new RateLimitError('Máximo 5 intentos de login. Intenta en 10 minutos.');
 * 
 * @example
 * // Use in rate limiter
 * if (attempts > MAX_ATTEMPTS) {
 *   throw new RateLimitError(`Demasiados intentos. Espera ${waitTime} minutos.`);
 * }
 */
class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes. Intenta más tarde.') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Internal server error class (500 Internal Server Error)
 * 
 * @class InternalServerError
 * @extends AppError
 * 
 * @description
 * Used for unexpected server-side errors that are operational but not
 * specific to other categories. Generic catch-all for server issues.
 * 
 * Common scenarios:
 * - Unexpected condition occurred
 * - Third-party service returned error
 * - Operational error without specific type
 * - Failed business logic
 * 
 * Note: For programming errors (bugs), don't use this - let them crash.
 * 
 * @param {string} [message='Error interno del servidor'] - Error description
 * 
 * @example
 * // Default generic message
 * throw new InternalServerError();
 * 
 * @example
 * // Specific internal error
 * throw new InternalServerError('Error procesando el pago');
 * 
 * @example
 * // Wrap third-party errors
 * try {
 *   await paymentService.process();
 * } catch (err) {
 *   throw new InternalServerError('Error en el servicio de pago');
 * }
 */
class InternalServerError extends AppError {
  constructor(message = 'Error interno del servidor') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Database error class (503 Service Unavailable)
 * 
 * @class DatabaseError
 * @extends AppError
 * 
 * @description
 * Used when database is unavailable or connection fails.
 * Indicates temporary service disruption.
 * 
 * Common scenarios:
 * - MongoDB connection lost
 * - Database server down
 * - Connection timeout
 * - Network issues to database
 * 
 * Should trigger retry logic or circuit breaker patterns.
 * 
 * @param {string} [message='Error de conexión con la base de datos'] - Database error message
 * 
 * @example
 * // Default message
 * throw new DatabaseError();
 * 
 * @example
 * // Specific connection error
 * throw new DatabaseError('No se pudo conectar a MongoDB');
 * 
 * @example
 * // Handle mongoose connection errors
 * mongoose.connection.on('error', (err) => {
 *   console.error('MongoDB error:', err);
 *   throw new DatabaseError('Base de datos temporalmente no disponible');
 * });
 */
class DatabaseError extends AppError {
  constructor(message = 'Error de conexión con la base de datos') {
    super(message, 503, 'DATABASE_ERROR');
  }
}

/**
 * Service unavailable error class (503 Service Unavailable)
 * 
 * @class ServiceUnavailableError
 * @extends AppError
 * 
 * @description
 * Used when a required service is temporarily unavailable.
 * Indicates the server cannot handle the request due to temporary overload
 * or maintenance.
 * 
 * Common scenarios:
 * - Email service down
 * - Payment gateway unavailable
 * - External API unresponsive
 * - Server maintenance
 * - Circuit breaker open
 * 
 * Client should retry the request after some time.
 * 
 * @param {string} [message='Servicio temporalmente no disponible'] - Service error message
 * 
 * @example
 * // Default message
 * throw new ServiceUnavailableError();
 * 
 * @example
 * // Specific service
 * throw new ServiceUnavailableError('Servicio de correo no disponible');
 * 
 * @example
 * // External API failure
 * try {
 *   await externalAPI.call();
 * } catch (err) {
 *   throw new ServiceUnavailableError('El servicio externo no responde');
 * }
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Servicio temporalmente no disponible') {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR');
  }
}
/**
 * @exports CustomErrors
 * 
 * @description
 * All custom error classes for use throughout the application.
 * Import specific errors as needed.
 * 
 * @example
 * // Import specific errors
 * const { ValidationError, NotFoundError } = require('./errors/CustomErrors');
 * 
 * @example
 * // Import all errors
 * const Errors = require('./errors/CustomErrors');
 * throw new Errors.ValidationError('Invalid input');
 * 
 * @example
 * // Use in controller
 * const { NotFoundError, AuthorizationError } = require('../errors/CustomErrors');
 * 
 * async function getTask(req, res) {
 *   const task = await Task.findById(req.params.id);
 *   if (!task) throw new NotFoundError('Tarea');
 *   if (task.userId !== req.user.id) throw new AuthorizationError();
 *   res.json({ task });
 * }
 */
module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  ServiceUnavailableError
};
