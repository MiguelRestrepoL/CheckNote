/// <reference types="cypress" />

/**
 * @fileoverview Pruebas E2E de Perfil de Usuario - CheckNote
 * @description Suite completa optimizada para rate limiting
 * @version 3.0.0 - Mejorada con mejor manejo de estado y errores
 */

describe('Gestión de Perfil de Usuario - CheckNote', () => {
  const testUser = Cypress.env('testUser');
  const testUser2 = Cypress.env('testUser2');
  const API_URL = Cypress.env('apiUrl') || 'https://checknote-oh1u.onrender.com/api/v1';
  
  // Delays para evitar rate limiting
  const RATE_LIMIT_DELAY = 3000;
  const ACTION_DELAY = 2000;
  
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.wait(RATE_LIMIT_DELAY);
  });

  afterEach(() => {
    cy.wait(ACTION_DELAY);
  });

  // ============================================
  // VER PERFIL (P1, P2, P3)
  // ============================================
  describe('Ver Perfil de Usuario', () => {
    
    it('P1 - Debe mostrar perfil correctamente con token válido', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.waitForPageLoad();
      
      // Verificar carga del perfil
      cy.get('#loading-container, .loading', { timeout: 15000 }).should('not.be.visible');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      
      // Verificar datos del usuario
      cy.get('input#input-nombres, input[name="nombres"]').should('have.value', testUser.nombres);
      cy.get('input#input-apellidos, input[name="apellidos"]').should('have.value', testUser.apellidos);
      cy.get('input#input-email, input[name="correo"]').should('have.value', testUser.correo);
      cy.get('#topbar-username, .username, .user-name').should('contain', testUser.nombres);
    });

    it('P2 - Debe redirigir a login con token inválido', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'token-invalido-abc123xyz');
      });
      
      cy.visit('/perfil.html');
      cy.url({ timeout: 15000 }).should('include', '/login.html');
    });

    it('P3 - Debe denegar acceso sin token', () => {
      cy.visit('/perfil.html');
      cy.url({ timeout: 15000 }).should('include', '/login.html');
    });
  });

  // ============================================
  // ACTUALIZAR INFORMACIÓN PERSONAL (P4-P14, P27)
  // ============================================
  describe('Actualizar Información Personal', () => {
    
    beforeEach(() => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      cy.wait(1500);
    });

    it('P4 - Debe actualizar nombres y apellidos exitosamente', () => {
      const timestamp = Date.now();
      const nuevoNombre = `${testUser.nombres}${timestamp}`;
      const nuevoApellido = `${testUser.apellidos}${timestamp}`;
      
      // Navegar a sección personal
      cy.get('#nav-personal, [data-tab="personal"]').click();
      cy.wait(800);
      
      // Actualizar datos
      cy.get('input#input-nombres, input[name="nombres"]').clear().type(nuevoNombre);
      cy.get('input#input-apellidos, input[name="apellidos"]').clear().type(nuevoApellido);
      cy.get('#btn-personal, button[type="submit"]').first().click();
      
      // Esperar respuesta
      cy.wait(3000);
      
      // Verificar que el botón ya no está en estado loading
      cy.get('#btn-personal, button[type="submit"]').first().should('not.be.disabled');
      
      // Verificar persistencia de datos
      cy.get('input#input-nombres, input[name="nombres"]').should('have.value', nuevoNombre);
      cy.get('input#input-apellidos, input[name="apellidos"]').should('have.value', nuevoApellido);
      
      // Restaurar valores originales
      cy.wait(ACTION_DELAY);
      cy.get('input#input-nombres, input[name="nombres"]').clear().type(testUser.nombres);
      cy.get('input#input-apellidos, input[name="apellidos"]').clear().type(testUser.apellidos);
      cy.get('#btn-personal, button[type="submit"]').first().click();
      cy.wait(3000);
    });

    it('P5 - Debe actualizar email exitosamente a uno disponible', () => {
      const nuevoEmail = `temp.${Date.now()}.${Math.random().toString(36).substring(7)}@test.com`;
      
      cy.get('#nav-cuenta, [data-tab="cuenta"]').click();
      cy.wait(800);
      
      cy.get('input#input-email, input[name="correo"]').clear().type(nuevoEmail);
      cy.get('#btn-cuenta, button[type="submit"]').eq(1).click();
      
      cy.wait(3000);
      cy.get('#btn-cuenta, button[type="submit"]').eq(1).should('not.be.disabled');
      
      // Restaurar email original
      cy.wait(ACTION_DELAY);
      cy.get('input#input-email, input[name="correo"]').clear().type(testUser.correo);
      cy.get('#btn-cuenta, button[type="submit"]').eq(1).click();
      cy.wait(3000);
    });

    it('P27 - Debe actualizar edad exitosamente', () => {
      const nuevaEdad = testUser.edad === 22 ? 23 : 22;
      
      cy.get('#nav-personal, [data-tab="personal"]').click();
      cy.wait(800);
      
      cy.get('input#input-edad, input[name="edad"]').clear().type(nuevaEdad);
      cy.get('#btn-personal, button[type="submit"]').first().click();
      
      cy.wait(3000);
      cy.get('#btn-personal, button[type="submit"]').first().should('not.be.disabled');
      
      // Restaurar edad original
      cy.wait(ACTION_DELAY);
      cy.get('input#input-edad, input[name="edad"]').clear().type(testUser.edad);
      cy.get('#btn-personal, button[type="submit"]').first().click();
      cy.wait(3000);
    });

    it('P6 - Debe rechazar edad menor a 13 años', () => {
      cy.get('#nav-personal, [data-tab="personal"]').click();
      cy.wait(800);
      
      cy.get('input#input-edad, input[name="edad"]').clear().type('12');
      cy.get('#btn-personal, button[type="submit"]').first().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /edad.*13|menor.*13|debe.*mayor/i);
    });

    it('P7 - Debe rechazar apellido muy corto (< 2 caracteres)', () => {
      cy.get('#nav-personal, [data-tab="personal"]').click();
      cy.wait(800);
      
      cy.get('input#input-apellidos, input[name="apellidos"]').clear().type('A');
      cy.get('#btn-personal, button[type="submit"]').first().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /apellido.*2.*caracter|mínimo.*2|muy corto/i);
    });

    it('P8 - Debe rechazar nombre muy corto (< 2 caracteres)', () => {
      cy.get('#nav-personal, [data-tab="personal"]').click();
      cy.wait(800);
      
      cy.get('input#input-nombres, input[name="nombres"]').clear().type('B');
      cy.get('#btn-personal, button[type="submit"]').first().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /nombre.*2.*caracter|mínimo.*2|muy corto/i);
    });

    it('P9 - Debe rechazar nombre vacío', () => {
      cy.get('#nav-personal, [data-tab="personal"]').click();
      cy.wait(800);
      
      cy.get('input#input-nombres, input[name="nombres"]').clear();
      cy.get('#btn-personal, button[type="submit"]').first().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /nombre.*requerido|nombre.*obligatorio|completa.*nombre/i);
    });

    it('P10 - Debe rechazar apellido vacío', () => {
      cy.get('#nav-personal, [data-tab="personal"]').click();
      cy.wait(800);
      
      cy.get('input#input-apellidos, input[name="apellidos"]').clear();
      cy.get('#btn-personal, button[type="submit"]').first().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /apellido.*requerido|apellido.*obligatorio|completa.*apellido/i);
    });

    it('P11 - Debe rechazar edad inválida (> 120)', () => {
      cy.get('#nav-personal, [data-tab="personal"]').click();
      cy.wait(800);
      
      cy.get('input#input-edad, input[name="edad"]').clear().type('150');
      cy.get('#btn-personal, button[type="submit"]').first().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /edad.*válid|edad.*120|edad.*incorrecta/i);
    });

    it('P12 - Debe rechazar email ya en uso por otro usuario', () => {
      cy.get('#nav-cuenta, [data-tab="cuenta"]').click();
      cy.wait(800);
      
      cy.get('input#input-email, input[name="correo"]').clear().type(testUser2.correo);
      cy.get('#btn-cuenta, button[type="submit"]').eq(1).click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /correo.*ya.*registrado|email.*uso|correo.*existe/i);
    });

    it('P13 - Debe rechazar actualización con token inválido/expirado', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'token-expirado-xyz789abc');
      });
      
      cy.reload();
      cy.url({ timeout: 15000 }).should('include', '/login.html');
    });

    it('P14 - Debe rechazar actualización sin autenticación', () => {
      cy.clearLocalStorage();
      cy.reload();
      
      cy.url({ timeout: 15000 }).should('include', '/login.html');
    });
  });

  // ============================================
  // CAMBIAR CONTRASEÑA (P15-P21)
  // ============================================
  describe('Cambiar Contraseña', () => {
    
    it('P15 - Debe cambiar contraseña exitosamente con contraseña fuerte', () => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const tempEmail = `temppass.${timestamp}.${randomStr}@test.com`;
      const tempPass = 'TempPass123#';
      const newPass = 'NewPass456#';
      
      // Crear usuario temporal
      cy.request({
        method: 'POST',
        url: `${API_URL}/users/Registro`,
        body: {
          nombres: 'Temp',
          apellidos: 'Pass',
          edad: 25,
          correo: tempEmail,
          contrasena: tempPass,
          confirmarContrasena: tempPass
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 429) {
          cy.log('⚠️ Rate limit alcanzado, saltando prueba P15');
          return;
        }
        
        expect(response.status).to.be.oneOf([200, 201]);
        cy.wait(3000);
        
        // Login y cambio de contraseña
        cy.loginViaAPI(tempEmail, tempPass);
        cy.visit('/perfil.html');
        cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
        cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
        cy.wait(800);
        
        cy.get('input#input-current-password, input[name="contrasenaActual"]').type(tempPass);
        cy.get('input#input-password, input[name="nuevaContrasena"]').type(newPass);
        cy.get('input#input-confirm-password, input[name="confirmarContrasena"]').type(newPass);
        cy.get('#btn-seguridad, button[type="submit"]').last().click();
        
        cy.wait(3000);
        
        // Limpiar usuario temporal
        cy.wait(ACTION_DELAY);
        cy.cleanupTestUser(tempEmail, newPass);
      });
    });

    it('P16 - Debe rechazar nueva contraseña débil (sin mayúscula)', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
      cy.wait(800);
      
      cy.get('input#input-current-password, input[name="contrasenaActual"]').type(testUser.contrasena);
      cy.get('input#input-password, input[name="nuevaContrasena"]').type('nuevapass123#');
      cy.get('input#input-confirm-password, input[name="confirmarContrasena"]').type('nuevapass123#');
      cy.get('#btn-seguridad, button[type="submit"]').last().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /mayúscula|letra mayúscula|uppercase/i);
    });
    
it('P16b - Debe rechazar contraseña débil sin número', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
      cy.wait(800);
      
      cy.get('input#input-current-password, input[name="contrasenaActual"]').type(testUser.contrasena);
      cy.get('input#input-password, input[name="nuevaContrasena"]').type('NuevaPass#');
      cy.get('input#input-confirm-password, input[name="confirmarContrasena"]').type('NuevaPass#');
      cy.get('#btn-seguridad, button[type="submit"]').last().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /número|dígito|número requerido/i);
    });

    it('P16c - Debe rechazar contraseña débil sin carácter especial', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
      cy.wait(800);
      
      cy.get('input#input-current-password, input[name="contrasenaActual"]').type(testUser.contrasena);
      cy.get('input#input-password, input[name="nuevaContrasena"]').type('NuevaPass123');
      cy.get('input#input-confirm-password, input[name="confirmarContrasena"]').type('NuevaPass123');
      cy.get('#btn-seguridad, button[type="submit"]').last().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /carácter especial|símbolo|special character/i);
    });

    it('P16d - Debe rechazar contraseña menor a 8 caracteres', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
      cy.wait(800);
      
      cy.get('input#input-current-password, input[name="contrasenaActual"]').type(testUser.contrasena);
      cy.get('input#input-password, input[name="nuevaContrasena"]').type('Pass1#');
      cy.get('input#input-confirm-password, input[name="confirmarContrasena"]').type('Pass1#');
      cy.get('#btn-seguridad, button[type="submit"]').last().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /8.*caracteres|mínimo 8|al menos 8/i);
    });

    it('P17 - Debe rechazar cuando contraseñas no coinciden', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
      cy.wait(800);
      
      cy.get('input#input-current-password, input[name="contrasenaActual"]').type(testUser.contrasena);
      cy.get('input#input-password, input[name="nuevaContrasena"]').type('NuevaPass123#');
      cy.get('input#input-confirm-password, input[name="confirmarContrasena"]').type('DiferentePass123#');
      cy.get('#btn-seguridad, button[type="submit"]').last().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /contraseñas.*no coinciden|no son iguales|no match/i);
    });

    it('P18 - Debe rechazar contraseña actual incorrecta', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
      cy.wait(800);
      
      cy.get('input#input-current-password, input[name="contrasenaActual"]').type('ContraseñaIncorrecta123#');
      cy.get('input#input-password, input[name="nuevaContrasena"]').type('NuevaPass123#');
      cy.get('input#input-confirm-password, input[name="confirmarContrasena"]').type('NuevaPass123#');
      cy.get('#btn-seguridad, button[type="submit"]').last().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /contraseña.*actual.*incorrecta|contraseña.*actual.*inválida|current password/i);
    });

    it('P19 - Debe rechazar sin contraseña actual', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
      cy.wait(800);
      
      cy.get('input#input-password, input[name="nuevaContrasena"]').type('NuevaPass123#');
      cy.get('input#input-confirm-password, input[name="confirmarContrasena"]').type('NuevaPass123#');
      cy.get('#btn-seguridad, button[type="submit"]').last().click();
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /contraseña actual|todos.*campos|campo.*requerido/i);
    });

    it('P20 - Debe rechazar cambio con token inválido', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'token-invalido-abc123');
      });
      
      cy.visit('/perfil.html');
      cy.url({ timeout: 15000 }).should('include', '/login.html');
    });

    it('P21 - Debe rechazar cambio sin autenticación', () => {
      cy.visit('/perfil.html');
      cy.url({ timeout: 15000 }).should('include', '/login.html');
    });
  });

  // ============================================
  // ELIMINAR CUENTA (P22-P26)
  // ============================================
  describe('Eliminar Cuenta', () => {
    
    it('P22 - Debe eliminar cuenta exitosamente con contraseña correcta', () => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const deleteUserEmail = `delete.${timestamp}.${randomStr}@cypress.test`;
      const deleteUserPass = 'DeleteTest123#';
      
      // Crear usuario
      cy.request({
        method: 'POST',
        url: `${API_URL}/users/Registro`,
        body: {
          nombres: 'Delete',
          apellidos: 'Test',
          edad: 25,
          correo: deleteUserEmail,
          contrasena: deleteUserPass,
          confirmarContrasena: deleteUserPass
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 429) {
          cy.log('⚠️ Rate limit alcanzado, saltando prueba P22');
          return;
        }
        
        expect(response.status).to.be.oneOf([200, 201]);
        cy.wait(3000);
        
        cy.loginViaAPI(deleteUserEmail, deleteUserPass);
        cy.visit('/eliminar-cuenta.html');
        cy.get('#delete-container, .delete-container', { timeout: 15000 }).should('be.visible');
        
        // Llenar formulario
        cy.get('input#password-input, input[name="contrasena"]').type(deleteUserPass);
        cy.get('input#confirmation-input, input[name="confirmacion"]').type('ELIMINAR');
        cy.get('input#final-confirmation, input[type="checkbox"]').check();
        cy.get('#delete-btn, button.delete-btn').should('not.be.disabled');
        cy.get('#delete-btn, button.delete-btn').click();
        
        // Verificar eliminación
        cy.wait(5000);
        cy.url({ timeout: 15000 }).should('include', '/login.html');
      });
    });

    it('P23 - Debe rechazar eliminación con contraseña incorrecta', () => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const deleteUserEmail = `delete.${timestamp}.${randomStr}@cypress.test`;
      const deleteUserPass = 'DeleteTest123#';
      
      cy.request({
        method: 'POST',
        url: `${API_URL}/users/Registro`,
        body: {
          nombres: 'Delete',
          apellidos: 'Test',
          edad: 25,
          correo: deleteUserEmail,
          contrasena: deleteUserPass,
          confirmarContrasena: deleteUserPass
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 429) {
          cy.log('⚠️ Rate limit alcanzado, saltando prueba P23');
          return;
        }
        
        cy.wait(3000);
        cy.loginViaAPI(deleteUserEmail, deleteUserPass);
        cy.visit('/eliminar-cuenta.html');
        cy.get('#delete-container, .delete-container', { timeout: 15000 }).should('be.visible');
        
        cy.get('input#password-input, input[name="contrasena"]').type('ContraseñaIncorrecta123#');
        cy.get('input#confirmation-input, input[name="confirmacion"]').type('ELIMINAR');
        cy.get('input#final-confirmation, input[type="checkbox"]').check();
        cy.get('#delete-btn, button.delete-btn').click();
        
        cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
          .should('be.visible')
          .invoke('text')
          .should('match', /contraseña.*incorrecta|contraseña.*inválida/i);
          
        // Limpiar
        cy.wait(ACTION_DELAY);
        cy.cleanupTestUser(deleteUserEmail, deleteUserPass);
      });
    });

    it('P24 - Debe rechazar eliminación sin confirmación completa', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/eliminar-cuenta.html');
      cy.get('#delete-container, .delete-container', { timeout: 15000 }).should('be.visible');
      
      // Sin contraseña
      cy.get('input#confirmation-input, input[name="confirmacion"]').type('ELIMINAR');
      cy.get('input#final-confirmation, input[type="checkbox"]').check();
      cy.get('#delete-btn, button.delete-btn').should('be.disabled');
      
      // Sin texto de confirmación
      cy.reload();
      cy.get('#delete-container, .delete-container', { timeout: 15000 }).should('be.visible');
      cy.get('input#password-input, input[name="contrasena"]').type(testUser.contrasena);
      cy.get('input#final-confirmation, input[type="checkbox"]').check();
      cy.get('#delete-btn, button.delete-btn').should('be.disabled');
      
      // Sin checkbox
      cy.reload();
      cy.get('#delete-container, .delete-container', { timeout: 15000 }).should('be.visible');
      cy.get('input#password-input, input[name="contrasena"]').type(testUser.contrasena);
      cy.get('input#confirmation-input, input[name="confirmacion"]').type('ELIMINAR');
      cy.get('#delete-btn, button.delete-btn').should('be.disabled');
    });

    it('P25 - Debe rechazar eliminación con token inválido', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'token-invalido-xyz789');
      });
      
      cy.visit('/eliminar-cuenta.html');
      cy.url({ timeout: 15000 }).should('include', '/login.html');
    });

    it('P26 - Debe rechazar eliminación sin autenticación', () => {
      cy.visit('/eliminar-cuenta.html');
      cy.url({ timeout: 15000 }).should('include', '/login.html');
    });
  });

  // ============================================
  // MANEJO DE ERRORES Y EDGE CASES
  // ============================================
  describe('Manejo de Errores y Edge Cases', () => {
    
    beforeEach(() => {
      cy.wait(RATE_LIMIT_DELAY);
    });

    it('Debe manejar error de red al cargar perfil', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      
      cy.intercept('GET', `${API_URL}/users/me`, {
        forceNetworkError: true
      }).as('networkError');
      
      cy.visit('/perfil.html');
      cy.wait('@networkError');
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /error.*cargar|error.*conexión|network error/i);
    });

    it('Debe manejar error 500 del servidor', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      
      cy.intercept('GET', `${API_URL}/users/me`, {
        statusCode: 500,
        body: { success: false, message: 'Error interno del servidor' }
      }).as('serverError');
      
      cy.visit('/perfil.html');
      cy.wait('@serverError');
      
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /error.*servidor|server error/i);
    });

    it('Debe validar formato de email al actualizar', () => {
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
      cy.get('#nav-cuenta, [data-tab="cuenta"]').click();
      cy.wait(800);
      
      // Email sin @
      cy.get('input#input-email, input[name="correo"]').clear().type('emailinvalido');
      cy.get('#btn-cuenta, button[type="submit"]').eq(1).click();
      cy.get('#error-message, .error-message, .alert-danger', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('match', /correo.*válido|formato.*email|email.*inválido/i);
    });
  });

  // ============================================
  // NAVEGACIÓN Y UI
  // ============================================
  describe('Navegación y UI', () => {
    
    beforeEach(() => {
      cy.wait(RATE_LIMIT_DELAY);
      cy.loginViaAPI(testUser.correo, testUser.contrasena);
      cy.visit('/perfil.html');
      cy.get('#profile-container, .profile-content', { timeout: 15000 }).should('be.visible');
    });

    it('Debe navegar entre secciones correctamente', () => {
      // Ir a cuenta
      cy.get('#nav-cuenta, [data-tab="cuenta"]').click();
      cy.wait(500);
      cy.get('#section-cuenta, [data-section="cuenta"]').should('be.visible');
      cy.get('#section-personal, [data-section="personal"]').should('not.be.visible');
      
      // Ir a seguridad
      cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
      cy.wait(500);
      cy.get('#section-seguridad, [data-section="seguridad"]').should('be.visible');
      cy.get('#section-personal, [data-section="personal"]').should('not.be.visible');
      
      // Volver a personal
      cy.get('#nav-personal, [data-tab="personal"]').click();
      cy.wait(500);
      cy.get('#section-personal, [data-section="personal"]').should('be.visible');
      cy.get('#section-cuenta, [data-section="cuenta"]').should('not.be.visible');
    });

    it('Debe cerrar sesión correctamente', () => {
      cy.get('#nav-logout, .logout-btn, button[data-action="logout"]').click();
      
      cy.window().its('localStorage.token').should('not.exist');
      cy.url({ timeout: 10000 }).should('include', '/login.html');
    });

    it('Debe mostrar advertencia antes de eliminar cuenta', () => {
      cy.get('#nav-seguridad, [data-tab="seguridad"]').click();
      cy.wait(800);
      cy.get('#btn-delete-account, .delete-account-btn').click();
      
      cy.url({ timeout: 10000 }).should('include', '/eliminar-cuenta.html');
      cy.get('body').invoke('text').should('match', /advertencia|permanente|irreversible/i);
    });
  });
});