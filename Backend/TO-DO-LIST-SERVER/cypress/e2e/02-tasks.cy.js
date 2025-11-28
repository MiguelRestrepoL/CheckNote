/// <reference types="cypress" />

/**
 * @fileoverview Pruebas E2E de Gestión de Tareas - CheckNote (FIXED v4)
 * @description Suite completa con manejo robusto de rate limiting y validaciones
 */

describe('Gestión de Tareas - CheckNote', () => {
  const testUser = Cypress.env('testUser');
  
  // Configuración más agresiva para evitar rate limiting
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Espera inicial más larga
    cy.wait(3000);
    
    // Login con retry automático
    cy.loginViaAPI(testUser.correo, testUser.contrasena);
    cy.wait(1000); // Espera adicional después del login
  });

  afterEach(() => {
    cy.wait(1000);
    // Cleanup solo si hay sesión válida
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      if (token && token !== 'null' && token !== 'undefined') {
        cy.cleanupTasks();
      }
    });
    cy.wait(2000); // Espera entre tests
  });

  describe('T25 - Visualización de Tareas', () => {
    it('✅ Listar todas las tareas (T25)', () => {
      cy.visit('/home.html');
      cy.waitForPageLoad();
      
      // Verificar que el body esté visible
      cy.get('body').should('be.visible');
      
      // Verificar estructura del kanban
      cy.get('.kanban-container, #kanban-board').should('exist');
      
      // Verificar columnas (con selectores flexibles)
      cy.get('#pendientes-tasks, [data-estado="pendiente"], .pendientes').should('exist');
      cy.get('#en-progreso-tasks, [data-estado="en_progreso"], .en-progreso').should('exist');
      cy.get('#terminadas-tasks, [data-estado="terminada"], .terminadas').should('exist');
    });

    it('Debe mostrar mensaje cuando no hay tareas', () => {
      cy.cleanupTasks();
      cy.wait(2000);
      cy.visit('/home.html');
      cy.waitForPageLoad();
      
      // Buscar mensaje de "sin tareas" de forma flexible
      cy.get('body').should('contain.text', /no hay tareas|sin tareas|no tienes tareas|lista vacía/i);
    });

    it('Debe mostrar lista de tareas cuando existen', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/tasks`,
          headers: { 'Authorization': `Bearer ${token}` },
          body: {
            titulo: 'Tarea de visualización',
            descripcion: 'Test visualización',
            prioridad: 'media',
            estado: 'pendiente'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(201);
        });
      });
      
      cy.wait(2000);
      cy.visit('/home.html');
      cy.waitForPageLoad();
      
      cy.contains('Tarea de visualización', { timeout: 15000 }).should('be.visible');
    });
  });

  describe('Crear Tarea - Casos Válidos', () => {
    it('✅ T2 - Crear tarea BL4 - CONSEGUIR TRIPLE BYPASS (Media, En Progreso)', () => {
      cy.visit('/crear-tarea.html');
      cy.waitForPageLoad();
      
      cy.get('input#titulo, input[name="titulo"]').should('be.visible').type('CONSEGUIR TRIPLE BYPASS');
      cy.get('textarea#descripcion, textarea[name="descripcion"]').type('BL4');
      cy.get('select#prioridad, select[name="prioridad"]').select('media');
      cy.get('select#estado, select[name="estado"]').select('en_progreso');
      cy.get('input#fechaVencimiento, input[name="fechaVencimiento"], input[type="date"]').type('2025-10-30');
      cy.get('input#hora, input[name="hora"], input[type="time"]').type('14:00');
      
      cy.get('button[type="submit"]').click();
      
      // Esperar redirección y verificar
      cy.wait(4000);
      cy.url({ timeout: 15000 }).should('include', '/home.html');
      cy.contains('CONSEGUIR TRIPLE BYPASS', { timeout: 15000 }).should('exist');
    });

    it('✅ T1 - Crear tarea TTV - TRANSMITIR PROGRAMACION (Baja, Pendiente)', () => {
      cy.visit('/crear-tarea.html');
      cy.waitForPageLoad();
      
      cy.get('input#titulo, input[name="titulo"]').type('TRANSMITIR PROGRAMACION');
      cy.get('textarea#descripcion, textarea[name="descripcion"]').type('TTV');
      cy.get('select#prioridad, select[name="prioridad"]').select('baja');
      cy.get('select#estado, select[name="estado"]').select('pendiente');
      cy.get('input#fechaVencimiento, input[type="date"]').type('2025-10-26');
      cy.get('input#hora, input[type="time"]').type('18:00');
      
      cy.get('button[type="submit"]').click();
      
      cy.wait(4000);
      cy.url({ timeout: 15000 }).should('include', '/home.html');
      cy.contains('TRANSMITIR PROGRAMACION', { timeout: 15000 }).should('exist');
    });

    it('✅ T3 - Crear tarea prioridad alta completada (Alta, Terminada)', () => {
      cy.visit('/crear-tarea.html');
      cy.waitForPageLoad();
      
      cy.get('input#titulo, input[name="titulo"]').type('Tarea Urgente Completada');
      cy.get('textarea#descripcion, textarea[name="descripcion"]').type('Tarea de alta prioridad ya terminada');
      cy.get('select#prioridad, select[name="prioridad"]').select('alta');
      cy.get('select#estado, select[name="estado"]').select('terminada');
      cy.get('input#fechaVencimiento, input[type="date"]').type('2025-11-15');
      cy.get('input#hora, input[type="time"]').type('12:00');
      
      cy.get('button[type="submit"]').click();
      
      cy.wait(4000);
      cy.url({ timeout: 15000 }).should('include', '/home.html');
      cy.contains('Tarea Urgente Completada', { timeout: 15000 }).should('exist');
    });
  });

  describe('Crear Tarea - Casos Inválidos (Título Vacío)', () => {
    it('❌ T4 - Crear sin título', () => {
      cy.visit('/crear-tarea.html');
      cy.waitForPageLoad();
      
      cy.get('textarea#descripcion, textarea[name="descripcion"]').type('Descripción sin título');
      cy.get('select#prioridad, select[name="prioridad"]').select('baja');
      cy.get('select#estado, select[name="estado"]').select('pendiente');
      cy.get('input#fechaVencimiento, input[type="date"]').type('2025-12-01');
      cy.get('input#hora, input[type="time"]').type('10:00');
      
      cy.get('button[type="submit"]').click();
      
      cy.wait(2000);
      
      // Verificar que NO se redirigió a home
      cy.url().should('not.include', '/home.html');
      
      // Verificar validación (HTML5 o mensaje custom)
      cy.get('input#titulo, input[name="titulo"]').then($input => {
        const isInvalid = $input[0].validity && !$input[0].validity.valid;
        if (!isInvalid) {
          cy.get('#error-message, .error, .alert-danger').should('be.visible');
        }
      });
    });

    it('❌ T5 - Crear sin título con fecha pasada', () => {
      cy.visit('/crear-tarea.html');
      cy.waitForPageLoad();
      
      cy.get('textarea#descripcion, textarea[name="descripcion"]').type('Sin título, fecha pasada');
      cy.get('select#prioridad, select[name="prioridad"]').select('media');
      cy.get('select#estado, select[name="estado"]').select('en_progreso');
      cy.get('input#fechaVencimiento, input[type="date"]').type('2024-01-01');
      cy.get('input#hora, input[type="time"]').type('09:00');
      
      cy.get('button[type="submit"]').click();
      
      cy.wait(2000);
      cy.url().should('not.include', '/home.html');
    });

    it('❌ T6 - Crear sin título prioridad alta', () => {
      cy.visit('/crear-tarea.html');
      cy.waitForPageLoad();
      
      cy.get('textarea#descripcion, textarea[name="descripcion"]').type('Alta prioridad sin título');
      cy.get('select#prioridad, select[name="prioridad"]').select('alta');
      cy.get('select#estado, select[name="estado"]').select('terminada');
      cy.get('input#fechaVencimiento, input[type="date"]').type('2025-12-31');
      cy.get('input#hora, input[type="time"]').type('23:59');
      
      cy.get('button[type="submit"]').click();
      
      cy.wait(2000);
      cy.url().should('not.include', '/home.html');
    });
  });

  describe('Crear Tarea - Casos Inválidos (Título Muy Largo)', () => {
    const tituloMuyLargo = 'A'.repeat(256);

    it('❌ T7 - Crear título excede límite', () => {
      cy.visit('/crear-tarea.html');
      cy.waitForPageLoad();
      
      cy.get('input#titulo, input[name="titulo"]').invoke('val', tituloMuyLargo).trigger('input');
      cy.get('textarea#descripcion, textarea[name="descripcion"]').type('Descripción normal');
      cy.get('select#prioridad, select[name="prioridad"]').select('baja');
      cy.get('select#estado, select[name="estado"]').select('en_progreso');
      cy.get('input#fechaVencimiento, input[type="date"]').type('2025-06-15');
      cy.get('input#hora, input[type="time"]').type('15:00');
      
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      cy.url().should('not.include', '/home.html');
    });

    it('❌ T8 - Crear título largo sin fecha válida', () => {
      cy.visit('/crear-tarea.html');
      cy.waitForPageLoad();
      
      cy.get('input#titulo, input[name="titulo"]').invoke('val', tituloMuyLargo).trigger('input');
      cy.get('textarea#descripcion, textarea[name="descripcion"]').type('Descripción');
      cy.get('select#prioridad, select[name="prioridad"]').select('media');
      cy.get('select#estado, select[name="estado"]').select('terminada');
      
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      cy.url().should('not.include', '/home.html');
    });
  });

  describe('Editar Tarea - Casos Válidos', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/tasks`,
          headers: { 'Authorization': `Bearer ${token}` },
          body: {
            titulo: 'Tarea para editar',
            descripcion: 'Descripción original',
            prioridad: 'media',
            estado: 'pendiente'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(201);
          
          const taskId = response.body.task._id;
          const tarea = {
            ...response.body.task,
            id: taskId,
            _id: taskId
          };
          
          // Guardar en todos los formatos posibles
          win.localStorage.setItem('tareaParaEditar', JSON.stringify(tarea));
          win.localStorage.setItem('editTaskId', taskId);
        });
      });
      
      cy.wait(2000);
    });

    it('✅ T12 - Actualizar título y estado (Alta, Terminada)', () => {
      cy.visit('/editar-tarea.html');
      cy.waitForPageLoad();
      cy.wait(2000);
      
      cy.get('input#titulo, input[name="titulo"]').should('be.visible').clear().type('Título actualizado');
      cy.get('select#prioridad, select[name="prioridad"]').select('alta');
      cy.get('select#estado, select[name="estado"]').select('terminada');
      cy.get('input#fecha, input#fechaVencimiento, input[type="date"]').clear().type('2025-11-30');
      cy.get('input#hora, input[type="time"]').clear().type('18:00');
      
      cy.get('button[type="submit"]').click();
      
      cy.wait(4000);
      cy.url({ timeout: 15000 }).should('include', '/home.html');
      cy.contains('Título actualizado', { timeout: 15000 }).should('be.visible');
    });

    it('✅ T13 - Cambiar prioridad a baja', () => {
      cy.visit('/editar-tarea.html');
      cy.waitForPageLoad();
      cy.wait(2000);
      
      cy.get('select#prioridad, select[name="prioridad"]').select('baja');
      cy.get('select#estado, select[name="estado"]').select('pendiente');
      cy.get('button[type="submit"]').click();
      
      cy.wait(4000);
      cy.url({ timeout: 15000 }).should('include', '/home.html');
    });
  });

  describe('Editar Tarea - Casos Inválidos', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/tasks`,
          headers: { 'Authorization': `Bearer ${token}` },
          body: {
            titulo: 'Tarea editar invalido',
            descripcion: 'Test',
            prioridad: 'media',
            estado: 'pendiente'
          },
          failOnStatusCode: false
        }).then((response) => {
          const taskId = response.body.task._id;
          const tarea = {
            ...response.body.task,
            id: taskId,
            _id: taskId
          };
          win.localStorage.setItem('tareaParaEditar', JSON.stringify(tarea));
        });
      });
      
      cy.wait(2000);
    });

    it('❌ T15 - Editar dejando título vacío', () => {
      cy.visit('/editar-tarea.html');
      cy.waitForPageLoad();
      cy.wait(2000);
      
      cy.get('input#titulo, input[name="titulo"]').clear();
      cy.get('button[type="submit"]').click();
      
      cy.wait(2000);
      cy.url().should('not.include', '/home.html');
    });

    it('❌ T17 - Editar con título muy largo', () => {
      cy.visit('/editar-tarea.html');
      cy.waitForPageLoad();
      cy.wait(2000);
      
      const tituloLargo = 'X'.repeat(256);
      cy.get('input#titulo, input[name="titulo"]').invoke('val', tituloLargo).trigger('input');
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      cy.url().should('not.include', '/home.html');
    });
  });

  describe('Eliminar Tarea', () => {
    it('✅ T20 - Eliminar tarea pendiente', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/tasks`,
          headers: { 'Authorization': `Bearer ${token}` },
          body: {
            titulo: 'Tarea para eliminar pendiente',
            descripcion: 'Test delete',
            prioridad: 'baja',
            estado: 'pendiente'
          },
          failOnStatusCode: false
        }).then((response) => {
          const taskId = response.body.task._id;
          const tarea = {
            ...response.body.task,
            id: taskId,
            _id: taskId
          };
          win.localStorage.setItem('tareaParaEliminar', JSON.stringify(tarea));
          win.localStorage.setItem('deleteTaskId', taskId);
        });
      });

      cy.wait(2000);
      cy.visit('/eliminar-tarea.html');
      cy.waitForPageLoad();
      cy.wait(2000);
      
      cy.get('#delete-btn, button[type="submit"], .btn-danger').contains(/eliminar|borrar|delete/i).click();
      cy.wait(4000);
      
      cy.url({ timeout: 15000 }).should('include', '/home.html');
      cy.contains('Tarea para eliminar pendiente').should('not.exist');
    });

    it('✅ T21 - Eliminar tarea en progreso', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/tasks`,
          headers: { 'Authorization': `Bearer ${token}` },
          body: {
            titulo: 'Tarea eliminar progreso',
            descripcion: 'Test',
            prioridad: 'media',
            estado: 'en_progreso'
          },
          failOnStatusCode: false
        }).then((response) => {
          const taskId = response.body.task._id;
          const tarea = {
            ...response.body.task,
            id: taskId,
            _id: taskId
          };
          win.localStorage.setItem('tareaParaEliminar', JSON.stringify(tarea));
        });
      });

      cy.wait(2000);
      cy.visit('/eliminar-tarea.html');
      cy.waitForPageLoad();
      cy.wait(2000);
      
      cy.get('#delete-btn, button[type="submit"], .btn-danger').click();
      cy.wait(4000);
      
      cy.url({ timeout: 15000 }).should('include', '/home.html');
    });

    it('❌ T23 - Eliminar sin autenticación', () => {
      cy.clearLocalStorage();
      cy.clearCookies();
      
      cy.visit('/eliminar-tarea.html');
      cy.wait(3000);
      
      cy.url({ timeout: 10000 }).should('match', /login/i);
    });

    it('Debe cancelar eliminación', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/tasks`,
          headers: { 'Authorization': `Bearer ${token}` },
          body: { 
            titulo: 'No eliminar', 
            descripcion: 'Cancelar test',
            estado: 'pendiente' 
          },
          failOnStatusCode: false
        }).then((response) => {
          const taskId = response.body.task._id;
          const tarea = {
            ...response.body.task,
            id: taskId,
            _id: taskId
          };
          win.localStorage.setItem('tareaParaEliminar', JSON.stringify(tarea));
        });
      });

      cy.wait(2000);
      cy.visit('/eliminar-tarea.html');
      cy.waitForPageLoad();
      cy.wait(2000);
      
      cy.contains(/cancelar|volver|atrás/i).click();
      
      cy.wait(2000);
      cy.url().should('include', '/home.html');
      cy.contains('No eliminar', { timeout: 10000 }).should('be.visible');
    });
  });
});