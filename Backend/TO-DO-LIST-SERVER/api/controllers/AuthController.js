// api/controllers/AuthController.js - VERSIÓN MEJORADA FASE 5
const GlobalController = require('./GlobalController');
const UserDAO = require('../dao/UserDAO');
const AccountSecurityService = require('../services/AccountSecurityService');
const PasswordResetService = require('../services/PasswordResetService');
const EmailService = require('../services/EmailService');
const jwt = require('jsonwebtoken');

class AuthController extends GlobalController {
  // 🔒 LOGIN CON SEGURIDAD AVANZADA
  async login(req, res) {
    try {
      const { correo, contrasena } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // 1. VALIDACIONES BÁSICAS
      if (!correo || !contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      const email = correo.toLowerCase().trim();

      // 2. VERIFICAR SI LA CUENTA ESTÁ BLOQUEADA
      const blockStatus = await AccountSecurityService.isAccountBlocked(email);
      if (blockStatus.blocked) {
        // Registrar intento en cuenta bloqueada
        await AccountSecurityService.recordLoginAttempt(email, ip, false, userAgent);
        
        // Enviar email de notificación si es el primer intento en cuenta bloqueada
        const user = await UserDAO.findByEmail(email);
        if (user) {
          await EmailService.sendAccountBlockedEmail(email, user.nombres, blockStatus.minutesLeft);
        }

        return res.status(423).json({ // 423 Locked
          success: false,
          message: `Cuenta temporalmente bloqueada. Intenta de nuevo en ${blockStatus.minutesLeft} minutos.`,
          error: 'ACCOUNT_LOCKED',
          details: {
            blockedUntil: blockStatus.blockedUntil,
            minutesLeft: blockStatus.minutesLeft,
            reason: blockStatus.reason
          }
        });
      }

      // 3. BUSCAR USUARIO
      const user = await UserDAO.findByEmail(email);
      if (!user) {
        // Registrar intento fallido (usuario no existe)
        await AccountSecurityService.recordLoginAttempt(email, ip, false, userAgent);
        
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // 4. VERIFICAR CONTRASEÑA
      const isPasswordValid = await user.comparePassword(contrasena);
      if (!isPasswordValid) {
        // Registrar intento fallido (contraseña incorrecta)
        await AccountSecurityService.recordLoginAttempt(email, ip, false, userAgent);
        
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // 5. LOGIN EXITOSO - REGISTRAR ÉXITO
      await AccountSecurityService.recordLoginAttempt(email, ip, true, userAgent);

      // 6. GENERAR JWT
      const token = jwt.sign(
        { 
          userId: user._id, 
          correo: user.correo,
          loginTime: new Date().toISOString()
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      );

      console.log(`✅ Login exitoso: ${email} desde IP: ${ip}`);

      return res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          usuario: user.toJSON(),
          expiresIn: process.env.JWT_EXPIRES_IN || '2h'
        }
      });
    } catch (error) {
      console.error('❌ Error en login:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 🔒 VERIFICAR TOKEN (sin cambios significativos)
  async verifyToken(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserDAO.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar si la cuenta no está bloqueada
      const blockStatus = await AccountSecurityService.isAccountBlocked(user.correo);
      if (blockStatus.blocked) {
        return res.status(423).json({
          success: false,
          message: 'Cuenta temporalmente bloqueada',
          error: 'ACCOUNT_LOCKED'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Token válido',
        data: { 
          usuario: user,
          tokenInfo: {
            issuedAt: new Date(decoded.iat * 1000),
            expiresAt: new Date(decoded.exp * 1000)
          }
        }
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
          error: 'TOKEN_EXPIRED'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
          error: 'TOKEN_INVALID'
        });
      }

      console.error('❌ Error verificando token:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 🔒 SOLICITAR RECUPERACIÓN DE CONTRASEÑA
  async requestPasswordReset(req, res) {
    try {
      const { correo } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // 1. VALIDAR EMAIL
      if (!correo) {
        return res.status(400).json({
          success: false,
          message: 'El email es requerido'
        });
      }

      const email = correo.toLowerCase().trim();

      // 2. VERIFICAR SI EL USUARIO PUEDE SOLICITAR RESET
      const canRequest = await PasswordResetService.canRequestReset(email);
      if (!canRequest.canRequest) {
        return res.status(429).json({
          success: false,
          message: `Demasiadas solicitudes de recuperación. Intenta de nuevo más tarde.`,
          error: 'TOO_MANY_REQUESTS',
          details: {
            recentRequests: canRequest.recentRequests,
            maxAllowed: canRequest.maxAllowed,
            nextAllowedAt: canRequest.nextAllowedAt
          }
        });
      }

      // 3. BUSCAR USUARIO
        const user = await UserDAO.findByEmail(email);
        console.log('🔍 USUARIO ENCONTRADO:', {
          exists: !!user,
          email: email,
          userName: user?.nombres
        });

        if (!user) {
          // Por seguridad, siempre responder con éxito aunque el usuario no exista
          return res.status(200).json({
            success: true,
            message: 'Si el email existe, se ha enviado un enlace de recuperación'
          });
        }

      // 4. GENERAR TOKEN DE RECUPERACIÓN
      const resetData = await PasswordResetService.generateResetToken(email, ip, userAgent);

      // 5. ENVIAR EMAIL DE RECUPERACIÓN
      try {
      console.log('🔍 INTENTANDO ENVIAR EMAIL:', {
        email,
        token: resetData.token.substring(0, 8) + '...',
        userName: user.nombres
      });
      
      const emailResult = await EmailService.sendPasswordResetEmail(email, resetData.token, user.nombres);
      
      console.log('📧 Email de recuperación enviado exitosamente:', emailResult);
      console.log(`📧 Email enviado a: ${email}`);
    } catch (emailError) {
      console.error('❌ Error enviando email de recuperación:', emailError);
      console.error('❌ Stack trace:', emailError.stack);
        
        // Si falla el email, eliminar el token generado
        await PasswordResetService.invalidateUserTokens(email);
        
        return res.status(500).json({
          success: false,
          message: 'Error enviando email de recuperación. Intenta de nuevo más tarde.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu email',
        data: {
          expiresAt: resetData.expiresAt,
          // En desarrollo, incluir información adicional
          ...(process.env.NODE_ENV === 'development' && {
            debug: {
              token: resetData.token,
              resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetData.token}`
            }
          })
        }
      });
    } catch (error) {
      console.error('❌ Error solicitando recuperación de contraseña:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 🔒 RESTABLECER CONTRASEÑA CON TOKEN
  async resetPassword(req, res) {
    try {
      const { token, nuevaContrasena, confirmarContrasena } = req.body;

      // 1. VALIDACIONES BÁSICAS
      if (!token || !nuevaContrasena || !confirmarContrasena) {
        return res.status(400).json({
          success: false,
          message: 'Token, nueva contraseña y confirmación son requeridos'
        });
      }

      if (nuevaContrasena !== confirmarContrasena) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden'
        });
      }

      // 2. VALIDAR FORMATO DE NUEVA CONTRASEÑA
      const passwordValidation = PasswordResetService.validateNewPassword(nuevaContrasena);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña no cumple con los requisitos de seguridad',
          errors: passwordValidation.errors
        });
      }

      // 3. USAR TOKEN Y OBTENER EMAIL
      const tokenResult = await PasswordResetService.useResetToken(token, nuevaContrasena);
      if (!tokenResult.success) {
        return res.status(400).json({
          success: false,
          message: tokenResult.error,
          error: 'INVALID_TOKEN'
        });
      }

      // 4. BUSCAR Y ACTUALIZAR USUARIO
      const user = await UserDAO.findByEmail(tokenResult.email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // 5. ACTUALIZAR CONTRASEÑA
      await UserDAO.updatePassword(user._id, nuevaContrasena);

      // 6. INVALIDAR TODOS LOS TOKENS DE RECUPERACIÓN DEL USUARIO
      await PasswordResetService.invalidateUserTokens(tokenResult.email);

      // 7. DESBLOQUEAR CUENTA SI ESTABA BLOQUEADA
      await AccountSecurityService.unblockAccount(tokenResult.email);

      // 8. ENVIAR EMAIL DE CONFIRMACIÓN
      try {
        await EmailService.sendPasswordChangedConfirmation(tokenResult.email, user.nombres);
      } catch (emailError) {
        console.error('❌ Error enviando email de confirmación:', emailError);
        // No fallar la operación si el email de confirmación falla
      }

      console.log(`✅ Contraseña restablecida exitosamente para: ${tokenResult.email}`);

      return res.status(200).json({
        success: true,
        message: 'Contraseña restablecida exitosamente',
        data: {
          email: tokenResult.email,
          changedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error restableciendo contraseña:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 🔒 OBTENER ESTADÍSTICAS DE SEGURIDAD (para debugging/monitoreo)
  async getSecurityStats(req, res) {
    try {
      // Solo en desarrollo o para admins futuros
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          success: false,
          message: 'Acceso no autorizado'
        });
      }

      const securityStats = await AccountSecurityService.getSecurityStats();
      const resetStats = await PasswordResetService.getResetStats();

      return res.status(200).json({
        success: true,
        message: 'Estadísticas de seguridad obtenidas',
        data: {
          security: securityStats,
          passwordReset: resetStats,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de seguridad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // 🔒 CLEANUP MANUAL DE DATOS DE SEGURIDAD
  async cleanupSecurityData(req, res) {
    try {
      // Solo en desarrollo
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          success: false,
          message: 'Acceso no autorizado'
        });
      }

      const securityCleanup = await AccountSecurityService.cleanupExpiredAttempts();
      const resetCleanup = await PasswordResetService.cleanupExpiredTokens();

      return res.status(200).json({
        success: true,
        message: 'Limpieza de datos de seguridad completada',
        data: {
          securityRecordsDeleted: securityCleanup.deletedAttempts + securityCleanup.deletedBlocks,
          resetTokensDeleted: resetCleanup,
          cleanedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error en limpieza de datos de seguridad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = AuthController;