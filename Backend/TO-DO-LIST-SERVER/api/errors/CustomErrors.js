// api/errors/CustomErrors.js

/**
 * Clase base para errores personalizados
 */
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores de validación (400)
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Errores de autenticación (401)
 */
class AuthenticationError extends AppError {
  constructor(message = 'Credenciales incorrectas') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Errores de autorización (403)
 */
class AuthorizationError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Recurso no encontrado (404)
 */
class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND_ERROR');
  }
}

/**
 * Conflicto (409) - Duplicados, etc.
 */
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Rate Limit (429)
 */
class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes. Intenta más tarde.') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Error interno del servidor (500)
 */
class InternalServerError extends AppError {
  constructor(message = 'Error interno del servidor') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Base de datos no disponible (503)
 */
class DatabaseError extends AppError {
  constructor(message = 'Error de conexión con la base de datos') {
    super(message, 503, 'DATABASE_ERROR');
  }
}

/**
 * Servicio no disponible (503)
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Servicio temporalmente no disponible') {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR');
  }
}

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