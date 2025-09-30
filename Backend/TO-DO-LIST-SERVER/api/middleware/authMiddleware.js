const jwt = require('jsonwebtoken');
const UserDAO = require('../dao/UserDAO');

/**
 * JWT authentication middleware for protected routes
 * Validates JWT token, verifies user existence, and attaches user data to request
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers.authorization - Bearer token format: "Bearer <token>"
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Calls next() if authentication succeeds, sends error response otherwise
 * @throws {AuthenticationError} When token is missing (401)
 * @throws {AuthenticationError} When token is expired (401)
 * @throws {AuthenticationError} When token is invalid (401)
 * @throws {AuthenticationError} When user not found (401)
 * @description Attaches user object to req.user with properties: id, correo, nombres, apellidos
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    console.log('Header de autorización:', authHeader);
    
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;
    
    console.log('Token extraído:', token ? token.substring(0, 20) + '...' : 'null');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado');
      return res.status(500).json({
        success: false,
        message: 'Error de configuración del servidor'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en BD
    const user = await UserDAO.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido - usuario no encontrado'
      });
    }

    // Añadir usuario al request para uso en controladores
    req.user = {
      id: user._id,
      correo: user.correo,
      nombres: user.nombres,
      apellidos: user.apellidos
    };

    next();

  } catch (error) {
    console.error('Error en middleware de autenticación:', error);

    // Token expirado
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    // Token inválido
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Error interno
    res.status(500).json({
      success: false,
      message: 'Intenta de nuevo más tarde'
    });
  }
};

module.exports = {
  authenticateToken
};
