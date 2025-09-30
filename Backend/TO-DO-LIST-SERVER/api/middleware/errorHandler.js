/**
 * @file errorHandler.js
 * @description Global error handling middleware for Express application
 * @module middleware/errorHandler
 * @requires ../utils/logger
 * @requires ../errors/CustomErrors
 * 
 * @description
 * Provides comprehensive error handling functionality including:
 * - Global error handler middleware
 * - Mongoose error conversion (validation, duplicate, cast errors)
 * - JWT error conversion (invalid token, expired token)
 * - Environment-specific error responses (development vs production)
 * - Route not found handler
 * - Async error wrapper
 * - Unhandled rejection and exception handlers
 * 
 * Error Types Handled:
 * - Mongoose ValidationError → 400 Bad Request
 * - Mongoose Duplicate Key (E11000) → 409 Conflict
 * - Mongoose CastError → 400 Bad Request
 * - JsonWebTokenError → 401 Unauthorized
 * - TokenExpiredError → 401 Unauthorized
 * - Custom AppError → Maintains original status code
 * - Unknown Errors → 500 Internal Server Error
 * 
 * @example
 * // In index.js
 * const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
 * 
 * // Register error handlers after all routes
 * app.use(notFoundHandler);
 * app.use(globalErrorHandler);
 */

const logger = require('../utils/logger');
const { AppError } = require('../errors/CustomErrors');

/**
 * Converts Mongoose errors to custom AppError instances
 * @param {Error} error - Mongoose error object
 * @returns {Error|AppError} Converted error or original error if not a Mongoose error
 * 
 * @description
 * Handles three types of Mongoose errors:
 * 
 * 1. **ValidationError** - Schema validation failures
 *    - Extracts all validation errors with field, message, and value
 *    - Returns 400 Bad Request with detailed error list
 * 
 * 2. **Duplicate Key Error (E11000)** - Unique constraint violations
 *    - Extracts field name and duplicate value
 *    - Returns 409 Conflict with field details
 *    - Special handling for 'correo' field (email)
 * 
 * 3. **CastError** - Invalid ObjectId or type casting failures
 *    - Returns 400 Bad Request with invalid value details
 * 
 * @example
 * // Mongoose ValidationError
 * const error = new mongoose.Error.ValidationError();
 * const appError = handleMongooseError(error);
 * // Returns: AppError with status 400, code 'VALIDATION_ERROR'
 * 
 * @example
 * // Duplicate Email Error
 * const error = { code: 11000, keyValue: { correo: 'test@test.com' } };
 * const appError = handleMongooseError(error);
 * // Returns: AppError "Correo electrónico 'test@test.com' ya existe"
 */
const handleMongooseError = (error) => {
  // Error de validación de Mongoose
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    
    return new AppError(
      'Datos de entrada inválidos',
      400,
      'VALIDATION_ERROR',
      errors
    );
  }
  
  // Error de duplicado (E11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    
    return new AppError(
      `${field === 'correo' ? 'Correo electrónico' : field} '${value}' ya existe`,
      409,
      'DUPLICATE_ERROR',
      { field, value }
    );
  }
  
  // Error de Cast (ID inválido)
  if (error.name === 'CastError') {
    return new AppError(
      `ID inválido: ${error.value}`,
      400,
      'INVALID_ID_ERROR',
      { field: error.path, value: error.value }
    );
  }
  
  return error;
};

/**
 * Converts JWT errors to custom AppError instances
 * @param {Error} error - JWT error object
 * @returns {Error|AppError} Converted error or original error if not a JWT error
 * 
 * @description
 * Handles two types of JWT errors:
 * 
 * 1. **JsonWebTokenError** - Invalid token signature or malformed token
 *    - Returns 401 Unauthorized with 'INVALID_TOKEN_ERROR' code
 * 
 * 2. **TokenExpiredError** - Token has expired
 *    - Returns 401 Unauthorized with 'TOKEN_EXPIRED_ERROR' code
 * 
 * Both errors result in 401 status to prompt re-authentication
 * 
 * @example
 * // Invalid Token
 * const error = new JsonWebTokenError('invalid token');
 * const appError = handleJWTError(error);
 * // Returns: AppError with status 401, code 'INVALID_TOKEN_ERROR'
 * 
 * @example
 * // Expired Token
 * const error = new TokenExpiredError('jwt expired', new Date());
 * const appError = handleJWTError(error);
 * // Returns: AppError with status 401, code 'TOKEN_EXPIRED_ERROR'
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Token inválido', 401, 'INVALID_TOKEN_ERROR');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expirado', 401, 'TOKEN_EXPIRED_ERROR');
  }
  
  return error;
};

/**
 * Sends detailed error response in development environment
 * @param {Error} err - Error object to send
 * @param {Object} res - Express response object
 * @returns {void}
 * 
 * @description
 * Development error response includes:
 * - Full error stack trace
 * - Error name and type
 * - Status code and custom error code
 * - All error details
 * - Complete error object for debugging
 * 
 * Logs error details to logger with DEBUG level
 * 
 * @example
 * sendErrorDev(error, res);
 * // Response:
 * // {
 * //   success: false,
 * //   error: {
 * //     message: "Validation failed",
 * //     code: "VALIDATION_ERROR",
 * //     statusCode: 400,
 * //     details: [...],
 * //     stack: "Error: Validation failed\n    at..."
 * //   }
 * // }
 */
const sendErrorDev = (err, res) => {
  logger.error('Development Error', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      code: err.code,
      details: err.details
    }
  });
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
      stack: err.stack
    }
  });
};

/**
 * Sends sanitized error response in production environment
 * @param {Error} err - Error object to send
 * @param {Object} res - Express response object
 * @returns {void}
 * 
 * @description
 * Distinguishes between operational and programming errors:
 * 
 * **Operational Errors** (isOperational = true):
 * - Expected errors that can be safely shown to client
 * - Examples: Validation errors, not found, unauthorized
 * - Sends detailed error message, code, and details
 * - Logs with ERROR level
 * 
 * **Programming Errors** (isOperational = false):
 * - Unexpected errors, bugs, or system failures
 * - Examples: Uncaught exceptions, null references
 * - Sends generic error message to client
 * - Logs full error details server-side
 * - Prevents leaking sensitive system information
 * 
 * @example
 * // Operational Error Response
 * sendErrorProd(appError, res);
 * // {
 * //   success: false,
 * //   message: "Usuario no encontrado",
 * //   code: "NOT_FOUND_ERROR",
 * //   details: {...},
 * //   timestamp: "2025-09-29T10:30:00.000Z"
 * // }
 * 
 * @example
 * // Programming Error Response (generic)
 * sendErrorProd(unknownError, res);
 * // {
 * //   success: false,
 * //   message: "Algo salió mal. Por favor intenta más tarde.",
 * //   code: "INTERNAL_SERVER_ERROR",
 * //   timestamp: "2025-09-29T10:30:00.000Z"
 * // }
 */
const sendErrorProd = (err, res) => {
  // Errores operacionales: enviar mensaje al cliente
  if (err.isOperational) {
    logger.error('Operational Error', {
      error: {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        details: err.details
      }
    });
    
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
      timestamp: err.timestamp
    });
  } else {
    // Errores de programación: no filtrar detalles al cliente
    logger.error('Programming Error', {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack
      }
    });
    
    res.status(500).json({
      success: false,
      message: 'Algo salió mal. Por favor intenta más tarde.',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Global error handling middleware for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @description
 * Main error handler that processes all errors in the application:
 * 
 * **Processing Flow:**
 * 1. Sets default status code (500) and status ('error')
 * 2. Logs error with request context using logger
 * 3. Converts known errors (Mongoose, JWT) to AppError instances
 * 4. Routes to appropriate error response handler based on environment
 * 
 * **Environment Behavior:**
 * - Development: Detailed error with stack traces
 * - Production: Sanitized errors, hides programming errors
 * 
 * **Error Conversion:**
 * - Mongoose errors → AppError with appropriate status codes
 * - JWT errors → AppError with 401 Unauthorized
 * - Custom AppError → Passes through unchanged
 * - Unknown errors → Logged and handled safely
 * 
 * @example
 * // Register as last middleware in Express app
 * app.use(globalErrorHandler);
 * 
 * @example
 * // Error automatically caught and handled
 * app.get('/users/:id', async (req, res, next) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) {
 *     return next(new AppError('User not found', 404, 'NOT_FOUND'));
 *   }
 *   res.json(user);
 * });
 */
const globalErrorHandler = (err, req, res, next) => {
  // Establecer valores por defecto
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Log del error con contexto de la request
  logger.logError(err, req);
  
  // Crear copia del error
  let error = { ...err };
  error.message = err.message;
  
  // Convertir errores conocidos a errores personalizados
  error = handleMongooseError(error);
  error = handleJWTError(error);
  
  // Enviar respuesta según el entorno
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * Middleware to handle requests to non-existent routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @description
 * Catches all requests that don't match any defined routes:
 * - Creates AppError with 404 status
 * - Includes requested URL in error message
 * - Passes error to global error handler via next()
 * 
 * Should be registered after all valid routes but before error handler
 * 
 * @example
 * // Register after all routes
 * app.use('/api/users', userRoutes);
 * app.use('/api/tasks', taskRoutes);
 * app.use(notFoundHandler); // Catch 404s
 * app.use(globalErrorHandler); // Handle errors
 * 
 * @example
 * // Request to /api/invalid/route
 * // Creates: AppError("Ruta /api/invalid/route no encontrada", 404, 'ROUTE_NOT_FOUND')
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Ruta ${req.originalUrl} no encontrada`,
    404,
    'ROUTE_NOT_FOUND'
  );
  
  next(error);
};

/**
 * Wraps async route handlers to catch rejected promises
 * @param {Function} fn - Async function (route handler)
 * @returns {Function} Wrapped function that catches errors
 * 
 * @description
 * Higher-order function that eliminates need for try-catch blocks in async routes:
 * - Catches any rejected promises from async functions
 * - Automatically forwards errors to Express error handler via next()
 * - Simplifies async error handling throughout application
 * 
 * **Without catchAsync:**
 * ```javascript
 * app.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await User.find();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * ```
 * 
 * **With catchAsync:**
 * ```javascript
 * app.get('/users', catchAsync(async (req, res, next) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 * ```
 * 
 * @example
 * const { catchAsync } = require('./middleware/errorHandler');
 * 
 * router.get('/users/:id', catchAsync(async (req, res, next) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) throw new AppError('User not found', 404);
 *   res.json(user);
 * }));
 * 
 * @example
 * // Error automatically caught and forwarded
 * router.post('/users', catchAsync(async (req, res) => {
 *   const user = await User.create(req.body); // If fails, error caught
 *   res.status(201).json(user);
 * }));
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Registers handler for unhandled promise rejections
 * @returns {void}
 * 
 * @description
 * Sets up global listener for promise rejections that weren't caught:
 * - Listens to 'unhandledRejection' event on process
 * - Logs complete error details with stack trace
 * - Exits process with code 1 to trigger restart (by process manager)
 * 
 * **Common Causes:**
 * - Async functions without try-catch or .catch()
 * - Database connection failures
 * - External API call failures
 * - Missing error handlers in promise chains
 * 
 * **Best Practices:**
 * - Call this function during application initialization
 * - Use with process manager (PM2, systemd) for auto-restart
 * - Always handle promises properly to avoid triggering this
 * 
 * @example
 * // In index.js (before server start)
 * const { handleUnhandledRejection } = require('./middleware/errorHandler');
 * handleUnhandledRejection();
 * 
 * @example
 * // Unhandled rejection example (bad practice)
 * Promise.reject(new Error('Something failed')); // Will trigger handler
 * 
 * @example
 * // Properly handled rejection (good practice)
 * Promise.reject(new Error('Something failed'))
 *   .catch(err => logger.error(err)); // Won't trigger handler
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection', {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack
      },
      promise: promise
    });
    
    // Cerrar servidor gracefully
    console.log('UNHANDLED PROMISE REJECTION! 💥 Shutting down...');
    process.exit(1);
  });
};


/**
 * Registers handler for uncaught exceptions
 * @returns {void}
 * 
 * @description
 * Sets up global listener for synchronous errors that weren't caught:
 * - Listens to 'uncaughtException' event on process
 * - Logs complete error details with stack trace
 * - Exits process with code 1 to trigger restart
 * 
 * **Common Causes:**
 * - Synchronous code without try-catch blocks
 * - Typos or undefined variables
 * - Null/undefined access errors
 * - Syntax errors in loaded modules
 * 
 * **Important Notes:**
 * - Should be registered BEFORE any other code runs
 * - Application state may be corrupted after uncaught exception
 * - Process restart is safest option to ensure clean state
 * - Use process manager for automatic restart
 * 
 * @example
 * // In index.js (first thing in file)
 * const { handleUncaughtException } = require('./middleware/errorHandler');
 * handleUncaughtException();
 * 
 * // Then rest of application code...
 * 
 * @example
 * // Uncaught exception example (bad practice)
 * const user = null;
 * console.log(user.name); // Will trigger handler
 * 
 * @example
 * // Properly handled exception (good practice)
 * try {
 *   const user = null;
 *   console.log(user.name);
 * } catch (err) {
 *   logger.error(err);
 * }
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack
      }
    });
    
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    process.exit(1);
  });
};
/**
 * @exports middleware/errorHandler
 * @description Exported error handling utilities for Express application
 * 
 * @example
 * // Import in index.js
 * const {
 *   globalErrorHandler,
 *   notFoundHandler,
 *   catchAsync,
 *   handleUnhandledRejection,
 *   handleUncaughtException
 * } = require('./middleware/errorHandler');
 * 
 * // Setup process handlers (first)
 * handleUncaughtException();
 * handleUnhandledRejection();
 * 
 * // Register middleware (after routes)
 * app.use(notFoundHandler);
 * app.use(globalErrorHandler);
 */
module.exports = {
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  handleUnhandledRejection,
  handleUncaughtException
};
