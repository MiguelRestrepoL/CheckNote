const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // URL base de tu aplicación en Vercel
    baseUrl: 'https://check-note-fend.vercel.app',
    
    // Configuración de viewports
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Configuración de videos y screenshots
    video: true,
    screenshotOnRunFailure: true,
    
    // Carpeta de pruebas E2E
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Configuración de soporte
    supportFile: 'cypress/support/e2e.js',
    
    setupNodeEvents(on, config) {
      // Implementa listeners de eventos aquí si es necesario
      return config;
    },
  },
  
  // Variables de entorno
  env: {
    // URL de tu API en Render
    apiUrl: 'https://checknote-oh1u.onrender.com/api/v1',
    
    // Usuarios de prueba
    testUser: {
      nombres: 'Miguel',
      apellidos: 'Restrepo',
      edad: 22,
      correo: 'miguelrestrep0@gmail.com',
      contrasena: 'Xddsmile123#'
    },
    testUser2: {
      nombres: 'Natalia',
      apellidos: 'Gonzalez',
      edad: 20,
      correo: 'natagonzalez@gmail.com',
      contrasena: 'Unxdd123#'
    }
  },
    
    // Ignorar errores de certificado en desarrollo
    chromeWebSecurity: false,
    
    // Configuración de reintentos
    retries: {
      runMode: 2,
      openMode: 0
    }
  });