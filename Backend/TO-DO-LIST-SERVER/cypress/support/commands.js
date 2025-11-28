// ***********************************************
// Comandos personalizados de Cypress para CheckNote
// VERSIÓN MEJORADA v3 - Rate Limiting + Mejor Manejo de Estado
// ***********************************************

/**
 * Comando para hacer login en la UI
 * @example cy.login('correo@example.com', 'password123')
 */
Cypress.Commands.add('login', (correo, contrasena) => {
  cy.visit('/login.html');
  cy.waitForPageLoad();
  
  cy.get('input[name="correo"], input[type="email"]').should('be.visible').type(correo);
  cy.get('input[name="contrasena"], input[type="password"]').type(contrasena);
  cy.get('button[type="submit"]').click();
  
  // Esperar que se guarde el token
  cy.window().its('localStorage').invoke('getItem', 'token').should('exist');
  cy.wait(1000);
});

/**
 * Comando para hacer login mediante API (más rápido para setup)
 * MEJORADO: Con retry automático y mejor manejo de rate limiting
 * @example cy.loginViaAPI('correo@example.com', 'password123')
 */
Cypress.Commands.add('loginViaAPI', (correo, contrasena, retries = 3) => {
  const attemptLogin = (attemptNum) => {
    cy.log(`🔐 Login attempt ${attemptNum}/${retries} - ${correo}`);
    
    return cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/login`,
      body: { correo, contrasena },
      failOnStatusCode: false,
      timeout: 15000
    }).then((response) => {
      cy.log(`📊 Status: ${response.status}`);
      
      // Rate limiting - reintentar con backoff exponencial
      if (response.status === 429) {
        if (attemptNum < retries) {
          const waitTime = 5000 * attemptNum;
          cy.log(`⏳ Rate limited (429). Waiting ${waitTime}ms...`);
          cy.wait(waitTime);
          return attemptLogin(attemptNum + 1);
        } else {
          throw new Error('Rate limit excedido después de múltiples intentos');
        }
      }
      
      // Cuenta bloqueada
      if (response.status === 423) {
        cy.log('⚠️ CUENTA BLOQUEADA:', response.body?.message || 'Sin mensaje');
        cy.unblockAccount(correo);
        cy.wait(3000);
        
        if (attemptNum < retries) {
          return attemptLogin(attemptNum + 1);
        } else {
          throw new Error(`Cuenta bloqueada: ${response.body?.message}`);
        }
      }
      
      // Credenciales incorrectas
      if (response.status === 401) {
        cy.log('❌ CREDENCIALES INCORRECTAS');
        throw new Error('Credenciales incorrectas');
      }
      
      // Otros errores
      if (response.status >= 400 && response.status !== 429 && response.status !== 423) {
        cy.log(`❌ Error ${response.status}: ${response.body?.message || 'Sin mensaje'}`);
        throw new Error(`Login failed with status ${response.status}`);
      }
      
      // Login exitoso
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      
      // Visitar página para tener acceso a window
      cy.visit('/login.html', { failOnStatusCode: false });
      cy.waitForPageLoad();
      
      // Guardar token y usuario en localStorage
      cy.window().then((win) => {
        const token = response.body.data.token;
        const usuario = response.body.data.usuario;
        
        win.localStorage.setItem('token', token);
        win.localStorage.setItem('user', JSON.stringify(usuario));
        
        // Formatos adicionales para compatibilidad
        if (usuario._id) {
          win.localStorage.setItem('userId', usuario._id);
        }
        if (usuario.nombres) {
          win.localStorage.setItem('userName', usuario.nombres);
        }
        
        cy.log('✅ Login exitoso - Token guardado');
      });
    });
  };
  
  return attemptLogin(1);
});

/**
 * Comando para desbloquear cuenta (solo desarrollo)
 * @example cy.unblockAccount('correo@example.com')
 */
Cypress.Commands.add('unblockAccount', (correo) => {
  cy.log(`🔓 Intentando desbloquear: ${correo}`);
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/cleanup-security`,
    failOnStatusCode: false,
    timeout: 10000
  }).then((response) => {
    if (response.status === 200) {
      cy.log('✅ Sistema de seguridad limpiado');
    } else {
      cy.log(`⚠️ No se pudo limpiar (status: ${response.status})`);
    }
  });
});

/**
 * Comando para hacer logout completo
 * @example cy.logout()
 */
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    // Limpiar todos los items de localStorage
    const itemsToRemove = [
      'token',
      'user',
      'userId',
      'userName',
      'tareaParaEditar',
      'tareaParaEliminar',
      'editTaskId',
      'deleteTaskId'
    ];
    
    itemsToRemove.forEach(item => {
      win.localStorage.removeItem(item);
    });
    
    cy.log('🚪 Logout completado');
  });
  
  cy.visit('/login.html');
  cy.waitForPageLoad();
});

/**
 * Comando para registrar un nuevo usuario en la UI
 * @example cy.register(userObject)
 */
Cypress.Commands.add('register', (userData) => {
  cy.visit('/registro.html');
  cy.waitForPageLoad();
  
  cy.get('input[name="nombres"]').should('be.visible').type(userData.nombres);
  cy.get('input[name="apellidos"]').type(userData.apellidos);
  cy.get('input[name="edad"]').type(userData.edad);
  cy.get('input[name="correo"]').type(userData.correo);
  cy.get('input[name="contrasena"]').type(userData.contrasena);
  cy.get('input[name="confirmarContrasena"]').type(userData.contrasena);
  
  cy.get('button[type="submit"]').click();
});

/**
 * Comando para registrar usuario vía API
 * NUEVO: Más rápido y con manejo de rate limiting
 * @example cy.registerViaAPI(userObject)
 */
Cypress.Commands.add('registerViaAPI', (userData, retries = 2) => {
  const attemptRegister = (attemptNum) => {
    cy.log(`📝 Registrando usuario (attempt ${attemptNum}): ${userData.correo}`);
    
    return cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/users/Registro`,
      body: {
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        edad: userData.edad,
        correo: userData.correo,
        contrasena: userData.contrasena,
        confirmarContrasena: userData.contrasena
      },
      failOnStatusCode: false,
      timeout: 15000
    }).then((response) => {
      if (response.status === 429 && attemptNum < retries) {
        const waitTime = 5000 * attemptNum;
        cy.log(`⏳ Rate limited. Waiting ${waitTime}ms...`);
        cy.wait(waitTime);
        return attemptRegister(attemptNum + 1);
      }
      
      if (response.status === 201) {
        cy.log('✅ Usuario registrado exitosamente');
        return cy.wrap({ success: true, data: response.body });
      } else if (response.status === 409) {
        cy.log('ℹ️ Usuario ya existe');
        return cy.wrap({ success: false, status: 409, message: 'Usuario ya existe' });
      } else {
        cy.log(`⚠️ Error al registrar: ${response.status}`);
        return cy.wrap({ success: false, status: response.status });
      }
    });
  };
  
  return attemptRegister(1);
});

/**
 * Comando para limpiar un usuario de prueba (vía API)
 * MEJORADO: Con mejor manejo de errores
 * @example cy.cleanupTestUser('test@example.com', 'password')
 */
Cypress.Commands.add('cleanupTestUser', (correo, contrasena) => {
  cy.log(`🧹 Limpiando usuario: ${correo}`);
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    failOnStatusCode: false,
    body: { correo, contrasena },
    timeout: 15000
  }).then((loginResponse) => {
    if (loginResponse.status === 200) {
      const token = loginResponse.body.data.token;
      
      return cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/users/me`,
        failOnStatusCode: false,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: {
          contrasena: contrasena,
          confirmacion: 'ELIMINAR'
        },
        timeout: 15000
      }).then((deleteResponse) => {
        if (deleteResponse.status === 200) {
          cy.log('✅ Usuario eliminado exitosamente');
        } else {
          cy.log(`⚠️ No se pudo eliminar: ${deleteResponse.status}`);
        }
      });
    } else {
      cy.log(`⚠️ No se pudo hacer login para eliminar: ${loginResponse.status}`);
    }
  });
});

/**
 * Comando para crear una tarea vía API
 * MEJORADO: Con manejo de rate limiting
 * @example cy.createTask(taskData)
 */
Cypress.Commands.add('createTask', (taskData, retries = 2) => {
  const attemptCreate = (attemptNum) => {
    return cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      
      if (!token || token === 'null') {
        throw new Error('No hay token válido para crear tarea');
      }
      
      return cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/tasks`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: taskData,
        failOnStatusCode: false,
        timeout: 15000
      }).then((response) => {
        if (response.status === 429 && attemptNum < retries) {
          const waitTime = 3000 * attemptNum;
          cy.log(`⏳ Rate limited. Waiting ${waitTime}ms...`);
          cy.wait(waitTime);
          return attemptCreate(attemptNum + 1);
        }
        
        if (response.status === 201) {
          cy.log(`✅ Tarea creada: ${taskData.titulo}`);
          return cy.wrap(response.body.task);
        } else {
          cy.log(`❌ Error al crear tarea: ${response.status}`);
          throw new Error(`Failed to create task: ${response.status}`);
        }
      });
    });
  };
  
  return attemptCreate(1);
});

/**
 * Comando para eliminar todas las tareas del usuario
 * MEJORADO: Con mejor manejo de errores y rate limiting
 * @example cy.cleanupTasks()
 */
Cypress.Commands.add('cleanupTasks', () => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    
    if (!token || token === 'null' || token === 'undefined') {
      cy.log('⚠️ No hay token válido, saltando cleanup');
      return cy.wrap(null);
    }
    
    return cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/tasks`,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      failOnStatusCode: false,
      timeout: 15000
    }).then((response) => {
      if (response.status !== 200) {
        cy.log(`⚠️ No se pudo obtener tareas: ${response.status}`);
        return;
      }
      
      const tasks = response.body.tasks || [];
      cy.log(`🧹 Limpiando ${tasks.length} tarea(s)`);
      
      if (tasks.length === 0) {
        return;
      }
      
      // Eliminar tareas con delay incremental
      const deletePromises = tasks.map((task, index) => {
        return cy.wait(800 * index).then(() => {
          return cy.request({
            method: 'DELETE',
            url: `${Cypress.env('apiUrl')}/tasks/${task._id}`,
            headers: {
              'Authorization': `Bearer ${token}`
            },
            failOnStatusCode: false,
            timeout: 10000
          }).then((deleteResponse) => {
            if (deleteResponse.status === 200 || deleteResponse.status === 204) {
              cy.log(`✅ Tarea eliminada: ${task.titulo}`);
            } else {
              cy.log(`⚠️ No se pudo eliminar: ${task.titulo} (${deleteResponse.status})`);
            }
          });
        });
      });
      
      return cy.wrap(Promise.all(deletePromises));
    });
  });
});

/**
 * Comando para verificar mensajes de éxito o error
 * @example cy.checkMessage('Usuario creado exitosamente')
 */
Cypress.Commands.add('checkMessage', (message, options = {}) => {
  const defaultOptions = { timeout: 10000, ...options };
  return cy.contains(message, defaultOptions).should('be.visible');
});

/**
 * Comando para esperar a que cargue la página
 * MEJORADO: Con verificación más robusta
 * @example cy.waitForPageLoad()
 */
Cypress.Commands.add('waitForPageLoad', () => {
  cy.document().its('readyState').should('eq', 'complete');
  cy.wait(500); // Espera adicional para JS
});

/**
 * Comando para interceptar llamadas a la API
 * @example cy.interceptAPI('GET', '/tasks', { fixture: 'tasks.json' })
 */
Cypress.Commands.add('interceptAPI', (method, endpoint, response) => {
  const alias = `api${method}${endpoint.replace(/\//g, '_')}`;
  return cy.intercept(method, `${Cypress.env('apiUrl')}${endpoint}`, response).as(alias);
});

/**
 * Comando para esperar y verificar el estado de autenticación
 * @example cy.waitForAuth()
 */
Cypress.Commands.add('waitForAuth', () => {
  return cy.window().then((win) => {
    expect(win.localStorage.getItem('token')).to.exist;
    expect(win.localStorage.getItem('user')).to.exist;
    cy.log('✅ Usuario autenticado');
  });
});

/**
 * Comando para crear un usuario de prueba si no existe
 * MEJORADO: Con mejor logging y manejo de errores
 * @example cy.ensureTestUser(userData)
 */
Cypress.Commands.add('ensureTestUser', (userData) => {
  cy.log(`🔍 Verificando usuario: ${userData.correo}`);
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/users/Registro`,
    failOnStatusCode: false,
    body: {
      nombres: userData.nombres,
      apellidos: userData.apellidos,
      edad: userData.edad,
      correo: userData.correo,
      contrasena: userData.contrasena,
      confirmarContrasena: userData.contrasena
    },
    timeout: 15000
  }).then((response) => {
    if (response.status === 201) {
      cy.log('✅ Usuario de prueba creado');
      return cy.wrap({ created: true });
    } else if (response.status === 409) {
      cy.log('ℹ️ Usuario de prueba ya existe');
      return cy.wrap({ created: false, exists: true });
    } else if (response.status === 429) {
      cy.log('⚠️ Rate limited - usuario puede existir');
      return cy.wrap({ created: false, rateLimited: true });
    } else {
      cy.log(`⚠️ Estado inesperado: ${response.status}`);
      return cy.wrap({ created: false, status: response.status });
    }
  });
});

/**
 * Comando para actualizar perfil de usuario vía API
 * NUEVO: Útil para tests de perfil
 * @example cy.updateProfile({ nombres: 'Nuevo', apellidos: 'Nombre' })
 */
Cypress.Commands.add('updateProfile', (updateData, retries = 2) => {
  const attemptUpdate = (attemptNum) => {
    return cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No hay token para actualizar perfil');
      }
      
      return cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/users/me`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: updateData,
        failOnStatusCode: false,
        timeout: 15000
      }).then((response) => {
        if (response.status === 429 && attemptNum < retries) {
          const waitTime = 3000 * attemptNum;
          cy.log(`⏳ Rate limited. Waiting ${waitTime}ms...`);
          cy.wait(waitTime);
          return attemptUpdate(attemptNum + 1);
        }
        
        return cy.wrap(response);
      });
    });
  };
  
  return attemptUpdate(1);
});