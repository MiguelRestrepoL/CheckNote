// api/config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CheckNote - TO-DO List API',
    version: '1.5.0',
    description: `
      API RESTful para gestión de tareas con sistema Kanban y autenticación JWT.
      
      Características:
      - ✅ Autenticación JWT con seguridad avanzada
      - ✅ CRUD de usuarios con perfiles
      - ✅ Sistema de tareas Kanban (Pendiente → En Progreso → Terminada)
      - ✅ Rate limiting y bloqueo de cuentas
      - ✅ Recuperación de contraseñas por email
      - ✅ Filtros y búsquedas avanzadas
      - ✅ Manejo de errores global
      - ✅ Logging avanzado
      
      Cómo usar:
      1. Registra un usuario en /users/Registro
      2. Haz login en /auth/login para obtener el token
      3. Usa el token en el botón "Authorize" de arriba
      4. ¡Ya puedes usar todos los endpoints protegidos!
    `,
    contact: {
      name: 'CHECKNOTE Support',
      email: 'https://wa.me/+573145179369',
    },
  },
  servers: [
    {
      url: 'http://localhost:8080/api/v1',
      description: 'Servidor de desarrollo',
    },
    {
      url: 'https://checknote-27fe.onrender.com/api/v1',
      description: 'Servidor de producción',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa tu token JWT obtenido del endpoint /auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        required: ['nombres', 'apellidos', 'edad', 'correo'],
        properties: {
          id: {
            type: 'string',
            description: 'ID único del usuario',
            example: '507f1f77bcf86cd799439011',
          },
          nombres: {
            type: 'string',
            description: 'Nombres del usuario',
            minLength: 2,
            maxLength: 50,
            example: 'Juan Carlos',
          },
          apellidos: {
            type: 'string',
            description: 'Apellidos del usuario',
            minLength: 2,
            maxLength: 50,
            example: 'Pérez García',
          },
          edad: {
            type: 'integer',
            description: 'Edad del usuario',
            minimum: 13,
            example: 25,
          },
          correo: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico único',
            example: 'juan@example.com',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de última actualización',
          },
        },
      },
      UserRegister: {
        type: 'object',
        required: ['nombres', 'apellidos', 'edad', 'correo', 'contrasena', 'confirmarContrasena'],
        properties: {
          nombres: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'Juan Carlos',
          },
          apellidos: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'Pérez García',
          },
          edad: {
            type: 'integer',
            minimum: 13,
            example: 25,
          },
          correo: {
            type: 'string',
            format: 'email',
            example: 'juan@example.com',
          },
          contrasena: {
            type: 'string',
            minLength: 8,
            description: 'Debe contener al menos: 1 mayúscula, 1 número, 1 carácter especial',
            example: 'MiPassword123!',
          },
          confirmarContrasena: {
            type: 'string',
            description: 'Debe coincidir con la contraseña',
            example: 'MiPassword123!',
          },
        },
      },
      UserLogin: {
        type: 'object',
        required: ['correo', 'contrasena'],
        properties: {
          correo: {
            type: 'string',
            format: 'email',
            example: 'juan@example.com',
          },
          contrasena: {
            type: 'string',
            example: 'MiPassword123!',
          },
        },
      },
      Task: {
        type: 'object',
        required: ['titulo'],
        properties: {
          id: {
            type: 'string',
            description: 'ID único de la tarea',
            example: '507f1f77bcf86cd799439011',
          },
          titulo: {
            type: 'string',
            description: 'Título de la tarea',
            minLength: 2,
            maxLength: 100,
            example: 'Completar documentación de API',
          },
          descripcion: {
            type: 'string',
            description: 'Descripción detallada de la tarea',
            maxLength: 500,
            example: 'Crear documentación completa usando Swagger para todos los endpoints',
          },
          estado: {
            type: 'string',
            enum: ['pendiente', 'en_progreso', 'terminada'],
            description: 'Estado de la tarea en el sistema Kanban',
            default: 'pendiente',
            example: 'en_progreso',
          },
          completada: {
            type: 'boolean',
            description: 'Estado de completado (compatibilidad)',
            default: false,
            example: false,
          },
          prioridad: {
            type: 'string',
            enum: ['baja', 'media', 'alta'],
            description: 'Nivel de prioridad',
            default: 'media',
            example: 'alta',
          },
          fechaVencimiento: {
            type: 'string',
            format: 'date',
            description: 'Fecha límite para completar la tarea',
            example: '2025-12-31',
          },
          userId: {
            type: 'string',
            description: 'ID del usuario propietario',
            example: '507f1f77bcf86cd799439011',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de última actualización',
          },
        },
      },
      TaskCreate: {
        type: 'object',
        required: ['titulo'],
        properties: {
          titulo: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'Nueva tarea importante',
          },
          descripcion: {
            type: 'string',
            maxLength: 500,
            example: 'Descripción detallada de la tarea',
          },
          estado: {
            type: 'string',
            enum: ['pendiente', 'en_progreso', 'terminada'],
            default: 'pendiente',
            example: 'pendiente',
          },
          prioridad: {
            type: 'string',
            enum: ['baja', 'media', 'alta'],
            default: 'media',
            example: 'alta',
          },
          fechaVencimiento: {
            type: 'string',
            format: 'date',
            example: '2025-12-31',
          },
        },
      },
      TaskStatusUpdate: {
        type: 'object',
        required: ['estado'],
        properties: {
          estado: {
            type: 'string',
            enum: ['pendiente', 'en_progreso', 'terminada'],
            example: 'en_progreso',
          },
        },
      },
      KanbanBoard: {
        type: 'object',
        properties: {
          board: {
            type: 'object',
            properties: {
              pendiente: {
                type: 'array',
                items: { $ref: '#/components/schemas/Task' },
              },
              en_progreso: {
                type: 'array',
                items: { $ref: '#/components/schemas/Task' },
              },
              terminada: {
                type: 'array',
                items: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          stats: {
            type: 'object',
            properties: {
              pendiente: { type: 'integer', example: 5 },
              en_progreso: { type: 'integer', example: 2 },
              terminada: { type: 'integer', example: 8 },
              total: { type: 'integer', example: 15 },
            },
          },
        },
      },
      PasswordResetRequest: {
        type: 'object',
        required: ['correo'],
        properties: {
          correo: {
            type: 'string',
            format: 'email',
            example: 'juan@example.com',
          },
        },
      },
      PasswordReset: {
        type: 'object',
        required: ['token', 'nuevaContrasena', 'confirmarContrasena'],
        properties: {
          token: {
            type: 'string',
            description: 'Token recibido por email',
            example: 'abc123def456...',
          },
          nuevaContrasena: {
            type: 'string',
            minLength: 8,
            example: 'NuevaPassword123!',
          },
          confirmarContrasena: {
            type: 'string',
            example: 'NuevaPassword123!',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indica si la operación fue exitosa',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Mensaje descriptivo de la operación',
            example: 'Operación completada exitosamente',
          },
          data: {
            type: 'object',
            description: 'Datos de respuesta (varía según endpoint)',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error en la operación',
          },
          error: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          errors: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['El campo es requerido'],
          },
        },
      },
    },
  },
  paths: {
    // AUTENTICACIÓN
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        description: 'Autentica un usuario y devuelve un token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserLogin' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login exitoso' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        usuario: { $ref: '#/components/schemas/User' },
                        expiresIn: { type: 'string', example: '2h' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Credenciales incorrectas' },
          423: { description: 'Cuenta temporalmente bloqueada' },
          429: { description: 'Demasiados intentos de login' },
        },
      },
    },
    '/auth/verify': {
      post: {
        tags: ['Autenticación'],
        summary: 'Verificar token JWT',
        description: 'Verifica si el token JWT es válido',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Token válido',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            usuario: { $ref: '#/components/schemas/User' },
                            tokenInfo: {
                              type: 'object',
                              properties: {
                                issuedAt: { type: 'string', format: 'date-time' },
                                expiresAt: { type: 'string', format: 'date-time' },
                              },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { description: 'Token inválido o expirado' },
        },
      },
    },
    '/auth/request-password-reset': {
      post: {
        tags: ['Autenticación'],
        summary: 'Solicitar recuperación de contraseña',
        description: 'Envía un email con enlace para restablecer contraseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PasswordResetRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Email enviado (siempre responde 200 por seguridad)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Si el email existe, se ha enviado un enlace de recuperación' },
                  },
                },
              },
            },
          },
          429: { description: 'Demasiadas solicitudes de recuperación' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Autenticación'],
        summary: 'Restablecer contraseña',
        description: 'Restablece la contraseña usando el token del email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PasswordReset' },
            },
          },
        },
        responses: {
          200: {
            description: 'Contraseña restablecida exitosamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          400: { description: 'Token inválido o contraseñas no coinciden' },
        },
      },
    },

    // USUARIOS
    '/users/Registro': {
      post: {
        tags: ['Usuarios'],
        summary: 'Registrar nuevo usuario',
        description: 'Crea una nueva cuenta de usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserRegister' },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario creado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Usuario creado exitosamente' },
                    id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Error de validación' },
          409: { description: 'Email ya registrado' },
          429: { description: 'Demasiados intentos de registro' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener mi perfil',
        description: 'Obtiene la información del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Perfil obtenido exitosamente',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { description: 'Token inválido' },
        },
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Actualizar mi perfil',
        description: 'Actualiza la información del usuario autenticado',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombres: { type: 'string', example: 'Juan Carlos' },
                  apellidos: { type: 'string', example: 'Pérez García' },
                  edad: { type: 'integer', example: 26 },
                  correo: { type: 'string', format: 'email', example: 'nuevo@email.com' },
                  contrasenaActual: { type: 'string', example: 'PasswordActual123!' },
                  nuevaContrasena: { type: 'string', example: 'NuevaPassword123!' },
                  confirmarNuevaContrasena: { type: 'string', example: 'NuevaPassword123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Perfil actualizado exitosamente' },
          400: { description: 'Error de validación' },
          401: { description: 'Token inválido' },
        },
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Eliminar mi cuenta',
        description: 'Elimina permanentemente la cuenta del usuario',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['contrasena', 'confirmacion'],
                properties: {
                  contrasena: { type: 'string', example: 'MiPassword123!' },
                  confirmacion: { type: 'string', example: 'ELIMINAR' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cuenta eliminada exitosamente' },
          400: { description: 'Confirmación incorrecta' },
          401: { description: 'Contraseña incorrecta' },
        },
      },
    },

    // TAREAS
    '/tasks': {
      get: {
        tags: ['Tareas'],
        summary: 'Obtener mis tareas',
        description: 'Lista todas las tareas del usuario con filtros opcionales',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'estado',
            in: 'query',
            description: 'Filtrar por estado Kanban',
            schema: {
              type: 'string',
              enum: ['pendiente', 'en_progreso', 'terminada'],
            },
          },
          {
            name: 'prioridad',
            in: 'query',
            description: 'Filtrar por prioridad',
            schema: {
              type: 'string',
              enum: ['baja', 'media', 'alta'],
            },
          },
          {
            name: 'completada',
            in: 'query',
            description: 'Filtrar por estado completado (compatibilidad)',
            schema: {
              type: 'boolean',
            },
          },
          {
            name: 'limite',
            in: 'query',
            description: 'Limitar número de resultados',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
            },
          },
        ],
        responses: {
          200: {
            description: 'Tareas obtenidas exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '5 tarea(s) encontrada(s)' },
                    tasks: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Task' },
                    },
                    stats: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 15 },
                        pendiente: { type: 'integer', example: 5 },
                        en_progreso: { type: 'integer', example: 2 },
                        terminada: { type: 'integer', example: 8 },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Token inválido' },
        },
      },
      post: {
        tags: ['Tareas'],
        summary: 'Crear nueva tarea',
        description: 'Crea una nueva tarea para el usuario autenticado',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskCreate' },
            },
          },
        },
        responses: {
          201: {
            description: 'Tarea creada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Tarea creada exitosamente' },
                    id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    task: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
          400: { description: 'Error de validación' },
          401: { description: 'Token inválido' },
        },
      },
    },
    '/tasks/kanban': {
      get: {
        tags: ['Tareas'],
        summary: 'Obtener tablero Kanban',
        description: 'Obtiene todas las tareas organizadas por columnas Kanban',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Tablero Kanban obtenido exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Tablero Kanban obtenido exitosamente' },
                    data: { $ref: '#/components/schemas/KanbanBoard' },
                  },
                },
              },
            },
          },
          401: { description: 'Token inválido' },
        },
      },
    },
    '/tasks/{id}': {
      get: {
        tags: ['Tareas'],
        summary: 'Obtener tarea específica',
        description: 'Obtiene una tarea específica por su ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la tarea',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Tarea encontrada',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        task: { $ref: '#/components/schemas/Task' },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { description: 'Tarea no encontrada' },
          401: { description: 'Token inválido' },
        },
      },
      put: {
        tags: ['Tareas'],
        summary: 'Actualizar tarea',
        description: 'Actualiza todos los campos de una tarea',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la tarea',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  titulo: { type: 'string', example: 'Título actualizado' },
                  descripcion: { type: 'string', example: 'Nueva descripción' },
                  estado: {
                    type: 'string',
                    enum: ['pendiente', 'en_progreso', 'terminada'],
                    example: 'en_progreso',
                  },
                  prioridad: {
                    type: 'string',
                    enum: ['baja', 'media', 'alta'],
                    example: 'alta',
                  },
                  fechaVencimiento: { type: 'string', format: 'date', example: '2025-12-31' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tarea actualizada exitosamente' },
          400: { description: 'Error de validación' },
          404: { description: 'Tarea no encontrada' },
          401: { description: 'Token inválido' },
        },
      },
      delete: {
        tags: ['Tareas'],
        summary: 'Eliminar tarea',
        description: 'Elimina permanentemente una tarea',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la tarea',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Tarea eliminada exitosamente' },
          404: { description: 'Tarea no encontrada' },
          401: { description: 'Token inválido' },
        },
      },
    },
    '/tasks/{id}/status': {
      patch: {
        tags: ['Tareas'],
        summary: 'Cambiar estado de tarea',
        description: 'Cambia el estado de una tarea en el sistema Kanban (ideal para drag & drop)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la tarea',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskStatusUpdate' },
            },
          },
        },
        responses: {
          200: {
            description: 'Estado de tarea actualizado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Tarea movida a en progreso' },
                    task: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
          400: { description: 'Estado inválido' },
          404: { description: 'Tarea no encontrada' },
          401: { description: 'Token inválido' },
        },
      },
    },
  },
  security: [],
};

const options = {
  swaggerDefinition,
  apis: [
    './api/routes/*.js',
    './api/controllers/*.js',
    './api/models/*.js'
  ],
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    filter: true,
    showRequestDuration: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .info .title { color: #3b82f6 }
    .swagger-ui .scheme-container { margin: 20px 0 }
  `,
  customSiteTitle: 'CheckNote API Documentation',
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};