const TaskController = require('../controllers/TaskController');
const TaskDAO = require('../dao/TaskDAO');

// Mock del TaskDAO
jest.mock('../dao/TaskDAO');

describe('TaskController', () => {
  let taskController;
  let mockReq;
  let mockRes;

  // Datos de usuarios de prueba
  const mockUsers = {
    miguel: {
      _id: '507f1f77bcf86cd799439011',
      nombres: 'Miguel',
      apellidos: 'Restrepo',
      correo: 'miguelrestrep0@gmail.com'
    },
    natalia: {
      _id: '507f1f77bcf86cd799439012',
      nombres: 'Natalia',
      apellidos: 'Gonzalez',
      correo: 'natagonzalez@gmail.com'
    }
  };

  beforeEach(() => {
    taskController = new TaskController();
    
    // Mock de request
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: mockUsers.miguel
    };

    // Mock de response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('_validateUser', () => {
    test('Debe validar usuario autenticado correctamente', () => {
      const result = taskController._validateUser(mockReq, mockRes);
      
      expect(result.error).toBe(false);
      expect(result.userId).toBe(mockUsers.miguel._id);
    });

    test('Debe rechazar cuando no hay usuario', () => {
      mockReq.user = null;
      
      const result = taskController._validateUser(mockReq, mockRes);
      
      expect(result.error).toBe(true);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no autenticado'
      });
    });

    test('Debe rechazar cuando no hay userId', () => {
      mockReq.user = { nombres: 'Miguel' };
      
      const result = taskController._validateUser(mockReq, mockRes);
      
      expect(result.error).toBe(true);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Datos de usuario inválidos'
      });
    });
  });

  describe('create', () => {
    test('Debe crear tarea BL4 - CONSEGUIR TRIPLE BYPASS exitosamente', async () => {
      const taskData = {
        titulo: 'CONSEGUIR TRIPLE BYPASS',
        descripcion: 'BL4',
        fechaVencimiento: '2025-10-30T23:59:59Z',
        prioridad: 'media',
        estado: 'en_progreso'
      };

      mockReq.body = taskData;

      const mockCreatedTask = {
        _id: '670f1f77bcf86cd799439020',
        titulo: 'CONSEGUIR TRIPLE BYPASS',
        descripcion: 'BL4',
        fechaVencimiento: new Date('2025-10-30T23:59:59Z'),
        prioridad: 'media',
        estado: 'en_progreso',
        completada: false,
        userId: mockUsers.miguel._id,
        createdAt: new Date(),
        toJSON: jest.fn().mockReturnThis()
      };

      TaskDAO.createTask.mockResolvedValue(mockCreatedTask);

      await taskController.create(mockReq, mockRes);

      expect(TaskDAO.createTask).toHaveBeenCalledWith({
        titulo: 'CONSEGUIR TRIPLE BYPASS',
        descripcion: 'BL4',
        prioridad: 'media',
        estado: 'en_progreso',
        fechaVencimiento: expect.any(Date),
        userId: mockUsers.miguel._id
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea creada exitosamente',
        id: mockCreatedTask._id,
        task: mockCreatedTask
      });
    });

    test('Debe crear tarea TTV - TRANSMITIR PROGRAMACION exitosamente', async () => {
      const taskData = {
        titulo: 'TRANSMITIR PROGRAMACION',
        descripcion: 'TTV',
        fechaVencimiento: '2025-10-26T23:59:59Z',
        prioridad: 'baja',
        estado: 'pendiente'
      };

      mockReq.body = taskData;

      const mockCreatedTask = {
        _id: '670f1f77bcf86cd799439021',
        titulo: 'TRANSMITIR PROGRAMACION',
        descripcion: 'TTV',
        fechaVencimiento: new Date('2025-10-26T23:59:59Z'),
        prioridad: 'baja',
        estado: 'pendiente',
        completada: false,
        userId: mockUsers.miguel._id,
        createdAt: new Date(),
        toJSON: jest.fn().mockReturnThis()
      };

      TaskDAO.createTask.mockResolvedValue(mockCreatedTask);

      await taskController.create(mockReq, mockRes);

      expect(TaskDAO.createTask).toHaveBeenCalledWith({
        titulo: 'TRANSMITIR PROGRAMACION',
        descripcion: 'TTV',
        prioridad: 'baja',
        estado: 'pendiente',
        fechaVencimiento: expect.any(Date),
        userId: mockUsers.miguel._id
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('Debe crear tarea con valores por defecto', async () => {
      mockReq.body = {
        titulo: 'Tarea simple'
      };

      const mockCreatedTask = {
        _id: '670f1f77bcf86cd799439022',
        titulo: 'Tarea simple',
        descripcion: '',
        prioridad: 'media',
        estado: 'pendiente',
        userId: mockUsers.miguel._id,
        toJSON: jest.fn().mockReturnThis()
      };

      TaskDAO.createTask.mockResolvedValue(mockCreatedTask);

      await taskController.create(mockReq, mockRes);

      expect(TaskDAO.createTask).toHaveBeenCalledWith({
        titulo: 'Tarea simple',
        descripcion: '',
        prioridad: 'media',
        estado: 'pendiente',
        fechaVencimiento: undefined,
        userId: mockUsers.miguel._id
      });
    });

    test('Debe rechazar cuando falta el título', async () => {
      mockReq.body = {
        descripcion: 'Sin título'
      };

      await taskController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El título de la tarea es requerido',
        required: ['titulo']
      });
    });

    test('Debe rechazar título vacío', async () => {
      mockReq.body = {
        titulo: '   '
      };

      await taskController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El título de la tarea es requerido',
        required: ['titulo']
      });
    });

    test('Debe rechazar prioridad inválida', async () => {
      mockReq.body = {
        titulo: 'Tarea con prioridad inválida',
        prioridad: 'urgente'
      };

      await taskController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La prioridad debe ser: baja, media o alta'
      });
    });

    test('Debe rechazar estado inválido', async () => {
      mockReq.body = {
        titulo: 'Tarea con estado inválido',
        estado: 'cancelada'
      };

      await taskController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El estado debe ser: pendiente, en_progreso o terminada'
      });
    });

    test('Debe rechazar formato de fecha inválido', async () => {
      mockReq.body = {
        titulo: 'Tarea',
        fechaVencimiento: 'fecha-invalida'
      };

      await taskController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de fecha inválido'
      });
    });

    test('Debe rechazar fecha de vencimiento pasada', async () => {
      mockReq.body = {
        titulo: 'Tarea',
        fechaVencimiento: '2020-01-01T00:00:00Z'
      };

      await taskController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La fecha de vencimiento debe ser futura'
      });
    });

    test('Debe manejar errores de validación de Mongoose', async () => {
      mockReq.body = {
        titulo: 'Tarea'
      };

      const mockValidationError = {
        name: 'ValidationError',
        errors: {
          titulo: { message: 'Título es requerido' }
        }
      };

      TaskDAO.createTask.mockRejectedValue(mockValidationError);

      await taskController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: ['Título es requerido']
      });
    });

    test('Debe manejar errores internos del servidor', async () => {
      mockReq.body = {
        titulo: 'Tarea'
      };

      TaskDAO.createTask.mockRejectedValue(new Error('Error desconocido'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await taskController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAll', () => {
    const mockTasks = [
      {
        _id: '670f1f77bcf86cd799439020',
        titulo: 'CONSEGUIR TRIPLE BYPASS',
        descripcion: 'BL4',
        prioridad: 'media',
        estado: 'en_progreso',
        completada: false,
        userId: mockUsers.miguel._id
      },
      {
        _id: '670f1f77bcf86cd799439021',
        titulo: 'TRANSMITIR PROGRAMACION',
        descripcion: 'TTV',
        prioridad: 'baja',
        estado: 'pendiente',
        completada: false,
        userId: mockUsers.miguel._id
      }
    ];

    test('Debe obtener todas las tareas del usuario', async () => {
      const mockStats = {
        total: 2,
        pendiente: 1,
        en_progreso: 1,
        terminada: 0,
        completadas: 0,
        pendientes: 2,
        prioridadAlta: 0
      };

      TaskDAO.getTasksByUserId.mockResolvedValue(mockTasks);
      TaskDAO.getTaskStats.mockResolvedValue(mockStats);

      await taskController.getAll(mockReq, mockRes);

      expect(TaskDAO.getTasksByUserId).toHaveBeenCalledWith(mockUsers.miguel._id, {});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '2 tarea(s) encontrada(s)',
        tasks: mockTasks,
        stats: {
          total: 2,
          pendiente: 1,
          en_progreso: 1,
          terminada: 0,
          completadas: 0,
          pendientes: 2,
          prioridadAlta: 0
        },
        filters: {
          estado: 'todas',
          completada: 'todas',
          prioridad: 'todas'
        }
      });
    });

    test('Debe filtrar tareas por estado pendiente', async () => {
      mockReq.query = { estado: 'pendiente' };

      const filteredTasks = [mockTasks[1]];
      
      TaskDAO.getTasksByUserId.mockResolvedValue(filteredTasks);
      TaskDAO.getTaskStats.mockResolvedValue({
        total: 1,
        pendiente: 1,
        en_progreso: 0,
        terminada: 0
      });

      await taskController.getAll(mockReq, mockRes);

      expect(TaskDAO.getTasksByUserId).toHaveBeenCalledWith(
        mockUsers.miguel._id,
        { estado: 'pendiente' }
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tasks: filteredTasks
        })
      );
    });

    test('Debe filtrar tareas por estado en_progreso', async () => {
      mockReq.query = { estado: 'en_progreso' };

      const filteredTasks = [mockTasks[0]];
      
      TaskDAO.getTasksByUserId.mockResolvedValue(filteredTasks);
      TaskDAO.getTaskStats.mockResolvedValue({
        total: 1,
        pendiente: 0,
        en_progreso: 1,
        terminada: 0
      });

      await taskController.getAll(mockReq, mockRes);

      expect(TaskDAO.getTasksByUserId).toHaveBeenCalledWith(
        mockUsers.miguel._id,
        { estado: 'en_progreso' }
      );
    });

    test('Debe filtrar tareas por prioridad', async () => {
      mockReq.query = { prioridad: 'media' };

      const filteredTasks = [mockTasks[0]];
      
      TaskDAO.getTasksByUserId.mockResolvedValue(filteredTasks);
      TaskDAO.getTaskStats.mockResolvedValue({});

      await taskController.getAll(mockReq, mockRes);

      expect(TaskDAO.getTasksByUserId).toHaveBeenCalledWith(
        mockUsers.miguel._id,
        { prioridad: 'media' }
      );
    });

    test('Debe limitar cantidad de tareas', async () => {
      mockReq.query = { limite: '1' };

      TaskDAO.getTasksByUserId.mockResolvedValue(mockTasks);
      TaskDAO.getTaskStats.mockResolvedValue({});

      await taskController.getAll(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '1 tarea(s) encontrada(s)',
          tasks: [mockTasks[0]]
        })
      );
    });

    test('Debe manejar errores internos', async () => {
      TaskDAO.getTasksByUserId.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await taskController.getAll(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getKanbanBoard', () => {
    test('Debe obtener tablero Kanban completo', async () => {
      const mockBoard = {
        pendiente: [
          {
            _id: '670f1f77bcf86cd799439021',
            titulo: 'TRANSMITIR PROGRAMACION',
            estado: 'pendiente'
          }
        ],
        en_progreso: [
          {
            _id: '670f1f77bcf86cd799439020',
            titulo: 'CONSEGUIR TRIPLE BYPASS',
            estado: 'en_progreso'
          }
        ],
        terminada: []
      };

      const mockStats = {
        pendiente: 1,
        en_progreso: 1,
        terminada: 0,
        total: 2
      };

      TaskDAO.getTasksByBoard.mockResolvedValue(mockBoard);
      TaskDAO.getBoardStats.mockResolvedValue(mockStats);

      await taskController.getKanbanBoard(mockReq, mockRes);

      expect(TaskDAO.getTasksByBoard).toHaveBeenCalledWith(mockUsers.miguel._id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tablero Kanban obtenido exitosamente',
        data: {
          board: mockBoard,
          stats: mockStats
        }
      });
    });

    test('Debe manejar errores al obtener tablero', async () => {
      TaskDAO.getTasksByBoard.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await taskController.getKanbanBoard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateTaskStatus', () => {
    test('Debe actualizar estado de tarea a terminada', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };
      mockReq.body = { estado: 'terminada' };

      const mockUpdatedTask = {
        _id: '670f1f77bcf86cd799439020',
        titulo: 'CONSEGUIR TRIPLE BYPASS',
        estado: 'terminada',
        toJSON: jest.fn().mockReturnThis()
      };

      TaskDAO.updateTaskStatus.mockResolvedValue(mockUpdatedTask);

      await taskController.updateTaskStatus(mockReq, mockRes);

      expect(TaskDAO.updateTaskStatus).toHaveBeenCalledWith(
        '670f1f77bcf86cd799439020',
        mockUsers.miguel._id,
        'terminada'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea movida a terminada',
        task: mockUpdatedTask
      });
    });

    test('Debe rechazar estado inválido', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };
      mockReq.body = { estado: 'cancelada' };

      await taskController.updateTaskStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Estado inválido. Debe ser: pendiente, en_progreso o terminada'
      });
    });

    test('Debe retornar 404 cuando la tarea no existe', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439099' };
      mockReq.body = { estado: 'terminada' };

      TaskDAO.updateTaskStatus.mockResolvedValue(null);

      await taskController.updateTaskStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tarea no encontrada'
      });
    });
  });

  describe('bulkUpdateStatus', () => {
    test('Debe actualizar múltiples tareas exitosamente', async () => {
      mockReq.body = {
        taskIds: ['670f1f77bcf86cd799439020', '670f1f77bcf86cd799439021'],
        estado: 'terminada'
      };

      TaskDAO.bulkUpdateStatus.mockResolvedValue(2);

      await taskController.bulkUpdateStatus(mockReq, mockRes);

      expect(TaskDAO.bulkUpdateStatus).toHaveBeenCalledWith(
        ['670f1f77bcf86cd799439020', '670f1f77bcf86cd799439021'],
        mockUsers.miguel._id,
        'terminada'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '2 tarea(s) actualizada(s) a terminada',
        updatedCount: 2
      });
    });

    test('Debe rechazar cuando no se proporciona array de IDs', async () => {
      mockReq.body = { estado: 'terminada' };

      await taskController.bulkUpdateStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requiere un array de IDs de tareas'
      });
    });

    test('Debe rechazar array vacío de IDs', async () => {
      mockReq.body = {
        taskIds: [],
        estado: 'terminada'
      };

      await taskController.bulkUpdateStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requiere un array de IDs de tareas'
      });
    });
  });

    describe('getById', () => {
    test('Debe obtener tarea BL4 por ID', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };

      const mockTask = {
        _id: '670f1f77bcf86cd799439020',
        titulo: 'CONSEGUIR TRIPLE BYPASS',
        descripcion: 'BL4',
        estado: 'en_progreso',
        prioridad: 'media'
      };

      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockTask);

      await taskController.getById(mockReq, mockRes);

      expect(TaskDAO.getTaskByIdAndUser).toHaveBeenCalledWith(
        '670f1f77bcf86cd799439020',
        mockUsers.miguel._id
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea encontrada',
        task: mockTask
      });
    });

    test('Debe retornar 404 cuando no se encuentra la tarea', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439099' };

      TaskDAO.getTaskByIdAndUser.mockResolvedValue(null);

      await taskController.getById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tarea no encontrada'
      });
    });

    test('Debe manejar errores internos', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };

      TaskDAO.getTaskByIdAndUser.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await taskController.getById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('update', () => {
    test('Debe actualizar tarea BL4 exitosamente', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };
      mockReq.body = {
        titulo: 'CONSEGUIR QUAD BYPASS',
        descripcion: 'BL4 actualizado',
        prioridad: 'alta'
      };

      const mockExistingTask = {
        _id: '670f1f77bcf86cd799439020',
        titulo: 'CONSEGUIR TRIPLE BYPASS'
      };

      const mockUpdatedTask = {
        _id: '670f1f77bcf86cd799439020',
        titulo: 'CONSEGUIR QUAD BYPASS',
        descripcion: 'BL4 actualizado',
        prioridad: 'alta',
        toJSON: jest.fn().mockReturnThis()
      };

      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockExistingTask);
      TaskDAO.updateTask.mockResolvedValue(mockUpdatedTask);

      await taskController.update(mockReq, mockRes);

      expect(TaskDAO.updateTask).toHaveBeenCalledWith(
        '670f1f77bcf86cd799439020',
        mockUsers.miguel._id,
        {
          titulo: 'CONSEGUIR QUAD BYPASS',
          descripcion: 'BL4 actualizado',
          prioridad: 'alta'
        }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea actualizada exitosamente',
        task: mockUpdatedTask
      });
    });

    test('Debe actualizar solo el estado de la tarea', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };
      mockReq.body = { estado: 'terminada' };

      const mockExistingTask = {
        _id: '670f1f77bcf86cd799439020',
        titulo: 'CONSEGUIR TRIPLE BYPASS',
        estado: 'en_progreso'
      };

      const mockUpdatedTask = {
        _id: '670f1f77bcf86cd799439020',
        titulo: 'CONSEGUIR TRIPLE BYPASS',
        estado: 'terminada',
        toJSON: jest.fn().mockReturnThis()
      };

      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockExistingTask);
      TaskDAO.updateTask.mockResolvedValue(mockUpdatedTask);

      await taskController.update(mockReq, mockRes);

      expect(TaskDAO.updateTask).toHaveBeenCalledWith(
        '670f1f77bcf86cd799439020',
        mockUsers.miguel._id,
        { estado: 'terminada' }
      );
    });

    test('Debe rechazar título vacío', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };
      mockReq.body = { titulo: '   ' };

      const mockExistingTask = { _id: '670f1f77bcf86cd799439020' };
      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockExistingTask);

      await taskController.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El título no puede estar vacío'
      });
    });

    test('Debe rechazar estado inválido', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };
      mockReq.body = { estado: 'cancelada' };

      const mockExistingTask = { _id: '670f1f77bcf86cd799439020' };
      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockExistingTask);

      await taskController.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Estado inválido'
      });
    });

    test('Debe rechazar prioridad inválida', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };
      mockReq.body = { prioridad: 'urgente' };

      const mockExistingTask = { _id: '670f1f77bcf86cd799439020' };
      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockExistingTask);

      await taskController.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La prioridad debe ser: baja, media o alta'
      });
    });

    test('Debe retornar 404 si la tarea no existe', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439099' };
      mockReq.body = { titulo: 'Nuevo título' };

      TaskDAO.getTaskByIdAndUser.mockResolvedValue(null);

      await taskController.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tarea no encontrada'
      });
    });

    test('Debe manejar errores de validación de Mongoose', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };
      mockReq.body = { titulo: 'Nuevo título' };

      const mockExistingTask = { _id: '670f1f77bcf86cd799439020' };
      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockExistingTask);

      const mockValidationError = {
        name: 'ValidationError',
        errors: {
          titulo: { message: 'Título es requerido' }
        }
      };

      TaskDAO.updateTask.mockRejectedValue(mockValidationError);

      await taskController.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: ['Título es requerido']
      });
    });

    test('Debe manejar errores internos del servidor', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };
      mockReq.body = { titulo: 'Nuevo título' };

      const mockExistingTask = { _id: '670f1f77bcf86cd799439020' };
      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockExistingTask);
      TaskDAO.updateTask.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await taskController.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('delete', () => {
    test('Debe eliminar tarea BL4 exitosamente', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };

      const mockDeletedTask = {
        _id: '670f1f77bcf86cd799439020',
        titulo: 'CONSEGUIR TRIPLE BYPASS'
      };

      TaskDAO.deleteTask.mockResolvedValue(mockDeletedTask);

      await taskController.delete(mockReq, mockRes);

      expect(TaskDAO.deleteTask).toHaveBeenCalledWith(
        '670f1f77bcf86cd799439020',
        mockUsers.miguel._id
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea eliminada exitosamente',
        deletedTask: {
          id: '670f1f77bcf86cd799439020',
          titulo: 'CONSEGUIR TRIPLE BYPASS'
        }
      });
    });

    test('Debe retornar 404 cuando la tarea no existe', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439099' };

      TaskDAO.deleteTask.mockResolvedValue(null);

      await taskController.delete(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tarea no encontrada'
      });
    });

    test('Debe manejar errores internos del servidor', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };

      TaskDAO.deleteTask.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await taskController.delete(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('toggleStatus', () => {
    test('Debe cambiar estado de pendiente a completada', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };

      const mockCurrentTask = {
        _id: '670f1f77bcf86cd799439020',
        completada: false
      };

      const mockUpdatedTask = {
        _id: '670f1f77bcf86cd799439020',
        completada: true,
        toJSON: jest.fn().mockReturnThis()
      };

      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockCurrentTask);
      TaskDAO.toggleTaskStatus.mockResolvedValue(mockUpdatedTask);

      await taskController.toggleStatus(mockReq, mockRes);

      expect(TaskDAO.toggleTaskStatus).toHaveBeenCalledWith(
        '670f1f77bcf86cd799439020',
        mockUsers.miguel._id,
        true
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea marcada como completada',
        task: mockUpdatedTask
      });
    });

    test('Debe cambiar estado de completada a pendiente', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };

      const mockCurrentTask = {
        _id: '670f1f77bcf86cd799439020',
        completada: true
      };

      const mockUpdatedTask = {
        _id: '670f1f77bcf86cd799439020',
        completada: false,
        toJSON: jest.fn().mockReturnThis()
      };

      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockCurrentTask);
      TaskDAO.toggleTaskStatus.mockResolvedValue(mockUpdatedTask);

      await taskController.toggleStatus(mockReq, mockRes);

      expect(TaskDAO.toggleTaskStatus).toHaveBeenCalledWith(
        '670f1f77bcf86cd799439020',
        mockUsers.miguel._id,
        false
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tarea marcada como pendiente',
        task: mockUpdatedTask
      });
    });

    test('Debe retornar 404 cuando la tarea no existe', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439099' };

      TaskDAO.getTaskByIdAndUser.mockResolvedValue(null);

      await taskController.toggleStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tarea no encontrada'
      });
    });

    test('Debe manejar errores internos del servidor', async () => {
      mockReq.params = { id: '670f1f77bcf86cd799439020' };

      const mockCurrentTask = { _id: '670f1f77bcf86cd799439020', completada: false };
      TaskDAO.getTaskByIdAndUser.mockResolvedValue(mockCurrentTask);
      TaskDAO.toggleTaskStatus.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await taskController.toggleStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Intenta de nuevo más tarde'
      });

      consoleErrorSpy.mockRestore();
    });
  });
});