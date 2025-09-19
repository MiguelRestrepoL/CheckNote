// api/config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CheckNote - TO-DO List API',
    version: '1.2',
    description: `
      API RESTful para gestión de tareas con autenticación JWT.
      
      Características:
      - ✅ Autenticación JWT
      - ✅ CRUD de usuarios
      - ✅ CRUD de tareas
      - ✅ Filtros y búsquedas
      - ✅ Manejo de errores global
      - ✅ Logging avanzado
      
      Cómo usar:
      1. Registra un usuario en /auth/register
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
      url: 'http://localhost:8080',
      description: 'Servidor de desarrollo',
    },
    {
      url: 'https://checknote-27fe.onrender.com',
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
        required: ['nombres', 'apellidos', 'edad', 'correo', 'contrasena'],
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
            minLength: 1,
            maxLength: 100,
            example: 'Completar documentación de API',
          },
          descripcion: {
            type: 'string',
            description: 'Descripción detallada de la tarea',
            maxLength: 500,
            example: 'Crear documentación completa usando Swagger para todos los endpoints',
          },
          completada: {
            type: 'boolean',
            description: 'Estado de completado',
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
          usuarioId: {
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

// Configuración personalizada de la UI
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
  `,
  customSiteTitle: 'CheckNote Documentation',
};

module.exports = { 
  swaggerSpec, 
  swaggerUi, 
  swaggerUiOptions 
};