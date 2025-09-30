/**
 * @fileoverview Main Router - Central routing hub for the application
 * @module routes/index
 * @requires express
 * @requires ./UserRoutes
 * @requires ./AuthRoutes
 * @requires ./TaskRoutes
 * 
 * @description
 * Main router that aggregates all sub-routers for the application.
 * Acts as the central routing hub that organizes API endpoints by feature.
 * 
 * Route structure:
 * - /api/auth/*   - Authentication and authorization endpoints
 * - /api/users/*  - User management endpoints
 * - /api/tasks/*  - Task management and Kanban board endpoints
 * 
 * This router is mounted at /api in the main Express app (server.js),
 * so all routes are prefixed with /api automatically.
 * 
 * @example
 * // In server.js
 * const routes = require('./routes/routes');
 * app.use('/api', routes);
 * 
 * // Results in these endpoint patterns:
 * // POST   /api/auth/login
 * // GET    /api/users/profile
 * // GET    /api/tasks
 * // etc.
 * 
 * @example
 * // How middleware flows through routers:
 * // Request → App → /api → /api/tasks → TaskRoutes → TaskController
 */
const express = require("express");
/**
 * Main Express Router
 * 
 * @type {express.Router}
 * 
 * @description
 * Central router instance that combines all feature-specific routers.
 * All routes in this router will be prefixed with /api when mounted.
 */
const router = express.Router();
/**
 * User routes module
 * 
 * @constant {express.Router}
 * 
 * @description
 * Sub-router handling all user-related endpoints:
 * - User registration (handled in AuthRoutes for POST /register)
 * - User profile retrieval and updates
 * - Password changes
 * - Account deletion
 * 
 * @see {@link module:routes/UserRoutes}
 */
const userRoutes = require("./UserRoutes");
/**
 * Authentication routes module
 * 
 * @constant {express.Router}
 * 
 * @description
 * Sub-router handling authentication and authorization endpoints:
 * - User login and logout
 * - Token verification
 * - Password reset requests
 * - Password reset confirmation
 * - User registration
 * 
 * @see {@link module:routes/AuthRoutes}
 */
const authRoutes = require("./AuthRoutes");
/**
 * Task routes module
 * 
 * @constant {express.Router}
 * 
 * @description
 * Sub-router handling all task management endpoints:
 * - Task CRUD operations (Create, Read, Update, Delete)
 * - Kanban board views
 * - Task state transitions
 * - Bulk operations
 * - Task filtering and search
 * 
 * @see {@link module:routes/TaskRoutes}
 */
const taskRoutes = require("./TaskRoutes");
/**
 * Mount task routes at /tasks
 * 
 * @name use-tasks
 * @function
 * @memberof module:routes/index
 * 
 * @description
 * Mounts the task management router. All task-related endpoints will be
 * accessible under /api/tasks/*.
 * 
 * Endpoints:
 * - GET    /api/tasks           - List all user tasks
 * - POST   /api/tasks           - Create new task
 * - GET    /api/tasks/:id       - Get specific task
 * - PUT    /api/tasks/:id       - Update task
 * - DELETE /api/tasks/:id       - Delete task
 * - GET    /api/tasks/board     - Get Kanban board view
 * - PATCH  /api/tasks/:id/state - Update task state
 * - And more...
 * 
 * @example
 * // Full endpoint path formation:
 * // app.use('/api', routes)  →  router.use('/tasks', taskRoutes)
 * // Result: /api/tasks/*
 */
router.use("/tasks", taskRoutes);
/**
 * Mount user routes at /users
 * 
 * @name use-users
 * @function
 * @memberof module:routes/index
 * 
 * @description
 * Mounts the user management router. All user-related endpoints will be
 * accessible under /api/users/*.
 * 
 * Endpoints:
 * - GET    /api/users/profile        - Get current user profile
 * - PUT    /api/users/profile        - Update user profile
 * - PUT    /api/users/change-password - Change password
 * - DELETE /api/users/account        - Delete user account
 * - And more...
 * 
 * Note: User registration is handled in AuthRoutes at /api/auth/register
 * 
 * @example
 * // Full endpoint path formation:
 * // app.use('/api', routes)  →  router.use('/users', userRoutes)
 * // Result: /api/users/*
 */
router.use("/users", userRoutes);
/**
 * Mount authentication routes at /auth
 * 
 * @name use-auth
 * @function
 * @memberof module:routes/index
 * 
 * @description
 * Mounts the authentication router. All auth-related endpoints will be
 * accessible under /api/auth/*.
 * 
 * Endpoints:
 * - POST   /api/auth/register           - Register new user
 * - POST   /api/auth/login              - User login
 * - POST   /api/auth/logout             - User logout
 * - GET    /api/auth/verify-token       - Verify JWT token
 * - POST   /api/auth/request-reset      - Request password reset
 * - POST   /api/auth/reset-password     - Reset password with token
 * 
 * @example
 * // Full endpoint path formation:
 * // app.use('/api', routes)  →  router.use('/auth', authRoutes)
 * // Result: /api/auth/*
 */
router.use("/auth", authRoutes)
/**
 * Main router export
 * 
 * @exports router
 * @type {express.Router}
 * 
 * @description
 * Exports the configured main router with all sub-routers mounted.
 * This router should be mounted in the main Express application.
 * 
 * Architecture flow:
 * 1. Express App (server.js)
 * 2. Main Router (this file) - mounted at /api
 * 3. Sub-routers (Auth, User, Task) - mounted at specific paths
 * 4. Controllers - handle business logic
 * 5. DAOs - handle database operations
 * 
 * @example
 * // Usage in server.js
 * const express = require('express');
 * const routes = require('./routes/routes');
 * 
 * const app = express();
 * app.use('/api', routes);
 * 
 * // Now all routes are available:
 * // /api/auth/login
 * // /api/users/profile
 * // /api/tasks
 * // etc.
 * 
 * @example
 * // Middleware execution order:
 * // Request to /api/tasks/123
 * //   ↓
 * // 1. App-level middleware (body-parser, cors, etc.)
 * //   ↓
 * // 2. Main router (/api)
 * //   ↓
 * // 3. Task sub-router (/tasks)
 * //   ↓
 * // 4. Route-specific middleware (authMiddleware)
 * //   ↓
 * // 5. TaskController.getTaskById
 */
module.exports = router;
