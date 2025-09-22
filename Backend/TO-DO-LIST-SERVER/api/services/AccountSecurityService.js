// =================================
// ACCOUNT SECURITY SERVICE MEJORADO
// =================================

const mongoose = require('mongoose');

// Schemas (sin cambios)
const LoginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  ip: { type: String, required: true },
  success: { type: Boolean, default: false },
  attemptedAt: { type: Date, default: Date.now, expires: 600 }, // 10 min TTL
  userAgent: String,
  blocked: { type: Boolean, default: false }
});

const BlockedAccountSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, unique: true, index: true },
  blockedAt: { type: Date, default: Date.now },
  blockedUntil: { type: Date, required: true, index: true },
  attemptCount: { type: Number, default: 0 },
  reason: { 
    type: String, 
    enum: ['failed_login_attempts', 'suspicious_activity', 'manual_block'],
    default: 'failed_login_attempts'
  },
  ip: String
});

const LoginAttempt = mongoose.models.LoginAttempt || 
                    mongoose.model('LoginAttempt', LoginAttemptSchema);
const BlockedAccount = mongoose.models.BlockedAccount || 
                      mongoose.model('BlockedAccount', BlockedAccountSchema);

class AccountSecurityService {
  // CONFIGURACIÓN CENTRALIZADA
  static CONFIG = {
    MAX_FAILED_ATTEMPTS: 5,
    BLOCK_WINDOW_MINUTES: 10,
    BLOCK_DURATION_MINUTES: 30,
    MAX_BLOCK_ATTEMPTS_PER_DAY: 3 // Nuevo: límite de bloqueos por día
  };

  // VALIDACIÓN DE ENTRADA
  static validateInputs(email, ip) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Email inválido');
    }
    
    if (!ip || typeof ip !== 'string') {
      throw new Error('IP inválida');
    }
    
    return {
      email: email.toLowerCase().trim(),
      ip: ip.trim()
    };
  }

  // REGISTRAR INTENTO CON VALIDACIÓN MEJORADA
  static async recordLoginAttempt(email, ip, success, userAgent = null) {
    try {
      const { email: validEmail, ip: validIp } = this.validateInputs(email, ip);
      
      const attempt = new LoginAttempt({
        email: validEmail,
        ip: validIp,
        success,
        userAgent: userAgent ? userAgent.substring(0, 255) : null, // Limitar longitud
        attemptedAt: new Date()
      });
      
      await attempt.save();
      
      // Solo verificar bloqueo si falló
      if (!success) {
        const blocked = await this.checkAndBlockAccountSafe(validEmail, validIp);
        if (blocked) {
          console.warn(`CUENTA BLOQUEADA: ${validEmail} desde IP ${validIp}`);
        }
      } else {
        console.log(`Login exitoso: ${validEmail} desde ${validIp}`);
      }
      
      return attempt;
    } catch (error) {
      console.error('Error registrando intento de login:', error);
      throw error;
    }
  }

  // VERIFICACIÓN Y BLOQUEO CON PROTECCIÓN CONTRA RACE CONDITIONS
  static async checkAndBlockAccountSafe(email, ip) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const tenMinutesAgo = new Date(Date.now() - this.CONFIG.BLOCK_WINDOW_MINUTES * 60 * 1000);
        
        // Contar intentos fallidos con lock
        const failedAttempts = await LoginAttempt.countDocuments({
          email,
          success: false,
          attemptedAt: { $gte: tenMinutesAgo }
        }).session(session);

        console.log(`Intentos fallidos para ${email}: ${failedAttempts}/${this.CONFIG.MAX_FAILED_ATTEMPTS}`);

        if (failedAttempts >= this.CONFIG.MAX_FAILED_ATTEMPTS) {
          // Verificar si ya está bloqueado para evitar duplicados
          const existingBlock = await BlockedAccount.findOne({ 
            email,
            blockedUntil: { $gt: new Date() }
          }).session(session);

          if (existingBlock) {
            return false; // Ya estaba bloqueado
          }

          // Verificar límite diario de bloqueos
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const todayBlocks = await BlockedAccount.countDocuments({
            email,
            blockedAt: { $gte: todayStart }
          }).session(session);

          if (todayBlocks >= this.CONFIG.MAX_BLOCK_ATTEMPTS_PER_DAY) {
            console.warn(`Límite diario de bloqueos alcanzado para ${email}`);
            return false;
          }

          const blockedUntil = new Date(Date.now() + this.CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000);

          await BlockedAccount.findOneAndUpdate(
            { email },
            {
              email,
              blockedAt: new Date(),
              blockedUntil,
              attemptCount: failedAttempts,
              reason: 'failed_login_attempts',
              ip
            },
            { upsert: true, new: true, session }
          );

          // Marcar intentos como parte de bloqueo
          await LoginAttempt.updateMany(
            { 
              email,
              attemptedAt: { $gte: tenMinutesAgo }
            },
            { blocked: true },
            { session }
          );

          console.log(`CUENTA BLOQUEADA: ${email} hasta ${blockedUntil.toISOString()}`);
          return true;
        }

        return false;
      });
    } catch (error) {
      console.error('Error en verificación de bloqueo:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // VERIFICAR BLOQUEO CON CACHÉ SIMPLE
  static accountBlockCache = new Map();
  
  static async isAccountBlocked(email) {
    try {
      const { email: validEmail } = this.validateInputs(email, 'dummy');
      
      // Cache simple de 30 segundos para reducir consultas DB
      const cacheKey = `block_${validEmail}`;
      const cached = this.accountBlockCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < 30000) {
        return cached.result;
      }

      const blockedAccount = await BlockedAccount.findOne({
        email: validEmail,
        blockedUntil: { $gt: new Date() }
      });

      let result;
      if (blockedAccount) {
        const minutesLeft = Math.ceil((blockedAccount.blockedUntil - new Date()) / (1000 * 60));
        result = {
          blocked: true,
          blockedUntil: blockedAccount.blockedUntil,
          minutesLeft,
          reason: blockedAccount.reason,
          attemptCount: blockedAccount.attemptCount
        };
      } else {
        result = { blocked: false };
      }

      // Guardar en caché
      this.accountBlockCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Error verificando bloqueo:', error);
      return { blocked: false };
    }
  }

  // DESBLOQUEO CON LIMPIEZA DE CACHÉ
  static async unblockAccount(email) {
    try {
      const { email: validEmail } = this.validateInputs(email, 'dummy');
      
      const result = await BlockedAccount.deleteOne({ email: validEmail });
      
      if (result.deletedCount > 0) {
        // Limpiar caché
        this.accountBlockCache.delete(`block_${validEmail}`);
        console.log(`Cuenta desbloqueada: ${validEmail}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error desbloqueando cuenta:', error);
      throw error;
    }
  }

  // ESTADÍSTICAS MEJORADAS
  static async getSecurityStats(email = null) {
    try {
      const stats = {};
      
      if (email) {
        const { email: validEmail } = this.validateInputs(email, 'dummy');
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const [recentAttempts, blocked] = await Promise.all([
          LoginAttempt.find({
            email: validEmail,
            attemptedAt: { $gte: last24h }
          }).sort({ attemptedAt: -1 }).lean(),
          this.isAccountBlocked(validEmail)
        ]);

        stats.user = {
          email: validEmail,
          recentAttempts: recentAttempts.length,
          successfulAttempts: recentAttempts.filter(a => a.success).length,
          failedAttempts: recentAttempts.filter(a => !a.success).length,
          blocked: blocked.blocked,
          blockedUntil: blocked.blockedUntil || null,
          lastAttempt: recentAttempts[0]?.attemptedAt || null,
          uniqueIPs: [...new Set(recentAttempts.map(a => a.ip))].length
        };
      } else {
        const [totalAttempts, activeBlocks, todayAttempts] = await Promise.all([
          LoginAttempt.countDocuments(),
          BlockedAccount.countDocuments({ blockedUntil: { $gt: new Date() } }),
          LoginAttempt.countDocuments({ 
            attemptedAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
          })
        ]);

        stats.system = {
          totalAttempts,
          activeBlocks,
          todayAttempts,
          cacheSize: this.accountBlockCache.size
        };
      }

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // LIMPIEZA MEJORADA (solo para casos especiales)
  static async cleanupExpiredAttempts() {
    try {
      // MongoDB TTL ya maneja LoginAttempt, solo limpiar BlockedAccount expirados
      const deletedBlocks = await BlockedAccount.deleteMany({
        blockedUntil: { $lt: new Date() }
      });

      // Limpiar caché
      this.accountBlockCache.clear();

      console.log(`Limpieza: ${deletedBlocks.deletedCount} bloqueos expirados eliminados`);
      
      return {
        deletedAttempts: 0, // TTL se encarga
        deletedBlocks: deletedBlocks.deletedCount
      };
    } catch (error) {
      console.error('Error en limpieza:', error);
      throw error;
    }
  }
}

// =================================
// PASSWORD RESET SERVICE MEJORADO
// =================================

const crypto = require('crypto');

// Schema mejorado
const PasswordResetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // TTL 1 hora
  used: { type: Boolean, default: false },
  ip: String,
  userAgent: String,
  usedAt: Date,
  attempts: { type: Number, default: 0 } // Contador de intentos de uso
});

const PasswordResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);

class PasswordResetService {
  static CONFIG = {
    TOKEN_LENGTH: 32, // bytes
    TOKEN_EXPIRY_HOURS: 1,
    MAX_TOKENS_PER_HOUR: 5,
    MAX_USE_ATTEMPTS: 5,
  };

  // GENERAR TOKEN SEGURO
  static async generateResetToken(email, ip, userAgent = null) {
    try {
      if (!email || !email.includes('@')) {
        throw new Error('Email inválido');
      }

      email = email.toLowerCase().trim();
      
      // Limpiar tokens previos del usuario
      await PasswordResetToken.deleteMany({ 
        email, 
        used: false 
      });

      // Generar token criptográficamente seguro
      const tokenBytes = crypto.randomBytes(this.CONFIG.TOKEN_LENGTH);
      const token = tokenBytes.toString('hex');
      
      // Hash del token para BD
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Crear registro (sin almacenar token en texto plano)
      const resetToken = new PasswordResetToken({
        email,
        tokenHash,
        ip,
        userAgent: userAgent ? userAgent.substring(0, 255) : null,
        createdAt: new Date()
      });

      await resetToken.save();
      
      console.log(`Token de recuperación generado para: ${email}`);

      return {
        token, // Solo se devuelve, nunca se almacena
        expiresAt: new Date(Date.now() + this.CONFIG.TOKEN_EXPIRY_HOURS * 3600 * 1000),
        tokenId: resetToken._id
      };
    } catch (error) {
      console.error('Error generando token:', error);
      throw error;
    }
  }

  // VALIDAR TOKEN CON PROTECCIÓN CONTRA ATAQUES
  static async validateResetToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        return { valid: false, error: 'Token inválido' };
      }

      // Normalizar token (remover espacios, etc.)
      token = token.trim();
      
      if (token.length !== this.CONFIG.TOKEN_LENGTH * 2) { // Hex es 2x el tamaño
        return { valid: false, error: 'Token inválido' };
      }

      let tokenHash;
      try {
        tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      } catch (cryptoError) {
        return { valid: false, error: 'Token malformado' };
      }

      const resetToken = await PasswordResetToken.findOne({
        tokenHash,
        used: false,
        createdAt: { $gt: new Date(Date.now() - this.CONFIG.TOKEN_EXPIRY_HOURS * 3600 * 1000) }
      });

      if (!resetToken) {
        return { 
          valid: false, 
          error: 'Token inválido, expirado o ya utilizado' 
        };
      }

      // Verificar límite de intentos de uso
      if (resetToken.attempts >= this.CONFIG.MAX_USE_ATTEMPTS) {
        await PasswordResetToken.updateOne(
          { _id: resetToken._id },
          { used: true, usedAt: new Date() }
        );
        return {
          valid: false,
          error: 'Token bloqueado por demasiados intentos'
        };
      }

      return {
        valid: true,
        email: resetToken.email,
        tokenId: resetToken._id,
        createdAt: resetToken.createdAt,
        attempts: resetToken.attempts
      };
    } catch (error) {
      console.error('Error validando token:', error);
      return { valid: false, error: 'Error del servidor' };
    }
  }

  // USAR TOKEN CON TRANSACCIÓN
  static async useResetToken(token, newPassword) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const validation = await this.validateResetToken(token);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

        // Incrementar contador de intentos y marcar como usado
        const resetToken = await PasswordResetToken.findOneAndUpdate(
          { tokenHash, used: false },
          { 
            used: true, 
            usedAt: new Date(),
            $inc: { attempts: 1 }
          },
          { new: true, session }
        );

        if (!resetToken) {
          return { success: false, error: 'Token ya utilizado o inválido' };
        }

        console.log(`Token usado exitosamente: ${resetToken.email}`);

        return {
          success: true,
          email: resetToken.email,
          tokenId: resetToken._id
        };
      });
    } catch (error) {
      console.error('Error usando token:', error);
      return { success: false, error: 'Error del servidor' };
    } finally {
      await session.endSession();
    }
  }

  // VALIDACIÓN DE CONTRASEÑA MEJORADA
  static validateNewPassword(password) {
    const errors = [];

    if (!password || typeof password !== 'string') {
      errors.push('La contraseña es requerida');
      return { valid: false, errors };
    }

    const rules = [
      { test: password.length >= 8, message: 'Mínimo 8 caracteres' },
      { test: password.length <= 128, message: 'Máximo 128 caracteres' },
      { test: /[a-z]/.test(password), message: 'Al menos una minúscula' },
      { test: /[A-Z]/.test(password), message: 'Al menos una mayúscula' },
      { test: /\d/.test(password), message: 'Al menos un número' },
      { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), message: 'Al menos un carácter especial' }
    ];

    rules.forEach(rule => {
      if (!rule.test) errors.push(rule.message);
    });

    // Patrones débiles
    const weakPatterns = [
      { pattern: /(.)\1{3,}/, message: 'No debe tener caracteres repetidos consecutivos' },
      { pattern: /123456|abcdef|qwerty|password|admin/i, message: 'No debe contener palabras o secuencias comunes' }
    ];

    weakPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(password) && !errors.includes(message)) {
        errors.push(message);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  // CALCULAR FUERZA DE CONTRASEÑA
  static calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    if (password.length >= 16) score += 1;
    
    const levels = ['muy_débil', 'débil', 'regular', 'buena', 'fuerte', 'muy_fuerte'];
    return levels[Math.min(score, levels.length - 1)] || 'muy_débil';
  }

  // OTRAS FUNCIONES SIN CAMBIOS SIGNIFICATIVOS...
  static async canRequestReset(email) {
    try {
      if (!email || !email.includes('@')) {
        return { canRequest: false, error: 'Email inválido' };
      }

      const oneHourAgo = new Date(Date.now() - 3600 * 1000);
      email = email.toLowerCase().trim();
      
      const recentTokens = await PasswordResetToken.countDocuments({
        email,
        createdAt: { $gt: oneHourAgo }
      });

      const canRequest = recentTokens < this.CONFIG.MAX_TOKENS_PER_HOUR;

      return {
        canRequest,
        recentRequests: recentTokens,
        maxAllowed: this.CONFIG.MAX_TOKENS_PER_HOUR,
        nextAllowedAt: canRequest ? null : new Date(Date.now() + 3600 * 1000)
      };
    } catch (error) {
      console.error('Error verificando límite de reset:', error);
      return { canRequest: false, error: 'Error del servidor' };
    }
  }

  static async invalidateUserTokens(email) {
    try {
      if (!email) return 0;
      
      const result = await PasswordResetToken.updateMany(
        { email: email.toLowerCase().trim(), used: false },
        { used: true, usedAt: new Date() }
      );

      console.log(`Tokens invalidados para ${email}: ${result.modifiedCount}`);
      return result.modifiedCount;
    } catch (error) {
      console.error('Error invalidando tokens:', error);
      throw error;
    }
  }

  static async getResetStats(email = null) {
    try {
      const stats = {};

      if (email) {
        email = email.toLowerCase().trim();
        const userTokens = await PasswordResetToken.find({ email })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        stats.user = {
          email,
          totalRequests: userTokens.length,
          successfulResets: userTokens.filter(t => t.used).length,
          lastRequest: userTokens[0]?.createdAt || null,
          lastReset: userTokens.find(t => t.used)?.usedAt || null
        };
      } else {
        const [total, used, active] = await Promise.all([
          PasswordResetToken.countDocuments(),
          PasswordResetToken.countDocuments({ used: true }),
          PasswordResetToken.countDocuments({ 
            used: false,
            createdAt: { $gt: new Date(Date.now() - 3600 * 1000) }
          })
        ]);

        stats.system = {
          totalRequests: total,
          successfulResets: used,
          activeTokens: active,
          successRate: total > 0 ? ((used / total) * 100).toFixed(2) + '%' : '0%'
        };
      }

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  static async cleanupExpiredTokens() {
    try {
      // MongoDB TTL maneja la expiración, pero podemos limpiar tokens usados antiguos
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await PasswordResetToken.deleteMany({
        used: true,
        usedAt: { $lt: oneDayAgo }
      });

      console.log(`Tokens de recuperación limpiados: ${result.deletedCount}`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error limpiando tokens:', error);
      throw error;
    }
  }
}

module.exports = AccountSecurityService;