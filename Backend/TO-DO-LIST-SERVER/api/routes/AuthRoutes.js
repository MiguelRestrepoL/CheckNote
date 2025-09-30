/**
 * @fileoverview Authentication Routes - Handles user authentication and password management
 * @module routes/AuthRoutes
 * @requires express
 * @requires ../controllers/AuthController
 * @requires ../middleware/rateLimitMiddleware
 * 
 * @description
 * Defines all authentication-related routes for the application.
 * Handles user login, token verification, and password reset workflows.
 * 
 * All routes include rate limiting to prevent abuse:
 * - Login: 5 requests per 10 minutes
 * - Password reset: 10 requests per 10 minutes
 * - API calls: 100 requests per 15 minutes
 * 
 * Route prefix: /api/auth
 * 
 * Available endpoints:
 * - POST /api/auth/login                    - User authentication
 * - POST /api/auth/verify                   - JWT token verification
 * - POST /api/auth/request-password-reset   - Request password reset email
 * - POST /api/auth/reset-password           - Reset password with token
 * 
 * Development-only endpoints:
 * - GET  /api/auth/security-stats           - View security statistics
 * - POST /api/auth/cleanup-security         - Cleanup old security data
 * 
 * @example
 * // Mount in main router (routes.js)
 * const authRoutes = require('./AuthRoutes');
 * router.use('/auth', authRoutes);
 * 
 * @example
 * // Login request
 * POST /api/auth/login
 * Body: {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 * 
 * @example
 * // Request password reset
 * POST /api/auth/request-password-reset
 * Body: {
 *   "email": "user@example.com"
 * }
 */
const express = require('express');
const AuthController = require('../controllers/AuthController');
const { 
  loginLimiter, 
  apiLimiter, 
  passwordResetLimiter
} = require('../middleware/rateLimitMiddleware');
/**
 * Authentication Router
 * 
 * @type {express.Router}
 * 
 * @description
 * Express router instance for authentication routes.
 * All routes in this router are prefixed with /api/auth.
 */
const router = express.Router();
const authController = new AuthController();

/**
 * User login endpoint
 * 
 * @name POST /login
 * @function
 * @memberof module:routes/AuthRoutes
 * @middleware loginLimiter - Rate limit: 5 requests per 10 minutes per IP
 * 
 * @description
 * Authenticates user credentials and returns JWT token on success.
 * Tracks failed login attempts and locks accounts after 5 failures.
 * 
 * Rate limiting protects against brute force attacks.
 * 
 * Request body:
 * @param {string} email - User email address
 * @param {string} password - User password
 * 
 * Success response (200):
 * @returns {Object} response
 * @returns {string} response.status - "success"
 * @returns {string} response.message - Success message
 * @returns {Object} response.data - User and token data
 * @returns {string} response.data.token - JWT authentication token
 * @returns {Object} response.data.user - User information (without password)
 * 
 * Error responses:
 * - 400: Validation error (missing email/password)
 * - 401: Invalid credentials
 * - 403: Account locked due to failed attempts
 * - 429: Rate limit exceeded
 * - 500: Server error
 * 
 * @example
 * // Successful login
 * POST /api/auth/login
 * Body: {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 * Response: {
 *   "status": "success",
 *   "message": "Login exitoso",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": {
 *       "id": "507f1f77bcf86cd799439011",
 *       "nombres": "Juan",
 *       "email": "user@example.com"
 *     }
 *   }
 * }
 * 
 * @example
 * // Failed login (invalid credentials)
 * Response (401): {
 *   "status": "fail",
 *   "code": "AUTHENTICATION_ERROR",
 *   "message": "Credenciales incorrectas"
 * }
 * 
 * @example
 * // Account locked
 * Response (403): {
 *   "status": "fail",
 *   "code": "ACCOUNT_LOCKED",
 *   "message": "Cuenta bloqueada. Intenta en 30 minutos."
 * }
 */
router.post('/login', 
  loginLimiter,
  authController.login.bind(authController)
);

/**
 * Token verification endpoint
 * 
 * @name POST /verify
 * @function
 * @memberof module:routes/AuthRoutes
 * @middleware apiLimiter - Rate limit: 100 requests per 15 minutes per IP
 * 
 * @description
 * Verifies if a JWT token is valid and not expired.
 * Used by frontend to check authentication status.
 * 
 * Request body:
 * @param {string} token - JWT token to verify
 * 
 * Success response (200):
 * @returns {Object} response
 * @returns {string} response.status - "success"
 * @returns {string} response.message - "Token válido"
 * @returns {Object} response.data - Token payload data
 * @returns {string} response.data.userId - User ID from token
 * @returns {string} response.data.email - User email from token
 * 
 * Error responses:
 * - 400: Missing token
 * - 401: Invalid or expired token
 * - 429: Rate limit exceeded
 * - 500: Server error
 * 
 * @example
 * // Verify token
 * POST /api/auth/verify
 * Body: {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * Response: {
 *   "status": "success",
 *   "message": "Token válido",
 *   "data": {
 *     "userId": "507f1f77bcf86cd799439011",
 *     "email": "user@example.com"
 *   }
 * }
 * 
 * @example
 * // Invalid token
 * Response (401): {
 *   "status": "fail",
 *   "code": "AUTHENTICATION_ERROR",
 *   "message": "Token inválido o expirado"
 * }
 */
router.post('/verify', 
  apiLimiter,
  authController.verifyToken.bind(authController)
);

/**
 * Request password reset endpoint
 * 
 * @name POST /request-password-reset
 * @function
 * @memberof module:routes/AuthRoutes
 * @middleware passwordResetLimiter - Rate limit: 10 requests per 10 minutes per IP
 * 
 * @description
 * Initiates password reset process by generating a secure token and
 * sending reset instructions to user's email. Token expires in 1 hour.
 * 
 * Always returns success message (even if email doesn't exist) to
 * prevent email enumeration attacks.
 * 
 * Request body:
 * @param {string} email - User email address
 * 
 * Success response (200):
 * @returns {Object} response
 * @returns {string} response.status - "success"
 * @returns {string} response.message - "Si el correo existe, recibirás instrucciones"
 * 
 * Error responses:
 * - 400: Missing or invalid email
 * - 429: Rate limit exceeded (too many reset requests)
 * - 500: Server error (email service failure)
 * 
 * @example
 * // Request password reset
 * POST /api/auth/request-password-reset
 * Body: {
 *   "email": "user@example.com"
 * }
 * Response: {
 *   "status": "success",
 *   "message": "Si el correo existe, recibirás instrucciones para restablecer tu contraseña"
 * }
 * 
 * @example
 * // Rate limit exceeded
 * Response (429): {
 *   "status": "fail",
 *   "code": "RATE_LIMIT_ERROR",
 *   "message": "Demasiadas solicitudes. Intenta más tarde."
 * }
 * 
 * @see {@link module:services/EmailService} - Sends reset email
 * @see {@link module:services/PasswordResetService} - Generates token
 */
router.post('/request-password-reset', 
  passwordResetLimiter,
  authController.requestPasswordReset.bind(authController)
);


/**
 * Reset password endpoint
 * 
 * @name POST /reset-password
 * @function
 * @memberof module:routes/AuthRoutes
 * @middleware passwordResetLimiter - Rate limit: 10 requests per 10 minutes per IP
 * 
 * @description
 * Completes password reset process using the token received via email.
 * Validates token, updates password, and invalidates the reset token.
 * 
 * New password must meet strength requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * Request body:
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password (must meet requirements)
 * 
 * Success response (200):
 * @returns {Object} response
 * @returns {string} response.status - "success"
 * @returns {string} response.message - "Contraseña restablecida exitosamente"
 * 
 * Error responses:
 * - 400: Missing fields or password doesn't meet requirements
 * - 401: Invalid or expired token
 * - 429: Rate limit exceeded
 * - 500: Server error
 * 
 * @example
 * // Reset password
 * POST /api/auth/reset-password
 * Body: {
 *   "token": "a1b2c3d4e5f6...",
 *   "newPassword": "NewSecure123!"
 * }
 * Response: {
 *   "status": "success",
 *   "message": "Contraseña restablecida exitosamente"
 * }
 * 
 * @example
 * // Invalid token
 * Response (401): {
 *   "status": "fail",
 *   "code": "AUTHENTICATION_ERROR",
 *   "message": "Token inválido o expirado"
 * }
 * 
 * @example
 * // Weak password
 * Response (400): {
 *   "status": "fail",
 *   "code": "VALIDATION_ERROR",
 *   "message": "La contraseña no cumple los requisitos de seguridad"
 * }
 * 
 * @see {@link module:services/PasswordResetService} - Validates and processes reset
 */
router.post('/reset-password', 
  passwordResetLimiter,
  authController.resetPassword.bind(authController)
);

/**
 * Development mode conditional routes
 * 
 * @description
 * Routes that are only available in development environment.
 * Useful for debugging account security features.
 * 
 * These routes are NOT available in production for security reasons.
 * 
 * @private
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/security-stats', 
    apiLimiter,
    authController.getSecurityStats.bind(authController)
  );
 /**
   * Cleanup security data (Development only)
   * 
   * @name POST /cleanup-security
   * @function
   * @memberof module:routes/AuthRoutes
   * @middleware apiLimiter - Rate limit: 100 requests per 15 minutes
   * @private
   * 
   * @description
   * Cleans up old security-related data from the database.
   * Removes expired reset tokens, old failed attempts, and unlocks accounts.
   * 
   * Only available in development environment.
   * Useful for testing and clearing test data.
   * 
   * Request body:
   * @param {boolean} [unlockAll] - Unlock all locked accounts
   * @param {boolean} [clearAttempts] - Clear all failed login attempts
   * @param {boolean} [clearTokens] - Clear all reset tokens
   * 
   * Success response (200):
   * @returns {Object} response
   * @returns {string} response.status - "success"
   * @returns {string} response.message - "Datos de seguridad limpiados"
   * @returns {Object} response.data - Cleanup statistics
   * @returns {number} response.data.accountsUnlocked - Number of accounts unlocked
   * @returns {number} response.data.attemptsCleared - Number of attempts cleared
   * @returns {number} response.data.tokensDeleted - Number of tokens deleted
   * 
   * @example
   * // Cleanup all security data
   * POST /api/auth/cleanup-security
   * Body: {
   *   "unlockAll": true,
   *   "clearAttempts": true,
   *   "clearTokens": true
   * }
   * Response: {
   *   "status": "success",
   *   "message": "Datos de seguridad limpiados",
   *   "data": {
   *     "accountsUnlocked": 3,
   *     "attemptsCleared": 15,
   *     "tokensDeleted": 7
   *   }
   * }
   * 
   * @example
   * // Not available in production
   * // POST /api/auth/cleanup-security → 404 Not Found
   */
  router.post('/cleanup-security', 
    apiLimiter,
    authController.cleanupSecurityData.bind(authController)
  );
}
/**
 * Authentication router export
 * 
 * @exports AuthRoutes
 * @type {express.Router}
 * 
 * @description
 * Configured router with all authentication endpoints.
 * Should be mounted at /api/auth in the main router.
 * 
 * Security features:
 * - Rate limiting on all endpoints
 * - Account lockout after failed attempts
 * - Secure password reset workflow
 * - JWT token validation
 * - Development-only debug routes
 * 
 * @example
 * // Mount in main router
 * const authRoutes = require('./AuthRoutes');
 * router.use('/auth', authRoutes);
 * 
 * @example
 * // Complete authentication flow
 * // 1. User forgets password
 * POST /api/auth/request-password-reset
 * 
 * // 2. User receives email with token
 * // 3. User submits new password with token
 * POST /api/auth/reset-password
 * 
 * // 4. User logs in with new password
 * POST /api/auth/login
 * 
 * // 5. Frontend verifies token on app load
 * POST /api/auth/verify
 * 
 * @see {@link module:controllers/AuthController} - Controller implementation
 * @see {@link module:middleware/rateLimitMiddleware} - Rate limiting configuration
 */
module.exports = router;
