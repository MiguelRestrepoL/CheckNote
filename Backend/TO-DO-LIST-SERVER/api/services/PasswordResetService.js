
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// 🔒 ESQUEMA PARA TOKENS DE RECUPERACIÓN DE CONTRASEÑA
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

class PasswordResetService {
  // 🔒 GENERAR TOKEN DE RECUPERACIÓN
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

  // 🔒 VALIDAR TOKEN DE RECUPERACIÓN
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

  // 🔒 USAR TOKEN PARA CAMBIAR CONTRASEÑA
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

  // 🔒 LIMPIAR TOKENS EXPIRADOS
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

  // 🔒 OBTENER ESTADÍSTICAS DE RECUPERACIÓN
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

  // 🔒 INVALIDAR TODOS LOS TOKENS DE UN USUARIO
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

  // 🔒 VERIFICAR SI USUARIO PUEDE SOLICITAR RESET
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

  // 🔒 GENERAR CÓDIGO DE RECUPERACIÓN CORTO (alternativa a token largo)
  static generateShortCode() {
    // Generar código de 6 dígitos para usar como alternativa
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 🔒 VALIDAR FORMATO DE CONTRASEÑA PARA RESET
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