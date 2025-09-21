require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const routes = require('./routes/routes');
const { 
  apiLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter
} = require('./middleware/rateLimitMiddleware');
const logger = require('./utils/logger');
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./config/swagger');
const AccountSecurityService = require('./services/AccountSecurityService');
const PasswordResetService = require('./services/PasswordResetService');
// NUEVO: Importar EmailService
const EmailService = require('./services/EmailService');

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
// CONFIGURACIÓN DE SEGURIDAD AVANZADA - FASE 5
// ========================================
app.set('trust proxy', 1); // Confiar en el primer proxy para obtener IP real

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
// CONEXIÓN A BASE DE DATOS E INICIALIZACIÓN DE SERVICIOS
// ========================================
connectDB();

// NUEVO: Función para inicializar servicios
async function initializeServices() {
  console.log('Inicializando servicios...');
  logger.info('Starting service initialization');
  
  try {
    await EmailService.initialize();
    console.log('✅ EmailService inicializado correctamente');
    logger.info('EmailService initialized successfully', {
      configured: EmailService.isConfigured,
      provider: 'resend',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error inicializando EmailService:', error.message);
    logger.error('EmailService initialization failed', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 EmailService en modo simulación para desarrollo');
      logger.info('EmailService running in simulation mode for development');
    }
  }
  
  // Inicializar otros servicios si es necesario
  logger.info('All services initialization completed');
}

// ========================================
// MIDDLEWARES DE SEGURIDAD Y LOGGING
// ========================================

// Headers de seguridad (tu implementación existente + mejoras FASE 5)
app.use((req, res, next) => {
  // Headers de seguridad existentes
  securityHeaders(req, res, () => {});
  
  // Headers adicionales FASE 5
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

// Request ID único
app.use(requestId);

// Tiempo de respuesta
app.use(responseTime);

// Rate limiting global para todas las rutas de API - FASE 5
app.use('/api', apiLimiter);

// Logging de requests
app.use(requestLogger);

// FASE 5: Logging avanzado de eventos de seguridad
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Log detallado para rutas de autenticación y seguridad
  if (req.path.includes('/auth/') || req.path.includes('/users')) {
    logger.info('Security endpoint accessed', {
      method: req.method,
      path: req.path,
      ip: ip,
      userAgent: userAgent.substring(0, 100),
      requestId: req.requestId,
      timestamp
    });
  }
  
  next();
});

// Detector de requests lentos (>2 segundos)
app.use(slowRequestDetector(2000));

// CORS con configuración mejorada - FASE 5
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'https://check-note-fend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean), // Elimina valores undefined/null
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Parseo de JSON con límites de seguridad mejorados - FASE 5
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      logger.error('Invalid JSON received', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId,
        error: e.message
      });
      
      res.status(400).json({
        success: false,
        message: 'JSON inválido en el cuerpo de la petición',
        code: 'INVALID_JSON',
        requestId: req.requestId
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging del body de requests (solo desarrollo)
app.use(requestBodyLogger);

// ========================================
// RUTA DE HEALTH CHECK MEJORADA
// ========================================
app.get('/health', (req, res) => {
  const emailStats = EmailService.getStats ? EmailService.getStats() : {};
  
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.5.0',
    requestId: req.requestId,
    security: {
      rateLimiting: 'active',
      accountBlocking: 'active',
      passwordReset: 'active',
      emailService: EmailService.isConfigured === true ? 'configured' : 
                   EmailService.isConfigured === 'simulation' ? 'simulation' : 'not configured'
    },
    services: {
      email: {
        status: EmailService.isConfigured,
        provider: emailStats.provider || 'resend',
        templatesLoaded: emailStats.templatesLoaded || 0
      }
    }
  };
  
  logger.info('Health check requested', { 
    uptime: healthCheck.uptime,
    requestId: req.requestId,
    emailService: healthCheck.security.emailService
  });
  
  res.status(200).json({
    success: true,
    data: healthCheck
  });
});

// ========================================
// RUTA PRINCIPAL MEJORADA - FASE 5
// ========================================
app.get('/', (req, res) => {
  const emailConfigured = EmailService.isConfigured === true;
  const emailSimulation = EmailService.isConfigured === 'simulation';
  
  res.json({
    success: true,
    message: 'CheckNote funcionando correctamente 🚀',
    version: '1.5.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      authentication: '✅ JWT + Bloqueo de cuentas',
      users: '✅ CRUD + Perfil + Seguridad',
      tasks: '✅ CRUD + Filtros',
      errorHandling: '✅ Global + Custom',
      logging: '✅ Avanzado',
      security: '✅ Headers + Rate Limiting + Password Reset',
      email: emailConfigured ? '✅ Configurado (Resend)' : 
             emailSimulation ? '⚠️ Simulación (Desarrollo)' : '❌ No configurado'
    },
    security: {
      rateLimiting: {
        api: '100 requests/15min',
        login: '5 attempts/10min',
        register: '3 attempts/hour',
        passwordReset: '3 attempts/hour'
      },
      accountBlocking: '5 failed attempts → 30min lock',
      passwordReset: 'Secure tokens + Email notifications'
    },
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      auth: {
        login: 'POST /api/v1/auth/login',
        verify: 'POST /api/v1/auth/verify',
        requestReset: 'POST /api/v1/auth/request-password-reset',
        resetPassword: 'POST /api/v1/auth/reset-password'
      },
      users: '/api/v1/users',
      tasks: '/api/v1/tasks'
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// ========================================
// RUTA DE ESTADO DE SEGURIDAD - FASE 5 (solo desarrollo)
// ========================================
if (process.env.NODE_ENV === 'development') {
  app.get('/security-status', async (req, res) => {
    try {
      const securityStats = await AccountSecurityService.getSecurityStats();
      const resetStats = await PasswordResetService.getResetStats();
      const emailStats = EmailService.getStats ? EmailService.getStats() : {};
      
      logger.info('Security status requested', { requestId: req.requestId });
      
      res.json({
        success: true,
        message: 'Estado de seguridad del sistema',
        data: {
          security: securityStats,
          passwordReset: resetStats,
          emailService: {
            configured: EmailService.isConfigured,
            stats: emailStats
          },
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        }
      });
    } catch (error) {
      logger.error('Error getting security status', { 
        error: error.message,
        requestId: req.requestId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estado de seguridad',
        requestId: req.requestId
      });
    }
  });

  // NUEVA RUTA: Probar envío de email
  app.post('/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email es requerido',
          requestId: req.requestId
        });
      }

      const result = await EmailService.sendTestEmail(email);
      
      logger.info('Test email sent', {
        email,
        result,
        requestId: req.requestId
      });

      res.json({
        success: true,
        message: 'Email de prueba enviado exitosamente',
        data: result,
        requestId: req.requestId
      });
    } catch (error) {
      logger.error('Error sending test email', {
        error: error.message,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Error enviando email de prueba: ' + error.message,
        requestId: req.requestId
      });
    }
  });
}

// ========================================
// RUTAS DE LA API
// ========================================
app.use('/api/v1', routes);

// ========================================
// MANEJO DE ERRORES MEJORADO - FASE 5
// ========================================

// Middleware de manejo de errores específicos de seguridad
app.use((error, req, res, next) => {
  // Error de JSON malformado
  if (error.type === 'entity.parse.failed') {
    logger.error('JSON parse error', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
      error: error.message
    });
    
    return res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la petición',
      code: 'INVALID_JSON',
      requestId: req.requestId
    });
  }
  
  // Error de payload muy grande
  if (error.type === 'entity.too.large') {
    logger.error('Payload too large', {
      ip: req.ip,
      requestId: req.requestId,
      limit: '10mb'
    });
    
    return res.status(413).json({
      success: false,
      message: 'Payload demasiado grande (límite: 10MB)',
      code: 'PAYLOAD_TOO_LARGE',
      requestId: req.requestId
    });
  }
  
  // Rate limiting errors
  if (error.statusCode === 429) {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      requestId: req.requestId
    });
    
    return res.status(429).json({
      success: false,
      message: error.message || 'Demasiadas peticiones',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: error.retryAfter,
      requestId: req.requestId
    });
  }
  
  next(error);
});

// Capturar rutas no encontradas
app.use(notFoundHandler);

// Middleware global de errores (debe ser el último)
app.use(globalErrorHandler);

// ========================================
// CONFIGURACIÓN DE LIMPIEZA AUTOMÁTICA - FASE 5
// ========================================
const setupCleanupJobs = () => {
  // Limpiar datos de seguridad cada 30 minutos
  const cleanupInterval = setInterval(async () => {
    try {
      logger.info('Starting automatic security data cleanup');
      
      const securityCleanup = await AccountSecurityService.cleanupExpiredAttempts();
      const resetCleanup = await PasswordResetService.cleanupExpiredTokens();
      
      logger.info('Security cleanup completed', {
        deletedAttempts: securityCleanup.deletedAttempts || 0,
        deletedBlocks: securityCleanup.deletedBlocks || 0,
        deletedResetTokens: resetCleanup || 0
      });
    } catch (error) {
      logger.error('Error in automatic cleanup', { error: error.message });
    }
  }, 30 * 60 * 1000); // 30 minutos

  // Limpiar el interval en shutdown
  process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
    logger.info('Cleanup job stopped');
  });

  process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    logger.info('Cleanup job stopped');
  });

  logger.info('Security cleanup job scheduled (every 30 minutes)');
};

// ========================================
// INICIO DEL SERVIDOR MEJORADO
// ========================================
async function startServer() {
  try {
    // Inicializar servicios antes de arrancar el servidor
    await initializeServices();
    
    const server = app.listen(PORT, () => {
      const startMessage = `🚀 CheckNote Server iniciado correctamente`;
      const emailStatus = EmailService.isConfigured === true ? 'configurado (Resend)' : 
                         EmailService.isConfigured === 'simulation' ? 'simulación (desarrollo)' : 'no configurado';
      
      const details = {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        version: '1.5.0',
        features: 'Auth + Users + Tasks + Error Handling + Logging + Advanced Security + Email',
        timestamp: new Date().toISOString(),
        security: {
          rateLimiting: 'enabled',
          accountBlocking: 'enabled',
          passwordReset: 'enabled',
          emailService: emailStatus
        }
      };
      
      console.log(`🌐 Servidor disponible en: http://localhost:${PORT}`);
      console.log(`📖 Documentación Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`📋 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔒 Security Status: http://localhost:${PORT}/security-status`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Test Email: POST http://localhost:${PORT}/test-email`);
      }
      console.log('📋 Funcionalidades:');
      console.log('   ✅ Autenticación JWT + Bloqueo de cuentas');
      console.log('   ✅ CRUD Usuarios + Perfil completo');
      console.log('   ✅ CRUD Tareas + Filtros avanzados');
      console.log('   ✅ Manejo global de errores');
      console.log('   ✅ Logging avanzado');
      console.log('   ✅ Rate Limiting inteligente');
      console.log('   ✅ Recuperación de contraseñas');
      console.log(`   ${EmailService.isConfigured === true ? '✅' : EmailService.isConfigured === 'simulation' ? '⚠️' : '❌'} Servicio de email: ${emailStatus}`);
      
      logger.info(startMessage, details);
      
      // Iniciar trabajos de limpieza automática - FASE 5
      setupCleanupJobs();
    });

    // ========================================
    // MANEJO GRACEFUL SHUTDOWN MEJORADO - FASE 5
    // ========================================
    const gracefulShutdown = (signal) => {
      console.log(`\n📴 Señal ${signal} recibida. Cerrando servidor gracefully...`);
      logger.info(`Server shutdown initiated`, { 
        signal,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
      
      server.close(async () => {
        try {
          // Realizar limpieza final de datos de seguridad
          logger.info('Performing final security cleanup...');
          await AccountSecurityService.cleanupExpiredAttempts();
          await PasswordResetService.cleanupExpiredTokens();
          
          console.log('✅ Servidor y limpieza completados correctamente');
          logger.info('Server closed successfully with final cleanup');
          process.exit(0);
        } catch (error) {
          logger.error('Error during final cleanup', { error: error.message });
          console.log('⚠️ Servidor cerrado con advertencias en limpieza');
          process.exit(0);
        }
      });
      
      // Forzar cierre después de 15 segundos (más tiempo para limpieza)
      setTimeout(() => {
        console.error('❌ Forzando cierre del servidor');
        logger.error('Forcing server shutdown after timeout');
        process.exit(1);
      }, 15000);
    };

    // Escuchar señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    logger.error('Server startup failed', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  }
}

// ========================================
// MANEJO DE ERRORES NO CAPTURADOS MEJORADO
// ========================================
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { 
    error: error.message, 
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  console.error('💥 Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { 
    reason: reason.toString(), 
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  });
  console.error('💥 Promise rechazada no manejada:', reason);
  process.exit(1);
});

// INICIAR LA APLICACIÓN
startServer();

module.exports = app;