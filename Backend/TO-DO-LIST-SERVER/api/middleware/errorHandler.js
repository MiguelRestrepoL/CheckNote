// api/middleware/errorHandler.js

const logger = require('../utils/logger');
const { AppError } = require('../errors/CustomErrors');

/**
 * Convertir errores de Mongoose a errores personalizados
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
 * Convertir errores de JWT a errores personalizados
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
 * Generar respuesta de error en desarrollo
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
 * Generar respuesta de error en producción
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
 * Middleware principal de manejo de errores
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
 * Middleware para capturar rutas no encontradas
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
 * Middleware para capturar errores asíncronos
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Manejador de promesas no capturadas
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
 * Manejador de excepciones no capturadas
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

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  handleUnhandledRejection,
  handleUncaughtException
};