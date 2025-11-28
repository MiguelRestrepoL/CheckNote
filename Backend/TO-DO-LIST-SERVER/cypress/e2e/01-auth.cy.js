/// <reference types="cypress" />

/**
 * @fileoverview Pruebas E2E de Autenticación - CheckNote
 * @description Tests basados en Matriz Ortogonal de 18 casos
 */

describe('Autenticación - CheckNote (Matriz Ortogonal)', () => {
  const testUser = Cypress.env('testUser');
  
  // Función helper para generar emails únicos
  const generateEmail = () => `test${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;

  // ============================================
  // REGISTRO DE USUARIO (Casos A1-A9)
  // ============================================
  describe('Registro de Usuario', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
      
      // Limpiar rate limits
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/cleanup-security`,
        failOnStatusCode: false
      });
      
      cy.wait(3000); // Esperar entre tests para evitar 429
    });

    it('A1 - ✅ Registro exitoso con todos los datos', () => {
      cy.visit('/registro.html');
      
      const newUser = {
        nombres: 'Test',
        apellidos: 'User',
        edad: 25,
        correo: generateEmail(),
        contrasena: 'TestStrong123#'
      };
      
      cy.get('input#nombres').type(newUser.nombres);
      cy.get('input#apellidos').type(newUser.apellidos);
      cy.get('input#edad').type(newUser.edad);
      cy.get('input#correo').type(newUser.correo);
      cy.get('input#contrasena').type(newUser.contrasena);
      cy.get('input#confirmarContrasena').type(newUser.contrasena);
      cy.get('input#terms').check();
      cy.get('button[type="submit"]').click();
      
      // Verificar redirección al login (200 OK)
      cy.url().should('include', '/login.html', { timeout: 15000 });
    });

    it('A2 - ❌ Registro con contraseña débil (sin mayúscula)', () => {
      cy.visit('/registro.html');
      
      cy.get('input#nombres').type('Test');
      cy.get('input#apellidos').type('User');
      cy.get('input#edad').type('25');
      cy.get('input#correo').type(generateEmail());
      cy.get('input#contrasena').type('weakpass123#'); // sin mayúscula
      cy.get('input#confirmarContrasena').type('weakpass123#');
      cy.get('input#terms').check();
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      
      // Verificar que NO redirija (400 Error)
      cy.url().should('include', '/registro.html');
    });

    it('A3 - ❌ Registro sin contraseña y sin aceptar términos', () => {
      cy.visit('/registro.html');
      
      cy.get('input#nombres').type('Test');
      cy.get('input#apellidos').type('User');
      cy.get('input#edad').type('25');
      cy.get('input#correo').type(generateEmail());
      // NO llenar contraseñas
      // NO marcar términos
      
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5 debe evitar el submit
      cy.get('input#contrasena:invalid').should('exist');
      cy.url().should('include', '/registro.html');
    });

    it('A4 - ❌ Registro con correo duplicado', () => {
      cy.visit('/registro.html');
      
      cy.get('input#nombres').type(testUser.nombres);
      cy.get('input#apellidos').type(testUser.apellidos);
      cy.get('input#edad').type(testUser.edad);
      cy.get('input#correo').type(testUser.correo); // Correo existente
      cy.get('input#contrasena').type('TestPass123#');
      cy.get('input#confirmarContrasena').type('TestPass123#');
      cy.get('input#terms').check();
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      
      // Verificar que NO redirija (409 Duplicado)
      cy.url().should('include', '/registro.html');
    });

    it('A5 - ❌ Registro con múltiples errores', () => {
      cy.visit('/registro.html');
      
      cy.get('input#nombres').type(testUser.nombres);
      cy.get('input#apellidos').type(testUser.apellidos);
      cy.get('input#edad').type(testUser.edad);
      cy.get('input#correo').type(testUser.correo); // Duplicado
      cy.get('input#contrasena').type('weak123'); // Débil
      cy.get('input#confirmarContrasena').type('weak123');
      // NO marcar términos
      
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5 del checkbox
      cy.get('input#terms:invalid').should('exist');
      cy.url().should('include', '/registro.html');
    });

    it('A6 - ❌ Registro con edad menor y sin contraseña', () => {
      cy.visit('/registro.html');
      
      cy.get('input#nombres').type('Test');
      cy.get('input#apellidos').type('User');
      cy.get('input#edad').type('12'); // Menor de 13
      cy.get('input#correo').type(testUser.correo);
      // NO llenar contraseñas
      cy.get('input#terms').check();
      
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5 de edad mínima
      cy.get('input#edad:invalid').should('exist');
      cy.url().should('include', '/registro.html');
    });

    it('A7 - ❌ Email inválido sin aceptar términos', () => {
      cy.visit('/registro.html');
      
      cy.get('input#nombres').type('Test');
      cy.get('input#apellidos').type('User');
      cy.get('input#edad').type('25');
      cy.get('input#correo').type('email-invalido'); // Sin @
      cy.get('input#contrasena').type('TestPass123#');
      cy.get('input#confirmarContrasena').type('TestPass123#');
      // NO marcar términos
      
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5 múltiple
      cy.get('input#correo:invalid, input#terms:invalid').should('exist');
      cy.url().should('include', '/registro.html');
    });

    it('A8 - ❌ Email inválido + edad menor', () => {
      cy.visit('/registro.html');
      
      cy.get('input#nombres').type('Test');
      cy.get('input#apellidos').type('User');
      cy.get('input#edad').type('10'); // Menor de 13
      cy.get('input#correo').type('invalido-email'); // Sin @
      cy.get('input#contrasena').type('weak'); // Débil
      cy.get('input#confirmarContrasena').type('weak');
      cy.get('input#terms').check();
      
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5 de edad y email
      cy.get('input#edad:invalid, input#correo:invalid').should('exist');
      cy.url().should('include', '/registro.html');
    });

    it('A9 - ❌ Email inválido sin contraseña', () => {
      cy.visit('/registro.html');
      
      cy.get('input#nombres').type('Test');
      cy.get('input#apellidos').type('User');
      cy.get('input#edad').type('25');
      cy.get('input#correo').type('correo-malo'); // Sin @
      // NO llenar contraseñas
      cy.get('input#terms').check();
      
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5 de email y contraseña
      cy.get('input#correo:invalid, input#contrasena:invalid').should('exist');
      cy.url().should('include', '/registro.html');
    });
  });

  // ============================================
  // LOGIN DE USUARIO (Casos A10-A15)
  // ============================================
  describe('Login de Usuario', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
      
      // Limpiar rate limits
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/cleanup-security`,
        failOnStatusCode: false
      });
      
      cy.wait(4000); // Esperar más tiempo para login
    });

    it('A10 - ❌ Login con usuario no registrado', () => {
      cy.visit('/login.html');
      
      cy.get('input#correo').type(generateEmail()); // Email que no existe
      cy.get('input#contrasena').type('TestPass123#');
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      
      // Verificar que NO redirija (400/401 Error)
      cy.url().should('include', '/login.html');
      
      // Verificar mensaje de error
      cy.get('#error-message').should('be.visible');
    });

    it('A11 - ✅ Login exitoso', () => {
      cy.visit('/login.html');
      
      cy.get('input#correo').type(testUser.correo);
      cy.get('input#contrasena').type(testUser.contrasena);
      cy.get('button[type="submit"]').click();
      
      cy.wait(5000); // Esperar respuesta del servidor
      
      // Verificar que se guardó el token
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        if (token) {
          expect(token).to.not.equal('undefined');
        }
      });
      
      // Verificar redirección (puede tardar)
      cy.url({ timeout: 20000 }).should('include', '/home.html');
    });

    it('A12 - ❌ Login con contraseña incorrecta', () => {
      cy.visit('/login.html');
      
      cy.get('input#correo').type(testUser.correo);
      cy.get('input#contrasena').type('WrongPassword123#'); // Incorrecta
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      
      // Verificar que NO redirija
      cy.url().should('include', '/login.html');
      
      // Verificar mensaje de error
      cy.get('#error-message').should('be.visible');
    });

    it('A13 - ❌ Login sin contraseña', () => {
      cy.visit('/login.html');
      
      cy.get('input#correo').type(testUser.correo);
      // NO llenar contraseña
      
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5
      cy.get('input#contrasena:invalid').should('exist');
      cy.url().should('include', '/login.html');
    });

    it('A14 - ❌ Login con email mal formateado', () => {
      cy.visit('/login.html');
      
      cy.get('input#correo').type('email-sin-arroba'); // Mal formato
      cy.get('input#contrasena').type('TestPass123#');
      
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5 de email
      cy.get('input#correo:invalid').should('exist');
      cy.url().should('include', '/login.html');
    });

    it('A15 - ❌ Login con campos vacíos', () => {
      cy.visit('/login.html');
      
      // NO llenar nada
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5
      cy.get('input#correo:invalid').should('exist');
      cy.url().should('include', '/login.html');
    });
  });

  // ============================================
  // RECUPERACIÓN DE CONTRASEÑA (Casos A16-A18)
  // ============================================
  describe('Recuperación de Contraseña', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
      cy.wait(2000);
    });

    it('A16 - ✅ Recuperación exitosa con email existente', () => {
      cy.visit('/olvidar-password1.html');
      
      cy.get('input[type="email"]').type(testUser.correo);
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      
      // Verificar mensaje de éxito (200 OK)
      cy.contains(/enviado|correo|email/i, { timeout: 10000 }).should('be.visible');
    });

    it('A17 - ❌ Recuperar con email no registrado', () => {
      cy.visit('/olvidar-password1.html');
      
      cy.get('input[type="email"]').type(generateEmail()); // Email que no existe
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      
      // Por seguridad, el sistema responde igual (200 OK)
      // Pero internamente es un 400 Error
      cy.contains(/enviado|correo/i, { timeout: 10000 }).should('be.visible');
    });

    it('A18 - ❌ Recuperar con email inválido', () => {
      cy.visit('/olvidar-password1.html');
      
      cy.get('input[type="email"]').type('email-sin-formato'); // Sin @
      cy.get('button[type="submit"]').click();
      
      // Validación HTML5
      cy.get('input[type="email"]:invalid').should('exist');
    });
  });

  // ============================================
  // TESTS ADICIONALES - Protección de Rutas
  // ============================================
  describe('Tests Adicionales - Protección y Logout', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
      cy.wait(2000);
    });

    it('Debe redirigir al login si no está autenticado', () => {
      cy.visit('/home.html');
      cy.url().should('include', '/login.html', { timeout: 10000 });
    });

    it('Debe cerrar sesión con token inválido', () => {
      cy.visit('/login.html');
      
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'token-invalido-123');
      });
      
      cy.visit('/home.html');
      cy.url().should('include', '/login.html', { timeout: 10000 });
    });
  });
});