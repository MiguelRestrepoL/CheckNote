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
// CONFIGURACIÓN DE SEGURIDAD AVANZADA
// ========================================
app.set('trust proxy', 1);

// ========================================
// DOCUMENTACIÓN SWAGGER
// ========================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

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
  
  logger.info('All services initialization completed');
}

// ========================================
// MIDDLEWARES EN ORDEN CORRECTO
// ========================================

// 1. CORS MANUAL - DEBE SER LO PRIMERO
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'https://check-note-fend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 2. Parseo de JSON - TEMPRANO para que esté disponible
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

// 4. Headers de seguridad
app.use((req, res, next) => {
  securityHeaders(req, res, () => {});
  
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

// 5. Tiempo de respuesta
app.use(responseTime);

// 6. Logging de requests
app.use(requestLogger);

// 7. Logging avanzado de eventos de seguridad
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
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

// 8. Rate limiting
app.use('/api', apiLimiter);


// ========================================
// CONFIGURACIÓN CORS MEJORADA PARA VERCEL
// ========================================

// Configuración CORS mejorada para múltiples entornos
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'https://check-note-fend.vercel.app',
  // Agregar todas las posibles URLs de Vercel de tu frontend
  'check-note-fend-7etgom6lz-miguels-projects-40b497cf.vercel.app ', // Reemplaza 'tu-usuario' con tu username de GitHub
  'check-note-fend-git-main-miguels-projects-40b497cf.vercel.app ', // Reemplaza 'tu-usuario' con tu username de GitHub
  // También incluir cualquier subdomain de preview que Vercel genere
  /^https:\/\/check-note-fend-[a-zA-Z0-9-]+\.vercel\.app$/,
  process.env.FRONTEND_URL,
].filter(Boolean); // Elimina valores undefined/null

console.log('🌐 Allowed CORS origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como aplicaciones móviles o Postman)
    if (!origin) {
      console.log('⚠️ Request without origin allowed (mobile app or API testing)');
      return callback(null, true);
    }
    
    // Verificar si el origin está en la lista de permitidos
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked for origin:', origin);
      console.log('📋 Allowed origins:', allowedOrigins.map(o => o.toString()));
      callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);

// 9. Detector de requests lentos
app.use(slowRequestDetector(2000));

// 10. Middleware adicional para debugging CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const method = req.method;
  const path = req.path;
  
  if (origin && (origin.includes('vercel.app') || origin.includes('localhost'))) {
    console.log(`🔍 Frontend request: ${method} ${path} from ${origin}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Request headers:', {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? '***PROVIDED***' : 'NONE',
        'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
        'referer': req.headers.referer
      });
    }
  }
  
  next();
});

// 11. Logging del body de requests (solo desarrollo)
app.use(requestBodyLogger);

// ========================================
// ENDPOINTS
// ========================================

// Endpoint para probar CORS
app.get('/cors-test', (req, res) => {
  const corsHeaders = {
    'access-control-allow-origin': res.getHeader('access-control-allow-origin'),
    'access-control-allow-credentials': res.getHeader('access-control-allow-credentials'),
    'access-control-allow-methods': res.getHeader('access-control-allow-methods'),
    'access-control-allow-headers': res.getHeader('access-control-allow-headers')
  };
  
  console.log('🧪 CORS test endpoint accessed from:', req.headers.origin);
  
  res.json({
    success: true,
    message: 'CORS working correctly! 🎉',
    data: {
      origin: req.headers.origin,
      method: req.method,
      timestamp: new Date().toISOString(),
      corsHeaders: corsHeaders,
      userAgent: req.headers['user-agent']?.substring(0, 100) + '...',
      requestId: req.requestId
    }
  });
});

// Health Check
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
    },
    cors: {
      allowedOrigins: allowedOrigins.length,
      requestOrigin: req.headers.origin || 'none'
    }
  };
  
  logger.info('Health check requested', { 
    uptime: healthCheck.uptime,
    requestId: req.requestId,
    emailService: healthCheck.security.emailService,
    origin: req.headers.origin
  });
  
  res.status(200).json({
    success: true,
    data: healthCheck
  });
});

// AGREGAR: Health check para API v1
app.get('/api/v1/health', (req, res) => {
  console.log('📋 Health check API v1 solicitado');
  
  const healthCheck = {
    uptime: process.uptime(),
    message: 'API OK',
    timestamp: new Date().toISOString(),
    version: '1.5.0',
    cors: 'enabled-fixed-order',
    api: 'operational'
  };
  
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
             emailSimulation ? '⚠️ Simulación (Desarrollo)' : '❌ No configurado',
      cors: '✅ Configurado para Vercel'
    },
    security: {
      rateLimiting: {
        api: '100 requests/15min',
        login: '5 attempts/10min',
        register: '3 attempts/hour',
        passwordReset: '3 attempts/hour'
      },
      accountBlocking: '5 failed attempts → 30min lock',
      passwordReset: 'Secure tokens + Email notifications',
      cors: {
        allowedOrigins: allowedOrigins.length,
        credentials: true,
        methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH'
      }
    },
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      corsTest: '/cors-test',
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
          cors: {
            allowedOrigins: allowedOrigins,
            totalOrigins: allowedOrigins.length
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
// MANEJO DE ERRORES
// ========================================

// Middleware de manejo de errores específicos de seguridad
app.use((error, req, res, next) => {
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
  
  if (error.message && error.message.includes('CORS')) {
    logger.error('CORS error', {
      ip: req.ip,
      origin: req.headers.origin,
      requestId: req.requestId,
      error: error.message
    });
    
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origen no permitido',
      code: 'CORS_ERROR',
      origin: req.headers.origin,
      requestId: req.requestId
    });
  }
  
  next(error);
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

// ========================================
// CONFIGURACIÓN DE LIMPIEZA AUTOMÁTICA
// ========================================
const setupCleanupJobs = () => {
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
  }, 30 * 60 * 1000);

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
// INICIO DEL SERVIDOR
// ========================================
async function startServer() {
  try {
    await initializeServices();
    
    const server = app.listen(PORT, () => {
      const startMessage = `🚀 CheckNote Server iniciado correctamente`;
      const emailStatus = EmailService.isConfigured === true ? 'configurado (Resend)' : 
                         EmailService.isConfigured === 'simulation' ? 'simulación (desarrollo)' : 'no configurado';
      
      const details = {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        version: '1.5.0',
        features: 'Auth + Users + Tasks + Error Handling + Logging + Advanced Security + Email + Enhanced CORS',
        timestamp: new Date().toISOString(),
        security: {
          rateLimiting: 'enabled',
          accountBlocking: 'enabled',
          passwordReset: 'enabled',
          emailService: emailStatus,
          cors: `${allowedOrigins.length} origins allowed`
        }
      };
      
      console.log(`🌐 Servidor disponible en: http://localhost:${PORT}`);
      console.log(`📖 Documentación Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`📋 Health Check: http://localhost:${PORT}/health`);
      console.log(`🧪 CORS Test: http://localhost:${PORT}/cors-test`);
      console.log(`📋 API Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🔒 Security Status: http://localhost:${PORT}/security-status`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Test Email: POST http://localhost:${PORT}/test-email`);
      }
      console.log('🌐 CORS configurado para:');
      allowedOrigins.forEach((origin, index) => {
        console.log(`   ${index + 1}. ${origin}`);
      });
      console.log('📋 Funcionalidades:');
      console.log('   ✅ Autenticación JWT + Bloqueo de cuentas');
      console.log('   ✅ CRUD Usuarios + Perfil completo');
      console.log('   ✅ CRUD Tareas + Filtros avanzados');
      console.log('   ✅ Manejo global de errores');
      console.log('   ✅ Logging avanzado');
      console.log('   ✅ Rate Limiting inteligente');
      console.log('   ✅ Recuperación de contraseñas');
      console.log('   ✅ CORS manual + library en orden correcto');
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
// MANEJO DE ERRORES NO CAPTURADOS
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

startServer();

module.exports = app;
