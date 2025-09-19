

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const routes = require('./routes/routes');
const logger = require('./utils/logger');
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./config/swagger');

// Middlewares de error y logging
const { 
  globalErrorHandler, 
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException
} = require('./middleware/errorHandler');

const {
  responseTime,
  requestLogger,
  requestBodyLogger,
  slowRequestDetector,
  securityHeaders,
  requestId
} = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 8080;

// ========================================
// DOCUMENTACIÓN SWAGGER
// ========================================

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Swagger JSON spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Redirección para facilitar acceso
app.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});


// ========================================
// MANEJO DE EXCEPCIONES GLOBALES
// ========================================
handleUncaughtException();
handleUnhandledRejection();

// ========================================
// CONEXIÓN A BASE DE DATOS
// ========================================
connectDB();

// ========================================
// MIDDLEWARES DE SEGURIDAD Y LOGGING
// ========================================

// Headers de seguridad
app.use(securityHeaders);

// Request ID único
app.use(requestId);

// Tiempo de respuesta
app.use(responseTime);

// Logging de requests
app.use(requestLogger);

// Detector de requests lentos (>2 segundos)
app.use(slowRequestDetector(2000));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parseo de JSON con límites de seguridad
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        success: false,
        message: 'JSON inválido',
        code: 'INVALID_JSON'
      });
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging del body de requests (solo desarrollo)
app.use(requestBodyLogger);

// ========================================
// RUTA DE HEALTH CHECK
// ========================================
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.4.0',
    requestId: req.requestId
  };
  
  logger.info('Health check requested', { 
    uptime: healthCheck.uptime,
    requestId: req.requestId 
  });
  
  res.status(200).json({
    success: true,
    data: healthCheck
  });
});

// ========================================
// RUTA PRINCIPAL
// ========================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CheckNote funcionando correctamente  🚀',
    version: '1.4.0',
    environment: process.env.NODE_ENV || 'Implementación',
    features: {
      authentication: '✅ JWT',
      users: '✅ CRUD + Perfil',
      tasks: '✅ CRUD + Filtros',
      errorHandling: '✅ Global + Custom',
      logging: '✅ Avanzado',
      security: '✅ Headers + Validation'
    },
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      tasks: '/api/v1/tasks'
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// ========================================
// RUTAS DE LA API
// ========================================
app.use('/api/v1', routes);

// ========================================
// MANEJO DE ERRORES
// ========================================

// Capturar rutas no encontradas
app.use(notFoundHandler);

// Middleware global de errores (debe ser el último)
app.use(globalErrorHandler);

// ========================================
// INICIO DEL SERVIDOR
// ========================================
const server = app.listen(PORT, () => {
  const startMessage = `🚀 Servidor TO-DO List iniciado correctamente`;
  const details = {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: '1.4.0',
    features: 'Auth + Users + Tasks + Error Handling + Logging',
    timestamp: new Date().toISOString()
  };
  
  console.log(`🌐 Servidor disponible en: http://localhost:${PORT}`);
  console.log(`📖 Documentación Swagger: http://localhost:${PORT}/api-docs`);
  console.log('📋 Funcionalidades: Auth ✅ | Users ✅ | Tasks ✅ | Error Handling ✅ | Logging ✅');
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  
  logger.info(startMessage, details);
});

// ========================================
// MANEJO GRACEFUL SHUTDOWN
// ========================================
const gracefulShutdown = (signal) => {
  console.log(`\n📴 Señal ${signal} recibida. Cerrando servidor gracefully...`);
  logger.info(`Server shutdown initiated`, { signal });
  
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    logger.info('Server closed successfully');
    process.exit(0);
  });
  
  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    console.error('❌ Forzando cierre del servidor');
    logger.error('Forcing server shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Escuchar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));