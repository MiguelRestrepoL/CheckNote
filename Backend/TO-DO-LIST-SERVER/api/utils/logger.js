// api/utils/logger.js

const fs = require('fs');
const path = require('path');

/**
 * Logger personalizado para la aplicación
 * Niveles: ERROR, WARN, INFO, DEBUG
 */
class Logger {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = process.env.LOG_LEVEL || 'INFO';
    this.logsDir = path.join(process.cwd(), 'logs');
    
    this.ensureLogDirectory();
  }
  
  ensureLogDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }
  
  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.currentLevel];
  }
  
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development'
    });
  }
  
  writeToFile(level, formattedMessage) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-${level.toLowerCase()}.log`;
    const filepath = path.join(this.logsDir, filename);
    
    fs.appendFile(filepath, formattedMessage + '\n', (err) => {
      if (err) {
        console.error('Error escribiendo al archivo de log:', err);
      }
    });
    
    // Log general para todos los niveles
    const generalFilepath = path.join(this.logsDir, `${date}-app.log`);
    fs.appendFile(generalFilepath, formattedMessage + '\n', (err) => {
      if (err) {
        console.error('Error escribiendo al archivo de log general:', err);
      }
    });
  }
  
  logToConsole(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const colors = {
      ERROR: '\x1b[31m', // Rojo
      WARN: '\x1b[33m',  // Amarillo
      INFO: '\x1b[36m',  // Cian
      DEBUG: '\x1b[37m'  // Blanco
    };
    const reset = '\x1b[0m';
    
    const color = colors[level] || reset;
    const prefix = `${color}[${timestamp}] ${level}:${reset}`;
    
    console.log(`${prefix} ${message}`);
    if (Object.keys(meta).length > 0) {
      console.log(`${color}META:${reset}`, meta);
    }
  }
  
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Log a consola en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      this.logToConsole(level, message, meta);
    }
    
    // Siempre escribir a archivo
    this.writeToFile(level, formattedMessage);
  }
  
  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }
  
  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }
  
  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }
  
  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }
  
  // Métodos específicos para diferentes contextos
  
  logRequest(req, res) {
    const meta = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user ? req.user._id : 'anonymous',
      statusCode: res.statusCode,
      responseTime: res.locals.responseTime || null
    };
    
    this.info(`${req.method} ${req.url}`, meta);
  }
  
  logError(error, req = null) {
    const meta = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      }
    };
    
    if (req) {
      meta.request = {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user ? req.user._id : 'anonymous'
      };
    }
    
    this.error(`Error: ${error.message}`, meta);
  }
  
  logDatabaseOperation(operation, collection, duration, success = true) {
    const meta = {
      operation,
      collection,
      duration: `${duration}ms`,
      success
    };
    
    if (success) {
      this.debug(`DB Operation: ${operation} on ${collection}`, meta);
    } else {
      this.error(`DB Operation Failed: ${operation} on ${collection}`, meta);
    }
  }
  
  logAuthentication(userId, success, reason = null) {
    const meta = {
      userId,
      success,
      reason
    };
    
    if (success) {
      this.info('Authentication successful', meta);
    } else {
      this.warn('Authentication failed', meta);
    }
  }
}

// Instancia singleton
const logger = new Logger();

module.exports = logger;