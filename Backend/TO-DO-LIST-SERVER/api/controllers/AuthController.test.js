const AuthController = require('../controllers/AuthController');
const UserDAO = require('../dao/UserDAO');
const AccountSecurityService = require('../services/AccountSecurityService');
const PasswordResetService = require('../services/PasswordResetService');
const EmailService = require('../services/EmailService');
const jwt = require('jsonwebtoken');

// Mock de todos los servicios y DAOs
jest.mock('../dao/UserDAO');
jest.mock('../services/AccountSecurityService');
jest.mock('../services/PasswordResetService');
jest.mock('../services/EmailService');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let authController;
  let mockReq;
  let mockRes;

  // Datos de usuarios de prueba
  const mockUsers = {
    miguel: {
      _id: '507f1f77bcf86cd799439011',
      nombres: 'Miguel',
      apellidos: 'Restrepo',
      correo: 'miguelrestrep0@gmail.com',
      edad: 22,
      comparePassword: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439011',
        nombres: 'Miguel',
        apellidos: 'Restrepo',
        correo: 'miguelrestrep0@gmail.com',
        edad: 22
      })
    },
    natalia: {
      _id: '507f1f77bcf86cd799439012',
      nombres: 'Natalia',
      apellidos: 'Gonzalez',
      correo: 'natagonzalez@gmail.com',
      edad: 20,
      comparePassword: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439012',
        nombres: 'Natalia',
        apellidos: 'Gonzalez',
        correo: 'natagonzalez@gmail.com',
        edad: 20
      })
    }
  };

  beforeEach(() => {
    authController = new AuthController();
    
    // Mock de request
    mockReq = {
      body: {},
      headers: {},
      ip: '192.168.1.100',
      connection: { remoteAddress: '192.168.1.100' },
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    // Mock de response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Variables de entorno para tests
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '2h';
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    // Limpiar todos los mocks
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('Debe hacer login exitosamente con credenciales válidas de Miguel', async () => {
      mockReq.body = {
        correo: 'miguelrestrep0@gmail.com',
        contrasena: 'Xddsmile123#'
      };

      const mockToken = 'mock-jwt-token-miguel';
      
      // Configurar mocks
      AccountSecurityService.isAccountBlocked.mockResolvedValue({ blocked: false });
      UserDAO.findByEmail.mockResolvedValue(mockUsers.miguel);
      mockUsers.miguel.comparePassword.mockResolvedValue(true);
      AccountSecurityService.recordLoginAttempt.mockResolvedValue({});
      jwt.sign.mockReturnValue(mockToken);

      await authController.login(mockReq, mockRes);

      expect(AccountSecurityService.isAccountBlocked).toHaveBeenCalledWith('miguelrestrep0@gmail.com');
      expect(UserDAO.findByEmail).toHaveBeenCalledWith('miguelrestrep0@gmail.com');
      expect(mockUsers.miguel.comparePassword).toHaveBeenCalledWith('Xddsmile123#');
      expect(AccountSecurityService.recordLoginAttempt).toHaveBeenCalledWith(
        'miguelrestrep0@gmail.com',
        '192.168.1.100',
        true,
        'Mozilla/5.0'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login exitoso',
        data: {
          token: mockToken,
          usuario: expect.objectContaining({
            nombres: 'Miguel',
            correo: 'miguelrestrep0@gmail.com'
          }),
          expiresIn: '2h'
        }
      });
    });

    test('Debe hacer login exitosamente con credenciales válidas de Natalia', async () => {
      mockReq.body = {
        correo: 'natagonzalez@gmail.com',
        contrasena: 'Unxdd123#'
      };

      const mockToken = 'mock-jwt-token-natalia';
      
      AccountSecurityService.isAccountBlocked.mockResolvedValue({ blocked: false });
      UserDAO.findByEmail.mockResolvedValue(mockUsers.natalia);
      mockUsers.natalia.comparePassword.mockResolvedValue(true);
      AccountSecurityService.recordLoginAttempt.mockResolvedValue({});
      jwt.sign.mockReturnValue(mockToken);

      await authController.login(mockReq, mockRes);

      expect(UserDAO.findByEmail).toHaveBeenCalledWith('natagonzalez@gmail.com');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login exitoso',
        data: expect.objectContaining({
          token: mockToken,
          usuario: expect.objectContaining({
            nombres: 'Natalia',
            correo: 'natagonzalez@gmail.com'
          })
        })
      });
    });

    test('Debe normalizar el email a minúsculas', async () => {
      mockReq.body = {
        correo: 'MIGUELRESTREP0@GMAIL.COM',
        contrasena: 'Xddsmile123#'
      };

      AccountSecurityService.isAccountBlocked.mockResolvedValue({ blocked: false });
      UserDAO.findByEmail.mockResolvedValue(mockUsers.miguel);
      mockUsers.miguel.comparePassword.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-token');

      await authController.login(mockReq, mockRes);

      expect(UserDAO.findByEmail).toHaveBeenCalledWith('miguelrestrep0@gmail.com');
    });

    test('Debe rechazar cuando falta el email', async () => {
      mockReq.body = {
        contrasena: 'Xddsmile123#'
      };

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    });

    test('Debe rechazar cuando falta la contraseña', async () => {
      mockReq.body = {
        correo: 'miguelrestrep0@gmail.com'
      };

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    });

    test('Debe rechazar login con cuenta bloqueada', async () => {
  mockReq.body = {
    correo: 'miguelrestrep0@gmail.com',
    contrasena: 'wrongpassword'
  };

  const blockStatus = {
    blocked: true,
    minutesLeft: 15,
    blockedUntil: new Date(Date.now() + 15 * 60 * 1000),
    reason: 'Demasiados intentos fallidos'
  };

  AccountSecurityService.isAccountBlocked.mockResolvedValue(blockStatus);
  UserDAO.findByEmail.mockResolvedValue(mockUsers.miguel);
  AccountSecurityService.recordLoginAttempt.mockResolvedValue({});
  EmailService.sendAccountBlockedEmail.mockResolvedValue({});

  await authController.login(mockReq, mockRes);

  expect(AccountSecurityService.recordLoginAttempt).toHaveBeenCalledWith(
    'miguelrestrep0@gmail.com',
    '192.168.1.100',
    false,
    'Mozilla/5.0'
  );
  expect(EmailService.sendAccountBlockedEmail).toHaveBeenCalledWith(
    'miguelrestrep0@gmail.com',
    'Miguel',
    15
  );
  expect(mockRes.status).toHaveBeenCalledWith(423);
  expect(mockRes.json).toHaveBeenCalledWith({
    success: false,
    message: 'Cuenta temporalmente bloqueada. Intenta de nuevo en 15 minutos.',
    error: 'ACCOUNT_LOCKED',
    details: {
      blockedUntil: blockStatus.blockedUntil,
      minutesLeft: 15,
      reason: 'Demasiados intentos fallidos'
    }
  });
});

    test('Debe rechazar con credenciales incorrectas - usuario no existe', async () => {
      mockReq.body = {
        correo: 'noexiste@gmail.com',
        contrasena: 'cualquierpass'
      };

      AccountSecurityService.isAccountBlocked.mockResolvedValue({ blocked: false });
      UserDAO.findByEmail.mockResolvedValue(null);
      AccountSecurityService.recordLoginAttempt.mockResolvedValue({});

      await authController.login(mockReq, mockRes);

      expect(AccountSecurityService.recordLoginAttempt).toHaveBeenCalledWith(
        'noexiste@gmail.com',
        '192.168.1.100',
        false,
        'Mozilla/5.0'
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciales incorrectas'
      });
    });

    test('Debe rechazar con contraseña incorrecta', async () => {
      mockReq.body = {
        correo: 'miguelrestrep0@gmail.com',
        contrasena: 'wrongpassword'
      };

      AccountSecurityService.isAccountBlocked.mockResolvedValue({ blocked: false });
      UserDAO.findByEmail.mockResolvedValue(mockUsers.miguel);
      mockUsers.miguel.comparePassword.mockResolvedValue(false);
      AccountSecurityService.recordLoginAttempt.mockResolvedValue({});

      await authController.login(mockReq, mockRes);

      expect(AccountSecurityService.recordLoginAttempt).toHaveBeenCalledWith(
        'miguelrestrep0@gmail.com',
        '192.168.1.100',
        false,
        'Mozilla/5.0'
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciales incorrectas'
      });
    });

    test('Debe manejar errores internos del servidor', async () => {
      mockReq.body = {
        correo: 'miguelrestrep0@gmail.com',
        contrasena: 'Xddsmile123#'
      };

      AccountSecurityService.isAccountBlocked.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('verifyToken', () => {
    test('Debe verificar token válido correctamente', async () => {
      const mockToken = 'valid-jwt-token';
      mockReq.headers.authorization = `Bearer ${mockToken}`;

      const mockDecoded = {
        userId: mockUsers.miguel._id,
        correo: mockUsers.miguel.correo,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7200
      };

      jwt.verify.mockReturnValue(mockDecoded);
      UserDAO.findById.mockResolvedValue(mockUsers.miguel);
      AccountSecurityService.isAccountBlocked.mockResolvedValue({ blocked: false });

      await authController.verifyToken(mockReq, mockRes);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret-key');
      expect(UserDAO.findById).toHaveBeenCalledWith(mockUsers.miguel._id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token válido',
        data: {
          usuario: mockUsers.miguel,
          tokenInfo: {
            issuedAt: expect.any(Date),
            expiresAt: expect.any(Date)
          }
        }
      });
    });

    test('Debe rechazar cuando no hay header de autorización', async () => {
      mockReq.headers = {};

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.verifyToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token no proporcionado',
        error: 'TOKEN_MISSING'
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe rechazar formato de token inválido (sin Bearer)', async () => {
      mockReq.headers.authorization = 'InvalidFormat token123';

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.verifyToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de token inválido',
        error: 'TOKEN_INVALID_FORMAT'
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe rechazar token vacío', async () => {
      mockReq.headers.authorization = 'Bearer ';

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.verifyToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o vacío',
        error: 'TOKEN_INVALID'
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe rechazar token "undefined" literal', async () => {
      mockReq.headers.authorization = 'Bearer undefined';

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.verifyToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o vacío',
        error: 'TOKEN_INVALID'
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe rechazar token expirado', async () => {
      mockReq.headers.authorization = 'Bearer expired-token';

      const expiredError = new Error('Token expirado');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.verifyToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expirado',
        error: 'TOKEN_EXPIRED'
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe rechazar token inválido', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      jwt.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.verifyToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido',
        error: 'TOKEN_INVALID'
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe rechazar cuando usuario no existe', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';

      jwt.verify.mockReturnValue({
        userId: '507f1f77bcf86cd799439099',
        correo: 'noexiste@gmail.com'
      });
      UserDAO.findById.mockResolvedValue(null);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.verifyToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe rechazar cuando cuenta está bloqueada', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';

      jwt.verify.mockReturnValue({
        userId: mockUsers.miguel._id,
        correo: mockUsers.miguel.correo
      });
      UserDAO.findById.mockResolvedValue(mockUsers.miguel);
      AccountSecurityService.isAccountBlocked.mockResolvedValue({ blocked: true });

      await authController.verifyToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(423);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cuenta temporalmente bloqueada',
        error: 'ACCOUNT_LOCKED'
      });
    });
  });

  describe('requestPasswordReset', () => {
    test('Debe solicitar recuperación de contraseña exitosamente para Miguel', async () => {
      mockReq.body = { correo: 'miguelrestrep0@gmail.com' };

      const mockResetData = {
        token: 'reset-token-miguel-12345',
        expiresAt: new Date(Date.now() + 3600000)
      };

      PasswordResetService.canRequestReset.mockResolvedValue({ canRequest: true });
      UserDAO.findByEmail.mockResolvedValue(mockUsers.miguel);
      PasswordResetService.generateResetToken.mockResolvedValue(mockResetData);
      EmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.requestPasswordReset(mockReq, mockRes);

      expect(PasswordResetService.canRequestReset).toHaveBeenCalledWith('miguelrestrep0@gmail.com');
      expect(UserDAO.findByEmail).toHaveBeenCalledWith('miguelrestrep0@gmail.com');
      expect(PasswordResetService.generateResetToken).toHaveBeenCalledWith(
        'miguelrestrep0@gmail.com',
        '192.168.1.100',
        'Mozilla/5.0'
      );
      expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'miguelrestrep0@gmail.com',
        mockResetData.token,
        'Miguel'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu email',
        data: expect.objectContaining({
          expiresAt: mockResetData.expiresAt
        })
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe solicitar recuperación para Natalia', async () => {
      mockReq.body = { correo: 'natagonzalez@gmail.com' };

      const mockResetData = {
        token: 'reset-token-natalia-67890',
        expiresAt: new Date(Date.now() + 3600000)
      };

      PasswordResetService.canRequestReset.mockResolvedValue({ canRequest: true });
      UserDAO.findByEmail.mockResolvedValue(mockUsers.natalia);
      PasswordResetService.generateResetToken.mockResolvedValue(mockResetData);
      EmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.requestPasswordReset(mockReq, mockRes);

      expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'natagonzalez@gmail.com',
        mockResetData.token,
        'Natalia'
      );

      consoleLogSpy.mockRestore();
    });

    test('Debe rechazar cuando falta el email', async () => {
      mockReq.body = {};

      await authController.requestPasswordReset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El email es requerido'
      });
    });

    test('Debe rechazar cuando hay demasiadas solicitudes', async () => {
      mockReq.body = { correo: 'miguelrestrep0@gmail.com' };

      const tooManyRequestsResult = {
        canRequest: false,
        recentRequests: 5,
        maxAllowed: 3,
        nextAllowedAt: new Date(Date.now() + 1800000)
      };

      PasswordResetService.canRequestReset.mockResolvedValue(tooManyRequestsResult);

      await authController.requestPasswordReset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Demasiadas solicitudes de recuperación. Intenta de nuevo más tarde.',
        error: 'TOO_MANY_REQUESTS',
        details: {
          recentRequests: 5,
          maxAllowed: 3,
          nextAllowedAt: tooManyRequestsResult.nextAllowedAt
        }
      });
    });

    test('Debe responder exitosamente aunque el usuario no exista (seguridad)', async () => {
      mockReq.body = { correo: 'noexiste@gmail.com' };

      PasswordResetService.canRequestReset.mockResolvedValue({ canRequest: true });
      UserDAO.findByEmail.mockResolvedValue(null);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.requestPasswordReset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Si el email existe, se ha enviado un enlace de recuperación'
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe manejar error al enviar email', async () => {
      mockReq.body = { correo: 'miguelrestrep0@gmail.com' };

      const mockResetData = {
        token: 'reset-token-12345',
        expiresAt: new Date(Date.now() + 3600000)
      };

      PasswordResetService.canRequestReset.mockResolvedValue({ canRequest: true });
      UserDAO.findByEmail.mockResolvedValue(mockUsers.miguel);
      PasswordResetService.generateResetToken.mockResolvedValue(mockResetData);
      EmailService.sendPasswordResetEmail.mockRejectedValue(new Error('SMTP error'));
      PasswordResetService.invalidateUserTokens.mockResolvedValue({});

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.requestPasswordReset(mockReq, mockRes);

      expect(PasswordResetService.invalidateUserTokens).toHaveBeenCalledWith('miguelrestrep0@gmail.com');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error enviando email de recuperación. Intenta de nuevo más tarde.'
      });

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('resetPassword', () => {
    test('Debe restablecer contraseña exitosamente', async () => {
      mockReq.body = {
        token: 'valid-reset-token',
        nuevaContrasena: 'NewPass123#',
        confirmarContrasena: 'NewPass123#'
      };

      const tokenResult = {
        success: true,
        email: 'miguelrestrep0@gmail.com'
      };

      PasswordResetService.validateNewPassword.mockReturnValue({
        valid: true,
        errors: []
      });
      PasswordResetService.useResetToken.mockResolvedValue(tokenResult);
      UserDAO.findByEmail.mockResolvedValue(mockUsers.miguel);
      UserDAO.updatePassword.mockResolvedValue({});
      PasswordResetService.invalidateUserTokens.mockResolvedValue({});
      AccountSecurityService.unblockAccount.mockResolvedValue({});
      EmailService.sendPasswordChangedConfirmation.mockResolvedValue({});

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.resetPassword(mockReq, mockRes);

      expect(PasswordResetService.validateNewPassword).toHaveBeenCalledWith('NewPass123#');
      expect(PasswordResetService.useResetToken).toHaveBeenCalledWith('valid-reset-token', 'NewPass123#');
      expect(UserDAO.updatePassword).toHaveBeenCalledWith(mockUsers.miguel._id, 'NewPass123#');
      expect(PasswordResetService.invalidateUserTokens).toHaveBeenCalledWith('miguelrestrep0@gmail.com');
      expect(AccountSecurityService.unblockAccount).toHaveBeenCalledWith('miguelrestrep0@gmail.com');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contraseña restablecida exitosamente',
        data: {
          email: 'miguelrestrep0@gmail.com',
          changedAt: expect.any(String)
        }
      });

      consoleLogSpy.mockRestore();
    });

    test('Debe rechazar cuando faltan campos requeridos', async () => {
      mockReq.body = {
        token: 'valid-token'
      };

      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token, nueva contraseña y confirmación son requeridos'
      });
    });

    test('Debe rechazar cuando las contraseñas no coinciden', async () => {
      mockReq.body = {
        token: 'valid-token',
        nuevaContrasena: 'NewPass123#',
        confirmarContrasena: 'Different123#'
      };

      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    });
     test('Debe rechazar contraseña que no cumple requisitos', async () => {
      mockReq.body = {
        token: 'valid-token',
        nuevaContrasena: 'weak',
        confirmarContrasena: 'weak'
      };

      PasswordResetService.validateNewPassword.mockReturnValue({
        valid: false,
        errors: ['La contraseña debe tener al menos 8 caracteres']
      });

      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La nueva contraseña no cumple con los requisitos de seguridad',
        errors: ['La contraseña debe tener al menos 8 caracteres']
      });
    });

    test('Debe rechazar token inválido o expirado', async () => {
      mockReq.body = {
        token: 'invalid-token',
        nuevaContrasena: 'NewPass123#',
        confirmarContrasena: 'NewPass123#'
      };

      PasswordResetService.validateNewPassword.mockReturnValue({
        valid: true,
        errors: []
      });
      PasswordResetService.useResetToken.mockResolvedValue({
        success: false,
        error: 'Token inválido o expirado'
      });

      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o expirado',
        error: 'INVALID_TOKEN'
      });
    });

    test('Debe retornar 404 cuando usuario no existe', async () => {
      mockReq.body = {
        token: 'valid-token',
        nuevaContrasena: 'NewPass123#',
        confirmarContrasena: 'NewPass123#'
      };

      PasswordResetService.validateNewPassword.mockReturnValue({
        valid: true,
        errors: []
      });
      PasswordResetService.useResetToken.mockResolvedValue({
        success: true,
        email: 'noexiste@gmail.com'
      });
      UserDAO.findByEmail.mockResolvedValue(null);

      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado'
      });
    });

    test('Debe continuar aunque falle el email de confirmación', async () => {
      mockReq.body = {
        token: 'valid-reset-token',
        nuevaContrasena: 'NewPass123#',
        confirmarContrasena: 'NewPass123#'
      };

      const tokenResult = {
        success: true,
        email: 'miguelrestrep0@gmail.com'
      };

      PasswordResetService.validateNewPassword.mockReturnValue({
        valid: true,
        errors: []
      });
      PasswordResetService.useResetToken.mockResolvedValue(tokenResult);
      UserDAO.findByEmail.mockResolvedValue(mockUsers.miguel);
      UserDAO.updatePassword.mockResolvedValue({});
      PasswordResetService.invalidateUserTokens.mockResolvedValue({});
      AccountSecurityService.unblockAccount.mockResolvedValue({});
      EmailService.sendPasswordChangedConfirmation.mockRejectedValue(new Error('Email error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await authController.resetPassword(mockReq, mockRes);

      // Debe responder exitosamente aunque el email falle
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contraseña restablecida exitosamente',
        data: {
          email: 'miguelrestrep0@gmail.com',
          changedAt: expect.any(String)
        }
      });

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    test('Debe manejar errores internos del servidor', async () => {
      mockReq.body = {
        token: 'valid-token',
        nuevaContrasena: 'NewPass123#',
        confirmarContrasena: 'NewPass123#'
      };

      PasswordResetService.validateNewPassword.mockReturnValue({
        valid: true,
        errors: []
      });
      PasswordResetService.useResetToken.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSecurityStats', () => {
    test('Debe obtener estadísticas de seguridad en modo desarrollo', async () => {
      process.env.NODE_ENV = 'development';

      const mockSecurityStats = {
        totalAttempts: 150,
        failedAttempts: 45,
        blockedAccounts: 3
      };

      const mockResetStats = {
        totalRequests: 20,
        expiredTokens: 5,
        usedTokens: 10
      };

      AccountSecurityService.getSecurityStats.mockResolvedValue(mockSecurityStats);
      PasswordResetService.getResetStats.mockResolvedValue(mockResetStats);

      await authController.getSecurityStats(mockReq, mockRes);

      expect(AccountSecurityService.getSecurityStats).toHaveBeenCalled();
      expect(PasswordResetService.getResetStats).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Estadísticas de seguridad obtenidas',
        data: {
          security: mockSecurityStats,
          passwordReset: mockResetStats,
          generatedAt: expect.any(String)
        }
      });
    });

    test('Debe rechazar acceso en modo producción', async () => {
      process.env.NODE_ENV = 'production';

      await authController.getSecurityStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acceso no autorizado'
      });
    });

    test('Debe manejar errores internos', async () => {
      process.env.NODE_ENV = 'development';

      AccountSecurityService.getSecurityStats.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await authController.getSecurityStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanupSecurityData', () => {
    test('Debe limpiar datos de seguridad en modo desarrollo', async () => {
      process.env.NODE_ENV = 'development';

      const mockSecurityCleanup = {
        deletedAttempts: 100,
        deletedBlocks: 5
      };

      const mockResetCleanup = 15;

      AccountSecurityService.cleanupExpiredAttempts.mockResolvedValue(mockSecurityCleanup);
      PasswordResetService.cleanupExpiredTokens.mockResolvedValue(mockResetCleanup);

      await authController.cleanupSecurityData(mockReq, mockRes);

      expect(AccountSecurityService.cleanupExpiredAttempts).toHaveBeenCalled();
      expect(PasswordResetService.cleanupExpiredTokens).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Limpieza de datos de seguridad completada',
        data: {
          securityRecordsDeleted: 105,
          resetTokensDeleted: 15,
          cleanedAt: expect.any(String)
        }
      });
    });

    test('Debe rechazar acceso en modo producción', async () => {
      process.env.NODE_ENV = 'production';

      await authController.cleanupSecurityData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acceso no autorizado'
      });
    });

    test('Debe manejar errores internos', async () => {
      process.env.NODE_ENV = 'development';

      AccountSecurityService.cleanupExpiredAttempts.mockRejectedValue(new Error('Cleanup error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await authController.cleanupSecurityData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });

      consoleErrorSpy.mockRestore();
    });
  });
});