const jwt = require('jsonwebtoken');
const UserDAO = require('../dao/UserDAO');

/**
 * Middleware para verificar JWT en rutas protegidas
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express  
 * @param {Function} next - Siguiente middleware
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