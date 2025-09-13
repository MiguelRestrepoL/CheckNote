const jwt = require('jsonwebtoken');
const UserDAO = require('../dao/UserDAO');

class AuthController {
  
  /**
   * Login de usuario
   * @param {Request} req - Request de Express
   * @param {Response} res - Response de Express
   */
  async login(req, res) {
    try {
      const { correo, contrasena } = req.body;

      // Validación de campos requeridos
      if (!correo || !contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Correo y contraseña son requeridos',
          required: ['correo', 'contrasena']
        });
      }

      // Buscar usuario por email
      const user = await UserDAO.findByEmail(correo.toLowerCase().trim());
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // Verificar contraseña
      const isPasswordValid = await user.comparePassword(contrasena);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // Generar JWT válido por 2h
      const token = jwt.sign(
        { 
          userId: user._id,
          correo: user.correo 
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || '2h'
        }
      );

      // Respuesta exitosa HTTP 200
      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user._id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          correo: user.correo,
          edad: user.edad,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      
      // Error interno del servidor - HTTP 500
      res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }

  /**
   * Verificar token JWT
   * @param {Request} req - Request de Express  
   * @param {Response} res - Response de Express
   */
  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }

      // Verificar y decodificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Buscar usuario actual
      const user = await UserDAO.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Token válido',
        user: {
          id: user._id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          correo: user.correo,
          edad: user.edad,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('Error verificando token:', error);
      
      // Token expirado o inválido
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      // Error interno del servidor
      res.status(500).json({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });
    }
  }
}

module.exports = new AuthController();