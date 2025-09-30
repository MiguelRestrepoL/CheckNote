const UserDAO = require('../dao/UserDAO');
const GlobalController = require('./GlobalController');

/**
 * Controller for user-related operations
 * Handles user registration, profile management, and account deletion
 * @extends GlobalController
 */
class UserController extends GlobalController {
  
 /**
   * Create a new user account
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.nombres - User's first name (2-50 chars)
   * @param {string} req.body.apellidos - User's last name (2-50 chars)
   * @param {number} req.body.edad - User's age (minimum 13)
   * @param {string} req.body.correo - User's email address
   * @param {string} req.body.contrasena - User's password (min 8 chars, must contain uppercase, number, special char)
   * @param {string} req.body.confirmarContrasena - Password confirmation
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 201 with created user data or error response
   * @throws {ValidationError} When required fields are missing or invalid
   * @throws {ConflictError} When email already exists (409)
   */
  async create(req, res) {
    try {
      const { nombres, apellidos, edad, correo, contrasena, confirmarContrasena} = req.body;

      // Validación de datos requeridos
      if (!nombres || !apellidos || !edad || !correo || !contrasena || !confirmarContrasena) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos',
          required: ['nombres', 'apellidos', 'edad', 'correo', 'contrasena', 'confirmarContrasena']
        });
      }

      if (contrasena !== confirmarContrasena) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden',
          error: 'confirmar_contrasena_no_coincide'
        });
      }

      // Verificar si el correo ya existe
      const emailExists = await UserDAO.emailExists(correo);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }
      

      // Validación adicional de edad
      if (parseInt(edad) < 13) {
        return res.status(400).json({
          success: false,
          message: 'La edad debe ser mayor o igual a 13 años'
        });
      }

      // Validación de contraseña
      const passwordValidation = this.validatePassword(contrasena);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña no válida',
          errors: passwordValidation.errors
        });
      }

      // Crear el usuario
      const userData = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        edad: parseInt(edad),
        correo: correo.toLowerCase().trim(),
        contrasena
      };

      const newUser = await UserDAO.createUser(userData);

      // Respuesta exitosa con HTTP 201
      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        id: newUser.id,
        user: {
          id: newUser.id,
          nombres: newUser.nombres,
          apellidos: newUser.apellidos,
          edad: newUser.edad,
          correo: newUser.correo,
          createdAt: newUser.createdAt
        }
      });

    } catch (error) {
      console.error('Error al crear usuario:', error);
      
      // Manejo de errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: validationErrors
        });
      }

      // Error de duplicado de MongoDB
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }

      // Error interno del servidor
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Get authenticated user's profile with statistics
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user from JWT middleware
   * @param {string} req.user._id - User's MongoDB ObjectId
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with user profile and registration statistics
   * @throws {NotFoundError} When user not found (404)
   */
  async getProfile(req, res) {
    try {
      // El middleware authenticateToken ya pobló req.user
      const userId = req.user._id;

      // Obtener datos actualizados del usuario desde BD
      const userStats = await UserDAO.getUserStats(userId);

      if (!userStats) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: userStats
      });

    } catch (error) {
      console.error(' Error en UserController.getProfile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor. Intenta de nuevo más tarde.'
      });
    }
  }

  /**
   * Update authenticated user's profile
   * Supports updating basic info (nombres, apellidos, edad, correo) and password change
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user from middleware
   * @param {string} req.user._id - User's ID
   * @param {Object} req.body - Request body
   * @param {string} [req.body.nombres] - New first name
   * @param {string} [req.body.apellidos] - New last name
   * @param {number} [req.body.edad] - New age
   * @param {string} [req.body.correo] - New email address
   * @param {string} [req.body.contrasenaActual] - Current password (required for password change)
   * @param {string} [req.body.nuevaContrasena] - New password
   * @param {string} [req.body.confirmarNuevaContrasena] - New password confirmation
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with updated user data
   * @throws {ValidationError} When validation fails (400)
   * @throws {ConflictError} When email already exists for another user (409)
   * @throws {AuthenticationError} When current password is incorrect (401)
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const { nombres, apellidos, edad, correo, contrasenaActual, nuevaContrasena, confirmarNuevaContrasena } = req.body;

      // Validar campos obligatorios para actualización básica
      const fieldsToUpdate = { nombres, apellidos, edad, correo };
      const hasBasicUpdate = Object.values(fieldsToUpdate).some(field => field !== undefined);
      const hasPasswordUpdate = contrasenaActual || nuevaContrasena || confirmarNuevaContrasena;

      if (!hasBasicUpdate && !hasPasswordUpdate) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }

      // ACTUALIZACIÓN DE DATOS BÁSICOS
      if (hasBasicUpdate) {
        const updateData = {};

        // Validar nombres si se proporciona
        if (nombres !== undefined) {
          if (!nombres || nombres.trim().length < 2 || nombres.trim().length > 50) {
            return res.status(400).json({
              success: false,
              message: 'El nombre debe tener entre 2 y 50 caracteres'
            });
          }
          updateData.nombres = nombres.trim();
        }

        // Validar apellidos si se proporciona
        if (apellidos !== undefined) {
          if (!apellidos || apellidos.trim().length < 2 || apellidos.trim().length > 50) {
            return res.status(400).json({
              success: false,
              message: 'Los apellidos deben tener entre 2 y 50 caracteres'
            });
          }
          updateData.apellidos = apellidos.trim();
        }

        // Validar edad si se proporciona
        if (edad !== undefined) {
          if (!Number.isInteger(edad) || edad < 13) {
            return res.status(400).json({
              success: false,
              message: 'La edad debe ser un número entero mayor o igual a 13 años'
            });
          }
          updateData.edad = edad;
        }

        // Validar correo si se proporciona
        if (correo !== undefined) {
          const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
          if (!correo || !emailRegex.test(correo.trim())) {
            return res.status(400).json({
              success: false,
              message: 'Formato de correo electrónico inválido'
            });
          }

          // Verificar que el email no esté en uso por otro usuario
          const emailExists = await UserDAO.emailExistsExcluding(correo, userId);
          if (emailExists) {
            return res.status(409).json({
              success: false,
              message: 'Este correo ya está registrado por otro usuario'
            });
          }
          
          updateData.correo = correo.toLowerCase().trim();
        }

        // Actualizar datos básicos
        const updatedUser = await UserDAO.updateUser(userId, updateData);
        
        if (!updatedUser) {
          return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
          });
        }
      }

      // ACTUALIZACIÓN DE CONTRASEÑA
      if (hasPasswordUpdate) {
        // Validar que se proporcionen todos los campos de contraseña
        if (!contrasenaActual || !nuevaContrasena || !confirmarNuevaContrasena) {
          return res.status(400).json({
            success: false,
            message: 'Para cambiar la contraseña debe proporcionar: contraseña actual, nueva contraseña y confirmación'
          });
        }

        // Validar que las nuevas contraseñas coincidan
        if (nuevaContrasena !== confirmarNuevaContrasena) {
          return res.status(400).json({
            success: false,
            message: 'La nueva contraseña y su confirmación no coinciden'
          });
        }

        // Validar fortaleza de nueva contraseña
        const passwordValidation = this.validatePassword(nuevaContrasena);
        if (!passwordValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: passwordValidation.message
          });
        }

        // Verificar contraseña actual
        const currentUser = await UserDAO.findById(userId);
        if (!currentUser) {
          return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
          });
        }

        const isCurrentPasswordValid = await currentUser.comparePassword(contrasenaActual);
        if (!isCurrentPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'La contraseña actual es incorrecta'
          });
        }

        // Actualizar contraseña
        await UserDAO.updatePassword(userId, nuevaContrasena);
      }

      // Obtener datos actualizados del usuario
      const finalUserStats = await UserDAO.getUserStats(userId);

      return res.status(200).json({
        success: true,
        message: hasPasswordUpdate 
          ? 'Perfil y contraseña actualizados exitosamente' 
          : 'Perfil actualizado exitosamente',
        data: finalUserStats
      });

    } catch (error) {
      console.error('❌ Error en UserController.updateProfile:', error);
      
      // Manejar errores específicos de validación de Mongoose
      if (error.name === 'ValidationError') {
        const firstError = Object.values(error.errors)[0];
        return res.status(400).json({
          success: false,
          message: firstError.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor. Intenta de nuevo más tarde.'
      });
    }
  }

 /**
   * Delete authenticated user's account
   * Requires password verification and explicit confirmation text "ELIMINAR"
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user from middleware
   * @param {string} req.user._id - User's ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.contrasena - User's password for verification
   * @param {string} req.body.confirmacion - Must be exactly "ELIMINAR"
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Returns 200 with deletion confirmation
   * @throws {ValidationError} When required fields missing or confirmation text incorrect (400)
   * @throws {AuthenticationError} When password is incorrect (401)
   * @throws {NotFoundError} When user not found (404)
   */
  async deleteProfile(req, res) {
    try {
      const userId = req.user._id;
      const { contrasena, confirmacion } = req.body;

      // Validar campos requeridos
      if (!contrasena || !confirmacion) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar su contraseña y escribir "ELIMINAR" para confirmar'
        });
      }

      // Validar confirmación
      if (confirmacion !== 'ELIMINAR') {
        return res.status(400).json({
          success: false,
          message: 'Para confirmar la eliminación debe escribir exactamente "ELIMINAR"'
        });
      }

      // Verificar contraseña
      const currentUser = await UserDAO.findById(userId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const isPasswordValid = await currentUser.comparePassword(contrasena);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña incorrecta'
        });
      }

      // Eliminar usuario
      const deletedUser = await UserDAO.deleteUser(userId);
      
      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cuenta eliminada exitosamente',
        data: {
          usuario: deletedUser,
          fechaEliminacion: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Error en UserController.deleteProfile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor. Intenta de nuevo más tarde.'
      });
    }
  }

 /**
   * Validate password strength requirements
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   * @returns {boolean} returns.isValid - Whether password meets all requirements
   * @returns {string[]} returns.errors - Array of validation error messages
   * @example
   * const result = this.validatePassword('Test123!');
   * // Returns: { isValid: true, errors: [] }
   * @example
   * const result = this.validatePassword('weak');
   * // Returns: { isValid: false, errors: ['La contraseña debe tener al menos 8 caracteres', ...] }
   */
  validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }

}

module.exports =  UserController;
