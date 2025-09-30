const User = require('../models/User');
/**
 * Data Access Object for User operations
 * Handles all database interactions for User model
 * All methods are static and throw errors to be handled by controllers
 */
class UserDAO {
  
  /**
   * Create a new user in the database
   * @async
   * @static
   * @param {Object} userData - User data to create
   * @param {string} userData.nombres - First name
   * @param {string} userData.apellidos - Last name
   * @param {number} userData.edad - Age (minimum 13)
   * @param {string} userData.correo - Email address (will be lowercased)
   * @param {string} userData.contrasena - Plain password (will be hashed by model middleware)
   * @returns {Promise<Object>} Created user object without password
   * @returns {string} returns.id - User's MongoDB ObjectId
   * @returns {string} returns.nombres - User's first name
   * @returns {string} returns.apellidos - User's last name
   * @returns {number} returns.edad - User's age
   * @returns {string} returns.correo - User's email
   * @returns {Date} returns.createdAt - Creation timestamp
   * @throws {MongoError} When database operation fails
   * @throws {ValidationError} When Mongoose validation fails
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
   * Find user by email address
   * @async
   * @static
   * @param {string} correo - Email to search for (case-insensitive)
   * @returns {Promise<Object|null>} User document with password or null if not found
   * @throws {MongoError} When database operation fails
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
   * Find user by MongoDB ObjectId
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @returns {Promise<Object|null>} User document or null if not found
   * @throws {MongoError} When database operation fails
   * @throws {CastError} When userId format is invalid
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
   * Check if email exists in database
   * @async
   * @static
   * @param {string} correo - Email to check (case-insensitive)
   * @returns {Promise<boolean>} True if email exists, false otherwise
   * @throws {MongoError} When database operation fails
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
   * Get all users from database (admin functionality)
   * @async
   * @returns {Promise<Array<Object>>} Array of user objects without passwords
   * @throws {MongoError} When database operation fails
   * @description Should be restricted to admin users in production
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
   * Update user data by ID
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @param {Object} updateData - Fields to update
   * @param {string} [updateData.nombres] - New first name
   * @param {string} [updateData.apellidos] - New last name
   * @param {number} [updateData.edad] - New age
   * @param {string} [updateData.correo] - New email
   * @returns {Promise<Object|null>} Updated user without password or null if not found
   * @throws {MongoError} When database operation fails
   * @throws {ValidationError} When validation fails
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
   * Update user password
   * Password will be automatically hashed by model pre-save middleware
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @param {string} newPassword - New plain password (will be hashed automatically)
   * @returns {Promise<Object|null>} Updated user without password or null if not found
   * @throws {MongoError} When database operation fails
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
   * Delete user by ID
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId to delete
   * @returns {Promise<Object|null>} Deleted user without password or null if not found
   * @throws {MongoError} When database operation fails
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
   * Check if email exists excluding specific user
   * Useful for profile updates to avoid self-conflict
   * @async
   * @static
   * @param {string} correo - Email to check (case-insensitive)
   * @param {string} excludeUserId - User ID to exclude from search
   * @returns {Promise<boolean>} True if email exists for another user, false otherwise
   * @throws {MongoError} When database operation fails
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
   * Get user statistics and basic information
   * @async
   * @static
   * @param {string} userId - User's MongoDB ObjectId
   * @returns {Promise<Object|null>} User statistics object or null if not found
   * @returns {Object} returns.usuario - User data without password
   * @returns {Date} returns.fechaRegistro - Registration date (createdAt)
   * @returns {Date} returns.ultimaActualizacion - Last update date (updatedAt)
   * @throws {MongoError} When database operation fails
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


module.exports =  UserDAO;
