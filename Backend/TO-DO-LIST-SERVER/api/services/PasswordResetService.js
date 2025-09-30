
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Mongoose schema for password reset tokens
 * @private
 */
const PasswordResetTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // TTL: 1 hora
  },
  used: {
    type: Boolean,
    default: false
  },
  ip: String,
  userAgent: String,
  usedAt: Date
});

const PasswordResetToken = mongoose.models.PasswordResetToken || 
                          mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
/**
 * Service for secure password reset token management
 * Implements cryptographically secure token generation using SHA-256 hashing
 * Tokens expire after 1 hour and can only be used once
 * Includes rate limiting to prevent abuse
 */
class PasswordResetService {
  /**
   * Generate cryptographically secure password reset token
   * Only one active token allowed per user at a time
   * @async
   * @static
   * @param {string} email - User's email address
   * @param {string} ip - Client IP address
   * @param {string} [userAgent=null] - Client user agent string
   * @returns {Promise<Object>} Token information
   * @returns {string} returns.token - Reset token (64 char hex string, only returned once)
   * @returns {Date} returns.expiresAt - Token expiration timestamp (1 hour from creation)
   * @returns {string} returns.tokenId - MongoDB document ID
   * @throws {Error} When database operation fails
   * @description Token is stored as SHA-256 hash in database. Plain token removed after initial save.
   */
  static async generateResetToken(email, ip, userAgent = null) {
    try {
      email = email.toLowerCase();
      
      // Limpiar tokens previos del usuario (solo uno activo por vez)
      await PasswordResetToken.deleteMany({ 
        email, 
        used: false 
      });

      // Generar token seguro de 32 bytes (256 bits)
      const token = crypto.randomBytes(32).toString('hex');
      
      // Hash del token para almacenar en BD (nunca almacenar tokens en texto plano)
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Crear registro de token
      const resetToken = new PasswordResetToken({
        email,
        token: token, // Solo para devolución inmediata
        tokenHash,
        ip,
        userAgent,
        createdAt: new Date()
      });

      await resetToken.save();
      
      console.log(`🔑 Token de recuperación generado para: ${email}`);
      
      // Devolver el token en texto plano (se enviará por email)
      // El token en BD se elimina después de guardarlo
      await PasswordResetToken.updateOne(
        { _id: resetToken._id },
        { $unset: { token: 1 } } // Eliminar token en texto plano de BD
      );

      return {
        token,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hora
        tokenId: resetToken._id
      };
    } catch (error) {
      console.error('❌ Error generando token de recuperación:', error);
      throw error;
    }
  }

  /**
   * Validate password reset token without consuming it
   * @async
   * @static
   * @param {string} token - Reset token to validate (64 char hex string)
   * @returns {Promise<Object>} Validation result
   * @returns {boolean} returns.valid - Whether token is valid
   * @returns {string} [returns.email] - Email associated with token (if valid)
   * @returns {string} [returns.tokenId] - Token document ID (if valid)
   * @returns {Date} [returns.createdAt] - Token creation timestamp (if valid)
   * @returns {string} [returns.error] - Error message (if invalid)
   * @description Checks token format, hash match, expiration, and usage status
   */
  static async validateResetToken(token) {
    try {
      if (!token || token.length !== 64) { // Token debe ser 64 caracteres hex
        return { valid: false, error: 'Token inválido' };
      }

      // Hash del token recibido
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Buscar token en BD
      const resetToken = await PasswordResetToken.findOne({
        tokenHash,
        used: false,
        createdAt: { $gt: new Date(Date.now() - 3600 * 1000) } // No expirado
      });

      if (!resetToken) {
        return { 
          valid: false, 
          error: 'Token inválido, expirado o ya utilizado' 
        };
      }

      return {
        valid: true,
        email: resetToken.email,
        tokenId: resetToken._id,
        createdAt: resetToken.createdAt
      };
    } catch (error) {
      console.error('❌ Error validando token de recuperación:', error);
      return { valid: false, error: 'Error del servidor' };
    }
  }

  /**
   * Use password reset token to authorize password change
   * Marks token as used to prevent reuse
   * @async
   * @static
   * @param {string} token - Reset token (64 char hex string)
   * @param {string} newPassword - New password (validation performed by calling code)
   * @returns {Promise<Object>} Usage result
   * @returns {boolean} returns.success - Whether token was successfully consumed
   * @returns {string} [returns.email] - Email associated with token (if success)
   * @returns {string} [returns.tokenId] - Token document ID (if success)
   * @returns {string} [returns.error] - Error message (if failed)
   * @throws {Error} When database operation fails
   * @description Token can only be used once. Validates before marking as used.
   */
  static async useResetToken(token, newPassword) {
    try {
      // Validar token primero
      const validation = await this.validateResetToken(token);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Hash del token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Marcar token como usado
      const resetToken = await PasswordResetToken.findOneAndUpdate(
        { tokenHash, used: false },
        { 
          used: true, 
          usedAt: new Date() 
        },
        { new: true }
      );

      if (!resetToken) {
        return {
          success: false,
          error: 'Token ya utilizado o inválido'
        };
      }

      console.log(`✅ Token usado para cambio de contraseña: ${resetToken.email}`);

      return {
        success: true,
        email: resetToken.email,
        tokenId: resetToken._id
      };
    } catch (error) {
      console.error('❌ Error usando token de recuperación:', error);
      return {
        success: false,
        error: 'Error del servidor'
      };
    }
  }

  /**
   * Clean up expired and old used tokens
   * @async
   * @static
   * @returns {Promise<number>} Number of tokens deleted
   * @throws {Error} When database operation fails
   * @description Removes used tokens older than 24h and expired unused tokens
   */
  static async cleanupExpiredTokens() {
    try {
      const result = await PasswordResetToken.deleteMany({
        $or: [
          { used: true, usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Usados hace más de 24h
          { createdAt: { $lt: new Date(Date.now() - 3600 * 1000) } } // Expirados (más de 1h)
        ]
      });

      console.log(`🧹 Tokens de recuperación limpiados: ${result.deletedCount}`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error limpiando tokens expirados:', error);
      throw error;
    }
  }

   /**
   * Get password reset statistics for system or specific user
   * @async
   * @static
   * @param {string} [email=null] - Email for user-specific stats, null for system stats
   * @returns {Promise<Object>} Statistics object
   * @returns {Object} [returns.user] - User-specific statistics (if email provided)
   * @returns {string} returns.user.email - User email
   * @returns {number} returns.user.totalRequests - Total reset requests
   * @returns {number} returns.user.successfulResets - Completed resets
   * @returns {Date} returns.user.lastRequest - Most recent request timestamp
   * @returns {Date} returns.user.lastReset - Most recent successful reset timestamp
   * @returns {Object} [returns.system] - System-wide statistics (if no email)
   * @returns {number} returns.system.totalRequests - Total reset requests
   * @returns {number} returns.system.successfulResets - Total successful resets
   * @returns {number} returns.system.activeTokens - Currently valid unused tokens
   * @returns {number} returns.system.successRate - Success rate percentage
   * @throws {Error} When database operation fails
   */
  static async getResetStats(email = null) {
    try {
      const stats = {};

      if (email) {
        // Estadísticas específicas de usuario
        const userTokens = await PasswordResetToken.find({
          email: email.toLowerCase()
        }).sort({ createdAt: -1 }).limit(10);

        stats.user = {
          email,
          totalRequests: userTokens.length,
          successfulResets: userTokens.filter(t => t.used).length,
          lastRequest: userTokens[0]?.createdAt || null,
          lastReset: userTokens.find(t => t.used)?.usedAt || null
        };
      } else {
        // Estadísticas del sistema
        const total = await PasswordResetToken.countDocuments();
        const used = await PasswordResetToken.countDocuments({ used: true });
        const active = await PasswordResetToken.countDocuments({ 
          used: false,
          createdAt: { $gt: new Date(Date.now() - 3600 * 1000) }
        });

        stats.system = {
          totalRequests: total,
          successfulResets: used,
          activeTokens: active,
          successRate: total > 0 ? ((used / total) * 100).toFixed(2) : 0
        };
      }

      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de recuperación:', error);
      throw error;
    }
  }

  /**
   * Invalidate all unused tokens for a user
   * @async
   * @static
   * @param {string} email - User's email address
   * @returns {Promise<number>} Number of tokens invalidated
   * @throws {Error} When database operation fails
   * @description Called after successful password change or suspicious activity
   */
  static async invalidateUserTokens(email) {
    try {
      const result = await PasswordResetToken.updateMany(
        { email: email.toLowerCase(), used: false },
        { used: true, usedAt: new Date() }
      );

      console.log(`🚫 Tokens invalidados para ${email}: ${result.modifiedCount}`);
      return result.modifiedCount;
    } catch (error) {
      console.error('❌ Error invalidando tokens de usuario:', error);
      throw error;
    }
  }

  /**
   * Check if user can request password reset (rate limiting)
   * @async
   * @static
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Rate limit status
   * @returns {boolean} returns.canRequest - Whether new request is allowed
   * @returns {number} returns.recentRequests - Number of requests in last hour
   * @returns {number} returns.maxAllowed - Maximum allowed requests (3 per hour)
   * @returns {Date} [returns.nextAllowedAt] - When next request will be allowed (if blocked)
   * @description Limits users to 3 reset requests per hour to prevent abuse
   */
  static async canRequestReset(email) {
    try {
      const oneHourAgo = new Date(Date.now() - 3600 * 1000);
      
      // Contar tokens activos del usuario en la última hora
      const recentTokens = await PasswordResetToken.countDocuments({
        email: email.toLowerCase(),
        createdAt: { $gt: oneHourAgo }
      });

      // Permitir máximo 3 tokens por hora por usuario
      const maxTokensPerHour = 3;
      const canRequest = recentTokens < maxTokensPerHour;

      return {
        canRequest,
        recentRequests: recentTokens,
        maxAllowed: maxTokensPerHour,
        nextAllowedAt: canRequest ? null : new Date(Date.now() + 3600 * 1000)
      };
    } catch (error) {
      console.error('❌ Error verificando si puede solicitar reset:', error);
      return { canRequest: false };
    }
  }

   /**
   * Generate short 6-digit recovery code as alternative to token
   * @static
   * @returns {string} 6-digit numeric code
   * @description Alternative authentication method for SMS or similar use cases
   */
  static generateShortCode() {
    // Generar código de 6 dígitos para usar como alternativa
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate new password against security requirements
   * @static
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   * @returns {boolean} returns.valid - Whether password meets all requirements
   * @returns {string[]} returns.errors - Array of validation error messages
   * @description Requirements: 8-128 chars, lowercase, uppercase, number, special char, no weak patterns
   */
  static validateNewPassword(password) {
    const errors = [];

    if (!password) {
      errors.push('La contraseña es requerida');
      return { valid: false, errors };
    }

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (password.length > 128) {
      errors.push('La contraseña no puede exceder 128 caracteres');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial');
    }

    // Verificar patrones comunes débiles
    const weakPatterns = [
      /(.)\1{3,}/, // Caracteres repetidos
      /123456|abcdef|qwerty/i, // Secuencias comunes
      /password|123456|admin|user/i // Palabras comunes
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        errors.push('La contraseña contiene patrones muy comunes o repetitivos');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = PasswordResetService;
