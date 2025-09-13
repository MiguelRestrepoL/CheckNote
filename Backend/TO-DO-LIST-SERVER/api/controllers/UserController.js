const UserDAO = require('../dao/UserDAO');

class UserController {
  
  /**
   * Crear un nuevo usuario
   * @param {Request} req - Request de Express
   * @param {Response} res - Response de Express
   */
  async create(req, res) {
    try {
      const { nombres, apellidos, edad, correo, contrasena } = req.body;

      // Validación de datos requeridos
      if (!nombres || !apellidos || !edad || !correo || !contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos',
          required: ['nombres', 'apellidos', 'edad', 'correo', 'contrasena']
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
   * Validar formato de contraseña
   * @param {String} password - Contraseña a validar
   * @returns {Object} Resultado de la validación
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

module.exports = new UserController();