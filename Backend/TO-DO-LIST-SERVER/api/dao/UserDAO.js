const User = require('../models/User');

class UserDAO {
  
  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Object} Usuario creado con su ID
   */
  async createUser(userData) {
    try {
      const newUser = new User(userData);
      const savedUser = await newUser.save();
      
      return {
        id: savedUser._id,
        nombres: savedUser.nombres,
        apellidos: savedUser.apellidos,
        edad: savedUser.edad,
        correo: savedUser.correo,
        createdAt: savedUser.createdAt
      };
      
    } catch (error) {
      // Re-lanzar el error para que lo maneje el controller
      throw error;
    }
  }

  /**
   * Buscar usuario por correo electrónico
   * @param {String} correo - Correo del usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  async findByEmail(correo) {
    try {
      const user = await User.findOne({ correo: correo.toLowerCase() });
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   * @param {String} userId - ID del usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  async findById(userId) {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar si un correo ya existe
   * @param {String} correo - Correo a verificar
   * @returns {Boolean} true si existe, false si no
   */
  async emailExists(correo) {
    try {
      const user = await User.findOne({ correo: correo.toLowerCase() });
      return !!user; // Convierte a boolean
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios (para administración)
   * @returns {Array} Lista de usuarios
   */
  async getAllUsers() {
    try {
      const users = await User.find({}).select('-contrasena');
      return users;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserDAO();