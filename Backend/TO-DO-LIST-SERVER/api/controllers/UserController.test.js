const UserController = require('../controllers/UserController');
const UserDAO = require('../dao/UserDAO');

// Mock del UserDAO
jest.mock('../dao/UserDAO');

describe('UserController', () => {
  let userController;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    userController = new UserController();
    
    // Mock de request
    mockReq = {
      body: {},
      user: {}
    };

    // Mock de response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validUserData = {
      nombres: 'Miguel',
      apellidos: 'Restrepo',
      edad: 22,
      correo: 'miguelrestrep0@gmail.com',
      contrasena: 'Xddsmile123#', // Contraseña con mayúscula
      confirmarContrasena: 'Xddsmile123#'
    };

    test('Debe crear un usuario exitosamente con datos válidos', async () => {
      mockReq.body = validUserData;

      const mockCreatedUser = {
        id: '507f1f77bcf86cd799439011',
        nombres: 'Miguel',
        apellidos: 'Restrepo',
        edad: 22,
        correo: 'miguelrestrep0@gmail.com',
        createdAt: new Date()
      };

      UserDAO.emailExists.mockResolvedValue(false);
      UserDAO.createUser.mockResolvedValue(mockCreatedUser);

      await userController.create(mockReq, mockRes);

      expect(UserDAO.emailExists).toHaveBeenCalledWith('miguelrestrep0@gmail.com');
      expect(UserDAO.createUser).toHaveBeenCalledWith({
        nombres: 'Miguel',
        apellidos: 'Restrepo',
        edad: 22,
        correo: 'miguelrestrep0@gmail.com',
        contrasena: 'Xddsmile123#'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario creado exitosamente',
        id: mockCreatedUser.id,
        user: expect.objectContaining({
          id: mockCreatedUser.id,
          nombres: 'Miguel',
          apellidos: 'Restrepo',
          edad: 22,
          correo: 'miguelrestrep0@gmail.com'
        })
      });
    });

    test('Debe crear usuario y normalizar correo a minúsculas', async () => {
      mockReq.body = {
        ...validUserData,
        correo: 'MIGUELRESTREP0@GMAIL.COM'
      };

      UserDAO.emailExists.mockResolvedValue(false);
      UserDAO.createUser.mockResolvedValue({
        id: '507f1f77bcf86cd799439011',
        correo: 'miguelrestrep0@gmail.com'
      });

      await userController.create(mockReq, mockRes);

      expect(UserDAO.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          correo: 'miguelrestrep0@gmail.com'
        })
      );
    });

    test('Debe rechazar cuando faltan campos requeridos', async () => {
      mockReq.body = {
        nombres: 'Miguel',
        apellidos: 'Restrepo'
      };

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Todos los campos son requeridos',
        required: ['nombres', 'apellidos', 'edad', 'correo', 'contrasena', 'confirmarContrasena']
      });
    });

    test('Debe rechazar cuando las contraseñas no coinciden', async () => {
      mockReq.body = {
        nombres: 'Natalia',
        apellidos: 'Gonzalez',
        edad: 20,
        correo: 'natagonzalez@gmail.com',
        contrasena: 'Unxdd123#',
        confirmarContrasena: 'Diferente123#'
      };

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Las contraseñas no coinciden',
        error: 'confirmar_contrasena_no_coincide'
      });
    });

    test('Debe rechazar cuando el correo ya existe', async () => {
      mockReq.body = validUserData;
      UserDAO.emailExists.mockResolvedValue(true);

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    });

    test('Debe rechazar cuando la edad es menor a 13 años', async () => {
      mockReq.body = {
        ...validUserData,
        edad: 12
      };

      UserDAO.emailExists.mockResolvedValue(false);

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La edad debe ser mayor o igual a 13 años'
      });
    });

    test('Debe rechazar contraseña sin mayúscula', async () => {
      mockReq.body = {
        ...validUserData,
        contrasena: 'xddsmile123#',
        confirmarContrasena: 'xddsmile123#'
      };

      UserDAO.emailExists.mockResolvedValue(false);

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Contraseña no válida',
        errors: ['La contraseña debe contener al menos una letra mayúscula']
      });
    });

    test('Debe rechazar contraseña sin carácter especial', async () => {
      mockReq.body = {
        ...validUserData,
        contrasena: 'Xddsmile123',
        confirmarContrasena: 'Xddsmile123'
      };

      UserDAO.emailExists.mockResolvedValue(false);

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Contraseña no válida',
        errors: ['La contraseña debe contener al menos un carácter especial']
      });
    });

    test('Debe rechazar contraseña sin número', async () => {
      mockReq.body = {
        ...validUserData,
        contrasena: 'Xddsmile#',
        confirmarContrasena: 'Xddsmile#'
      };

      UserDAO.emailExists.mockResolvedValue(false);

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Contraseña no válida',
        errors: ['La contraseña debe contener al menos un número']
      });
    });

    test('Debe rechazar contraseña menor a 8 caracteres', async () => {
      mockReq.body = {
        ...validUserData,
        contrasena: 'Xdd12#',
        confirmarContrasena: 'Xdd12#'
      };

      UserDAO.emailExists.mockResolvedValue(false);

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Contraseña no válida',
        errors: ['La contraseña debe tener al menos 8 caracteres']
      });
    });

    test('Debe manejar errores de validación de Mongoose', async () => {
      // Usar datos válidos para pasar las validaciones del controlador
      mockReq.body = validUserData;
      UserDAO.emailExists.mockResolvedValue(false);

      const mockValidationError = {
        name: 'ValidationError',
        errors: {
          nombres: { message: 'Nombres es requerido' },
          correo: { message: 'Correo inválido' }
        }
      };

      UserDAO.createUser.mockRejectedValue(mockValidationError);

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: ['Nombres es requerido', 'Correo inválido']
      });
    });

    test('Debe manejar error de correo duplicado de MongoDB', async () => {
      mockReq.body = validUserData;
      UserDAO.emailExists.mockResolvedValue(false);

      const mockDuplicateError = {
        code: 11000
      };

      UserDAO.createUser.mockRejectedValue(mockDuplicateError);

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    });

    test('Debe manejar errores internos del servidor', async () => {
      mockReq.body = validUserData;
      UserDAO.emailExists.mockResolvedValue(false);
      UserDAO.createUser.mockRejectedValue(new Error('Error desconocido'));

      await userController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });
  });

  describe('getProfile', () => {
    test('Debe obtener el perfil del usuario autenticado', async () => {
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = { _id: userId };

      const mockUserStats = {
        _id: userId,
        nombres: 'Miguel',
        apellidos: 'Restrepo',
        edad: 22,
        correo: 'miguelrestrep0@gmail.com',
        createdAt: new Date()
      };

      UserDAO.getUserStats.mockResolvedValue(mockUserStats);

      await userController.getProfile(mockReq, mockRes);

      expect(UserDAO.getUserStats).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: mockUserStats
      });
    });

    test('Debe retornar 404 cuando el usuario no existe', async () => {
      mockReq.user = { _id: '507f1f77bcf86cd799439011' };
      UserDAO.getUserStats.mockResolvedValue(null);

      await userController.getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado'
      });
    });

    test('Debe manejar errores internos', async () => {
      mockReq.user = { _id: '507f1f77bcf86cd799439011' };
      UserDAO.getUserStats.mockRejectedValue(new Error('Database error'));

      // Suprimir console.error para este test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await userController.getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor. Intenta de nuevo más tarde.'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateProfile', () => {
    const userId = '507f1f77bcf86cd799439011';

    beforeEach(() => {
      mockReq.user = { _id: userId };
    });

    test('Debe actualizar datos básicos del usuario', async () => {
      mockReq.body = {
        nombres: 'Natalia',
        apellidos: 'Gonzalez',
        edad: 21
      };

      const mockUpdatedUser = {
        _id: userId,
        nombres: 'Natalia',
        apellidos: 'Gonzalez',
        edad: 21,
        correo: 'natagonzalez@gmail.com'
      };

      UserDAO.updateUser.mockResolvedValue(mockUpdatedUser);
      UserDAO.getUserStats.mockResolvedValue(mockUpdatedUser);

      await userController.updateProfile(mockReq, mockRes);

      expect(UserDAO.updateUser).toHaveBeenCalledWith(userId, {
        nombres: 'Natalia',
        apellidos: 'Gonzalez',
        edad: 21
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: mockUpdatedUser
      });
    });

    test('Debe rechazar cuando no se proporciona ningún campo', async () => {
      mockReq.body = {};

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    });

    test('Debe rechazar nombres con menos de 2 caracteres', async () => {
      mockReq.body = { nombres: 'M' };

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre debe tener entre 2 y 50 caracteres'
      });
    });

    test('Debe rechazar apellidos con menos de 2 caracteres', async () => {
      mockReq.body = { apellidos: 'R' };

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Los apellidos deben tener entre 2 y 50 caracteres'
      });
    });

    test('Debe rechazar edad menor a 13 años', async () => {
      mockReq.body = { edad: 12 };

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La edad debe ser un número entero mayor o igual a 13 años'
      });
    });

    test('Debe rechazar formato de correo inválido', async () => {
      mockReq.body = { correo: 'correo-invalido' };

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de correo electrónico inválido'
      });
    });

    test('Debe rechazar correo ya en uso por otro usuario', async () => {
      mockReq.body = { correo: 'existente@gmail.com' };
      UserDAO.emailExistsExcluding.mockResolvedValue(true);

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Este correo ya está registrado por otro usuario'
      });
    });

    test('Debe actualizar contraseña correctamente', async () => {
      mockReq.body = {
        contrasenaActual: 'Xddsmile123#',
        nuevaContrasena: 'NewPass123#',
        confirmarNuevaContrasena: 'NewPass123#'
      };

      const mockCurrentUser = {
        _id: userId,
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      UserDAO.findById.mockResolvedValue(mockCurrentUser);
      UserDAO.updatePassword.mockResolvedValue(true);
      UserDAO.getUserStats.mockResolvedValue({ _id: userId });

      await userController.updateProfile(mockReq, mockRes);

      expect(UserDAO.updatePassword).toHaveBeenCalledWith(userId, 'NewPass123#');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil y contraseña actualizados exitosamente',
        data: expect.any(Object)
      });
    });

    test('Debe rechazar cambio de contraseña cuando faltan campos', async () => {
      mockReq.body = {
        contrasenaActual: 'Xddsmile123#',
        nuevaContrasena: 'NewPass123#'
      };

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Para cambiar la contraseña debe proporcionar: contraseña actual, nueva contraseña y confirmación'
      });
    });

    test('Debe rechazar cuando las nuevas contraseñas no coinciden', async () => {
      mockReq.body = {
        contrasenaActual: 'Xddsmile123#',
        nuevaContrasena: 'NewPass123#',
        confirmarNuevaContrasena: 'Different123#'
      };

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La nueva contraseña y su confirmación no coinciden'
      });
    });

    test('Debe rechazar cuando la contraseña actual es incorrecta', async () => {
      mockReq.body = {
        contrasenaActual: 'wrongpass',
        nuevaContrasena: 'NewPass123#',
        confirmarNuevaContrasena: 'NewPass123#'
      };

      const mockCurrentUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      UserDAO.findById.mockResolvedValue(mockCurrentUser);

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    });
  });

  describe('deleteProfile', () => {
    const userId = '507f1f77bcf86cd799439011';

    beforeEach(() => {
      mockReq.user = { _id: userId };
    });

    test('Debe eliminar cuenta exitosamente', async () => {
      mockReq.body = {
        contrasena: 'Xddsmile123#',
        confirmacion: 'ELIMINAR'
      };

      const mockCurrentUser = {
        _id: userId,
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      const mockDeletedUser = {
        _id: userId,
        nombres: 'Miguel',
        apellidos: 'Restrepo',
        correo: 'miguelrestrep0@gmail.com'
      };

      UserDAO.findById.mockResolvedValue(mockCurrentUser);
      UserDAO.deleteUser.mockResolvedValue(mockDeletedUser);

      await userController.deleteProfile(mockReq, mockRes);

      expect(UserDAO.deleteUser).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cuenta eliminada exitosamente',
        data: {
          usuario: mockDeletedUser,
          fechaEliminacion: expect.any(Date)
        }
      });
    });

    test('Debe rechazar cuando faltan campos requeridos', async () => {
      mockReq.body = { contrasena: 'Xddsmile123#' };

      await userController.deleteProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Debe proporcionar su contraseña y escribir "ELIMINAR" para confirmar'
      });
    });

    test('Debe rechazar cuando la confirmación es incorrecta', async () => {
      mockReq.body = {
        contrasena: 'Xddsmile123#',
        confirmacion: 'eliminar'
      };

      await userController.deleteProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Para confirmar la eliminación debe escribir exactamente "ELIMINAR"'
      });
    });

    test('Debe rechazar cuando la contraseña es incorrecta', async () => {
      mockReq.body = {
        contrasena: 'wrongpass',
        confirmacion: 'ELIMINAR'
      };

      const mockCurrentUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      UserDAO.findById.mockResolvedValue(mockCurrentUser);

      await userController.deleteProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Contraseña incorrecta'
      });
    });

    test('Debe retornar 404 cuando el usuario no existe', async () => {
      mockReq.body = {
        contrasena: 'Xddsmile123#',
        confirmacion: 'ELIMINAR'
      };

      UserDAO.findById.mockResolvedValue(null);

      await userController.deleteProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado'
      });
    });
  });

  describe('validatePassword', () => {
    test('Debe validar contraseña correcta', () => {
      const result = userController.validatePassword('Xddsmile123#');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Debe detectar contraseña sin mayúscula', () => {
      const result = userController.validatePassword('xddsmile123#');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La contraseña debe contener al menos una letra mayúscula');
    });

    test('Debe detectar contraseña sin número', () => {
      const result = userController.validatePassword('Xddsmile#');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La contraseña debe contener al menos un número');
    });

    test('Debe detectar contraseña sin carácter especial', () => {
      const result = userController.validatePassword('Xddsmile123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La contraseña debe contener al menos un carácter especial');
    });

    test('Debe detectar contraseña muy corta', () => {
      const result = userController.validatePassword('Xdd12#');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La contraseña debe tener al menos 8 caracteres');
    });

    test('Debe detectar múltiples errores en contraseña', () => {
      const result = userController.validatePassword('xdd');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

