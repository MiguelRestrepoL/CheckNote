const User = require('../models/User');

class UserDAO {
  
  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Object} Usuario creado con su ID
   */
  static async createUser(userData) {
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
  static async findByEmail(correo) {
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
  static async findById(userId) {
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
  static async emailExists(correo) {
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
  /**
   * Actualizar datos de usuario por ID
   * @param {string} userId - ObjectId del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object|null>} Usuario actualizado sin contraseña
   */
  static async updateUser(userId, updateData) {
    try {
      // Opciones para retornar documento actualizado
      const options = {
        new: true, // Retorna el documento actualizado
        runValidators: true, // Ejecuta validaciones del schema
        context: 'query' // Para que funcionen las validaciones
      };

      // Actualizar usuario
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        options
      );

      if (!updatedUser) {
        return null;
      }

      // Convertir a JSON para aplicar toJSON() que oculta contraseña
      return updatedUser.toJSON();
    } catch (error) {
      console.error(' Error en UserDAO.updateUser:', error);
      throw error;
    }
  }

  /**
   * Actualizar contraseña de usuario
   * @param {string} userId - ObjectId del usuario
   * @param {string} newPassword - Nueva contraseña (será hasheada automáticamente)
   * @returns {Promise<Object|null>} Usuario actualizado sin contraseña
   */
  static async updatePassword(userId, newPassword) {
    try {
      // Buscar usuario
      const user = await User.findById(userId);
      
      if (!user) {
        return null;
      }

      // Actualizar contraseña (el pre-save middleware la hasheará automáticamente)
      user.contrasena = newPassword;
      await user.save();

      // Retornar sin contraseña
      return user.toJSON();
    } catch (error) {
      console.error(' Error en UserDAO.updatePassword:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario por ID
   * @param {string} userId - ObjectId del usuario
   * @returns {Promise<Object|null>} Usuario eliminado sin contraseña
   */
  static async deleteUser(userId) {
    try {
      const deletedUser = await User.findByIdAndDelete(userId);
      
      if (!deletedUser) {
        return null;
      }

      // Retornar sin contraseña
      return deletedUser.toJSON();
    } catch (error) {
      console.error(' Error en UserDAO.deleteUser:', error);
      throw error;
    }
  }

  /**
   * Verificar si el email ya existe (excluyendo un usuario específico)
   * Útil para actualizar perfil sin conflicto con el propio email
   * @param {string} correo - Email a verificar
   * @param {string} excludeUserId - ID del usuario a excluir de la búsqueda
   * @returns {Promise<boolean>} true si existe otro usuario con ese email
   */
  static async emailExistsExcluding(correo, excludeUserId) {
    try {
      const user = await User.findOne({
        correo: correo.toLowerCase().trim(),
        _id: { $ne: excludeUserId } // Excluir el usuario actual
      });

      return !!user; // Convertir a boolean
    } catch (error) {
      console.error(' Error en UserDAO.emailExistsExcluding:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas básicas del usuario
   * @param {string} userId - ObjectId del usuario
   * @returns {Promise<Object|null>} Objeto con estadísticas del usuario
   */
  static async getUserStats(userId) {
    try {
      const user = await User.findById(userId).select('-contrasena');
      
      if (!user) {
        return null;
      }

      
      // Por ahora retornamos info básica
      return {
        usuario: user.toJSON(),
        fechaRegistro: user.createdAt,
        ultimaActualizacion: user.updatedAt,
        
      };
    } catch (error) {
      console.error(' Error en UserDAO.getUserStats:', error);
      throw error;
    }
  }

}


<<<<<<< HEAD
module.exports = new UserDAO();
=======
module.exports =  UserDAO;
>>>>>>> origin/Daniel_!
