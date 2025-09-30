/**
 * @fileoverview User Routes - Handles user registration and profile management
 * @module routes/UserRoutes
 * @requires express
 * @requires ../controllers/UserController
 * @requires ../middleware/authMiddleware
 * @requires ../middleware/rateLimitMiddleware
 * 
 * @description
 * Defines all user-related routes for the application.
 * Handles user registration and authenticated profile operations (CRUD).
 * 
 * Route types:
 * - Public routes: User registration (with rate limiting)
 * - Protected routes: Profile operations (require authentication)
 * 
 * All routes include rate limiting:
 * - Registration: 3 requests per 1 hour per IP
 * - API calls: 100 requests per 15 minutes per IP
 * 
 * Route prefix: /api/users
 * 
 * Available endpoints:
 * - POST   /api/users/Registro   - Register new user (public)
 * - GET    /api/users/me          - Get current user profile (protected)
 * - PUT    /api/users/me          - Update current user profile (protected)
 * - DELETE /api/users/me          - Delete current user account (protected)
 * 
 * @example
 * // Mount in main router (routes.js)
 * const userRoutes = require('./UserRoutes');
 * router.use('/users', userRoutes);
 * 
 * @example
 * // Register new user
 * POST /api/users/Registro
 * Body: {
 *   "nombres": "Juan",
 *   "apellidos": "Pérez",
 *   "edad": 25,
 *   "correo": "juan@example.com",
 *   "password": "SecurePass123!"
 * }
 * 
 * @example
 * // Get profile (requires authentication)
 * GET /api/users/me
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */

const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
  registerLimiter, 
  apiLimiter 
} = require('../middleware/rateLimitMiddleware');
/**
 * User Router
 * 
 * @type {express.Router}
 * 
 * @description
 * Express router instance for user routes.
 * All routes in this router are prefixed with /api/users.
 */
const router = express.Router();
/**
 * User Controller Instance
 * 
 * @constant {UserController}
 * 
 * @description
 * Instance of UserController that handles all user-related business logic.
 * Methods are explicitly bound to maintain correct 'this' context.
 * 
 * Controller methods:
 * - create() - Register new user
 * - getProfile() - Get authenticated user's profile
 * - updateProfile() - Update authenticated user's profile
 * - deleteProfile() - Delete authenticated user's account
 */
const userController = new UserController();

/**
 * User registration endpoint
 * 
 * @name POST /Registro
 * @function
 * @memberof module:routes/UserRoutes
 * @middleware registerLimiter - Rate limit: 3 requests per 1 hour per IP
 * @public
 * 
 * @description
 * Creates a new user account with the provided information.
 * Password is automatically hashed before storage.
 * 
 * Validations:
 * - All fields are required (nombres, apellidos, edad, correo, password)
 * - Email must be valid format and unique
 * - Password must meet strength requirements (8+ chars, uppercase, lowercase, number, special)
 * - Age must be a positive number
 * - Names must be 2-50 characters
 * 
 * Rate limiting prevents registration spam (3 attempts per hour).
 * 
 * Request body:
 * @param {string} nombres - User first name (2-50 characters)
 * @param {string} apellidos - User last name (2-50 characters)
 * @param {number} edad - User age (positive number)
 * @param {string} correo - User email (valid format, unique)
 * @param {string} password - User password (8+ chars, must meet strength requirements)
 * 
 * Success response (201):
 * @returns {Object} response
 * @returns {string} response.status - "success"
 * @returns {string} response.message - "Usuario creado exitosamente"
 * @returns {Object} response.data - Created user data
 * @returns {string} response.data.id - User ID
 * @returns {string} response.data.nombres - User first name
 * @returns {string} response.data.apellidos - User last name
 * @returns {number} response.data.edad - User age
 * @returns {string} response.data.correo - User email
 * 
 * Error responses:
 * - 400: Validation error (missing fields, invalid format)
 * - 409: Conflict (email already registered)
 * - 429: Rate limit exceeded
 * - 500: Server error
 * 
 * @example
 * // Successful registration
 * POST /api/users/Registro
 * Body: {
 *   "nombres": "Juan",
 *   "apellidos": "Pérez García",
 *   "edad": 25,
 *   "correo": "juan.perez@example.com",
 *   "password": "SecurePass123!"
 * }
 * Response (201): {
 *   "status": "success",
 *   "message": "Usuario creado exitosamente",
 *   "data": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "nombres": "Juan",
 *     "apellidos": "Pérez García",
 *     "edad": 25,
 *     "correo": "juan.perez@example.com",
 *     "createdAt": "2025-01-15T10:30:00.000Z"
 *   }
 * }
 * 
 * @example
 * // Validation error - weak password
 * Response (400): {
 *   "status": "fail",
 *   "code": "VALIDATION_ERROR",
 *   "message": "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales"
 * }
 * 
 * @example
 * // Duplicate email
 * Response (409): {
 *   "status": "fail",
 *   "code": "CONFLICT_ERROR",
 *   "message": "El correo electrónico ya está registrado"
 * }
 * 
 * @example
 * // Rate limit exceeded
 * Response (429): {
 *   "status": "fail",
 *   "code": "RATE_LIMIT_ERROR",
 *   "message": "Demasiados intentos de registro. Intenta en 1 hora."
 * }
 * 
 * @see {@link module:controllers/UserController#create} - Controller implementation
 * @see {@link module:models/User} - User model with validations
 */
router.post('/Registro', 
  registerLimiter,
  userController.create.bind(userController)
);
/**
 * Get current user profile endpoint
 * 
 * @name GET /me
 * @function
 * @memberof module:routes/UserRoutes
 * @middleware apiLimiter - Rate limit: 100 requests per 15 minutes per IP
 * @middleware authenticateToken - Validates JWT and extracts user info
 * @protected
 * 
 * @description
 * Returns the profile information of the currently authenticated user.
 * User is identified from the JWT token in Authorization header.
 * 
 * Password is automatically excluded from the response.
 * 
 * Request headers:
 * @header {string} Authorization - Bearer token (required)
 * 
 * Success response (200):
 * @returns {Object} response
 * @returns {string} response.status - "success"
 * @returns {string} response.message - "Perfil de usuario"
 * @returns {Object} response.data - User profile data
 * @returns {string} response.data.id - User ID
 * @returns {string} response.data.nombres - User first name
 * @returns {string} response.data.apellidos - User last name
 * @returns {number} response.data.edad - User age
 * @returns {string} response.data.correo - User email
 * @returns {Date} response.data.createdAt - Account creation date
 * @returns {Date} response.data.updatedAt - Last update date
 * 
 * Error responses:
 * - 401: Unauthorized (missing or invalid token)
 * - 404: User not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 * 
 * @example
 * // Get profile
 * GET /api/users/me
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * Response (200): {
 *   "status": "success",
 *   "message": "Perfil de usuario",
 *   "data": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "nombres": "Juan",
 *     "apellidos": "Pérez García",
 *     "edad": 25,
 *     "correo": "juan.perez@example.com",
 *     "createdAt": "2025-01-15T10:30:00.000Z",
 *     "updatedAt": "2025-01-20T14:15:00.000Z"
 *   }
 * }
 * 
 * @example
 * // Missing token
 * Response (401): {
 *   "status": "fail",
 *   "code": "AUTHENTICATION_ERROR",
 *   "message": "Token de autenticación requerido"
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
 * @see {@link module:controllers/UserController#getProfile} - Controller implementation
 * @see {@link module:middleware/authMiddleware} - Authentication middleware
 */
router.get('/me', 
  apiLimiter,
  authenticateToken, 
  userController.getProfile.bind(userController)
);

/**
 * Update current user profile endpoint
 * 
 * @name PUT /me
 * @function
 * @memberof module:routes/UserRoutes
 * @middleware apiLimiter - Rate limit: 100 requests per 15 minutes per IP
 * @middleware authenticateToken - Validates JWT and extracts user info
 * @protected
 * 
 * @description
 * Updates the profile information of the currently authenticated user.
 * User is identified from the JWT token in Authorization header.
 * 
 * Only provided fields will be updated (partial update).
 * Email updates require email to be unique.
 * Password cannot be changed through this endpoint (use /auth/change-password).
 * 
 * Request headers:
 * @header {string} Authorization - Bearer token (required)
 * 
 * Request body (all fields optional):
 * @param {string} [nombres] - Updated first name (2-50 characters)
 * @param {string} [apellidos] - Updated last name (2-50 characters)
 * @param {number} [edad] - Updated age (positive number)
 * @param {string} [correo] - Updated email (must be unique)
 * 
 * Success response (200):
 * @returns {Object} response
 * @returns {string} response.status - "success"
 * @returns {string} response.message - "Perfil actualizado exitosamente"
 * @returns {Object} response.data - Updated user data
 * 
 * Error responses:
 * - 400: Validation error (invalid field values)
 * - 401: Unauthorized (missing or invalid token)
 * - 404: User not found
 * - 409: Conflict (email already in use)
 * - 429: Rate limit exceeded
 * - 500: Server error
 * 
 * @example
 * // Update profile (partial update)
 * PUT /api/users/me
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * Body: {
 *   "nombres": "Juan Carlos",
 *   "edad": 26
 * }
 * Response (200): {
 *   "status": "success",
 *   "message": "Perfil actualizado exitosamente",
 *   "data": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "nombres": "Juan Carlos",
 *     "apellidos": "Pérez García",
 *     "edad": 26,
 *     "correo": "juan.perez@example.com",
 *     "updatedAt": "2025-01-25T16:45:00.000Z"
 *   }
 * }
 * 
 * @example
 * // Update email
 * Body: {
 *   "correo": "juancarlos.perez@example.com"
 * }
 * 
 * @example
 * // Email already exists
 * Response (409): {
 *   "status": "fail",
 *   "code": "CONFLICT_ERROR",
 *   "message": "El correo electrónico ya está en uso"
 * }
 * 
 * @example
 * // Invalid age
 * Body: { "edad": -5 }
 * Response (400): {
 *   "status": "fail",
 *   "code": "VALIDATION_ERROR",
 *   "message": "La edad debe ser un número positivo"
 * }
 * 
 * @see {@link module:controllers/UserController#updateProfile} - Controller implementation
 * @see {@link module:middleware/authMiddleware} - Authentication middleware
 */
router.put('/me', 
  apiLimiter,
  authenticateToken, 
  userController.updateProfile.bind(userController)
);
/**
 * Delete current user account endpoint
 * 
 * @name DELETE /me
 * @function
 * @memberof module:routes/UserRoutes
 * @middleware apiLimiter - Rate limit: 100 requests per 15 minutes per IP
 * @middleware authenticateToken - Validates JWT and extracts user info
 * @protected
 * 
 * @description
 * Permanently deletes the account of the currently authenticated user.
 * User is identified from the JWT token in Authorization header.
 * 
 * ⚠️ WARNING: This action is irreversible!
 * - User account is permanently deleted
 * - All associated tasks are also deleted (cascade)
 * - User must log in again to create a new account
 * 
 * This is a destructive operation with no recovery option.
 * 
 * Request headers:
 * @header {string} Authorization - Bearer token (required)
 * 
 * Success response (200):
 * @returns {Object} response
 * @returns {string} response.status - "success"
 * @returns {string} response.message - "Usuario eliminado exitosamente"
 * 
 * Error responses:
 * - 401: Unauthorized (missing or invalid token)
 * - 404: User not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 * 
 * @example
 * // Delete account
 * DELETE /api/users/me
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * Response (200): {
 *   "status": "success",
 *   "message": "Usuario eliminado exitosamente"
 * }
 * 
 * @example
 * // After deletion, user must register again
 * POST /api/users/Registro
 * // Creates new account (previous data is lost)
 * 
 * @example
 * // Token becomes invalid after deletion
 * GET /api/users/me
 * Response (401): {
 *   "status": "fail",
 *   "code": "AUTHENTICATION_ERROR",
 *   "message": "Usuario no encontrado"
 * }
 * 
 * @see {@link module:controllers/UserController#deleteProfile} - Controller implementation
 * @see {@link module:middleware/authMiddleware} - Authentication middleware
 */
router.delete('/me', 
  apiLimiter,
  authenticateToken, 
  userController.deleteProfile.bind(userController)
);
/**
 * User router export
 * 
 * @exports UserRoutes
 * @type {express.Router}
 * 
 * @description
 * Configured router with all user management endpoints.
 * Should be mounted at /api/users in the main router.
 * 
 * Route categories:
 * - Public: Registration (with strict rate limiting)
 * - Protected: Profile operations (require authentication)
 * 
 * Security features:
 * - Rate limiting on all endpoints
 * - JWT authentication for protected routes
 * - Password hashing (bcrypt)
 * - Email uniqueness validation
 * - Input validation on all fields
 * 
 * @example
 * // Mount in main router
 * const userRoutes = require('./UserRoutes');
 * router.use('/users', userRoutes);
 * 
 * @example
 * // Complete user lifecycle
 * // 1. Register
 * POST /api/users/Registro
 * 
 * // 2. Login (in AuthRoutes)
 * POST /api/auth/login
 * 
 * // 3. Get profile
 * GET /api/users/me
 * 
 * // 4. Update profile
 * PUT /api/users/me
 * 
 * // 5. Delete account (optional)
 * DELETE /api/users/me
 * 
 * @example
 * // Protected routes require valid token
 * const token = localStorage.getItem('token');
 * fetch('/api/users/me', {
 *   headers: {
 *     'Authorization': `Bearer ${token}`
 *   }
 * });
 * 
 * @see {@link module:controllers/UserController} - Controller implementation
 * @see {@link module:middleware/authMiddleware} - Authentication middleware
 * @see {@link module:middleware/rateLimitMiddleware} - Rate limiting configuration
 * @see {@link module:models/User} - User model schema
 */
module.exports = router;
