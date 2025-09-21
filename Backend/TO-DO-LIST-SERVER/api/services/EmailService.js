// services/EmailService.js - IMPLEMENTACIÓN CON RESEND
const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.resend = null;
    this.isConfigured = false;
    this.templateCache = new Map();
  }

  // CONFIGURAR RESEND
  async initialize() {
    try {
      // Verificar API key de Resend
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY no configurada');
        
        // En desarrollo, modo simulación
        if (process.env.NODE_ENV === 'development') {
          console.warn('EmailService en modo simulación para desarrollo');
          this.isConfigured = 'simulation';
          return;
        } else {
          throw new Error('RESEND_API_KEY es requerida en producción');
        }
      }

      // Inicializar cliente de Resend
      this.resend = new Resend(process.env.RESEND_API_KEY);
      
      // Verificar configuración con un test básico
      await this.verifyConfiguration();
      
      console.log('EmailService (Resend) inicializado correctamente');
      this.isConfigured = true;
      
    } catch (error) {
      console.error('Error inicializando EmailService con Resend:', error);
      this.isConfigured = false;
      
      // En desarrollo, no fallar la aplicación
      if (process.env.NODE_ENV === 'development') {
        console.warn('EmailService en modo simulación para desarrollo');
        this.isConfigured = 'simulation';
      } else {
        throw error;
      }
    }
  }

  // VERIFICAR CONFIGURACIÓN DE RESEND
  async verifyConfiguration() {
    try {
      // Resend no tiene un método verify explícito, 
      // pero podemos verificar que la API key sea válida
      if (!this.resend) {
        throw new Error('Cliente Resend no inicializado');
      }
      
      // Validar formato básico de API key
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey.startsWith('re_')) {
        console.warn('Formato de API key de Resend parece incorrecto (debería empezar con "re_")');
      }

      console.log('Configuración de Resend verificada');
    } catch (error) {
      console.error('Error verificando configuración de Resend:', error);
      throw error;
    }
  }

  // CARGAR TEMPLATE DE EMAIL (sin cambios)
  async loadTemplate(templateName) {
    try {
      if (this.templateCache.has(templateName)) {
        return this.templateCache.get(templateName);
      }

      const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
      let template;

      try {
        template = await fs.readFile(templatePath, 'utf8');
      } catch (fileError) {
        template = this.getDefaultTemplate(templateName);
      }

      this.templateCache.set(templateName, template);
      return template;
      
    } catch (error) {
      console.error(`Error cargando template ${templateName}:`, error);
      return this.getDefaultTemplate(templateName);
    }
  }

  // TEMPLATES POR DEFECTO OPTIMIZADOS PARA RESEND
  getDefaultTemplate(templateName) {
  const templates = {
    'password-reset': `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperar Contraseña - {{APP_NAME}}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #40485eff 0%, #40485eff 100%); 
            color: #49ed72ff; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header-logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 300; 
          }
          .header p { 
            margin: 10px 0 0; 
            opacity: 0.9; 
            font-size: 16px;
          }
          .content { 
            padding: 40px 30px; 
          }
          .content h2 { 
            color: #333; 
            margin-bottom: 20px; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #40485eff 0%, #40485eff 100%); 
            color: white !important; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 25px 0; 
            font-weight: 600;
            text-align: center;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          .button:hover { 
            opacity: 0.9; 
          }
          .warning { 
            background: #fff8e1; 
            border-left: 4px solid #ffa726; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 4px; 
          }
          .footer { 
            padding: 30px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            background: #fafafa;
            border-top: 1px solid #eee;
          }
          .footer-logo {
            max-width: 80px;
            height: auto;
            margin-bottom: 15px;
            opacity: 0.7;
          }
          .url-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            border-radius: 6px;
            word-break: break-all;
            font-family: monospace;
            font-size: 13px;
            margin: 20px 0;
          }
          @media (max-width: 600px) {
            .header-logo {
              max-width: 100px;
            }
            .content {
              padding: 30px 20px;
            }
            .button {
              padding: 14px 24px;
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="{{LOGO_URL}}" alt="{{APP_NAME}} Logo" class="header-logo" />
            <h1>{{APP_NAME}}</h1>
            <p>Recuperación de Contraseña</p>
          </div>
          <div class="content">
            <h2>Hola {{USER_NAME}},</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>{{APP_NAME}}</strong>.</p>
            <p>Si solicitaste este cambio, haz clic en el siguiente botón:</p>
            
            <div style="text-align: center;">
              <a href="{{RESET_URL}}" class="button">Restablecer Mi Contraseña</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Información importante:</strong>
              <ul>
                <li>Este enlace expira en <strong>{{EXPIRES_IN}}</strong></li>
                <li>Solo puede usarse una vez</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
                <li>Nunca compartas este enlace con nadie</li>
              </ul>
            </div>
            
            <p><strong>¿El botón no funciona?</strong> Copia y pega este enlace en tu navegador:</p>
            <div class="url-box">{{RESET_URL}}</div>
            
            <p><small>Si tienes problemas, contacta nuestro soporte en <a href="mailto:{{SUPPORT_EMAIL}}">{{SUPPORT_EMAIL}}</a></small></p>
          </div>
          <div class="footer">
            <img src="{{LOGO_URL}}" alt="{{APP_NAME}}" class="footer-logo" />
            <p><strong>{{APP_NAME}}</strong></p>
            <p>Tu aplicación de gestión de tareas favorita</p>
            <p>Este email fue generado automáticamente, por favor no responder.</p>
            <p>&copy; {{CURRENT_YEAR}} - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
    
    'password-changed': `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Actualizada - {{APP_NAME}}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header-logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
            background: white;
            padding: 10px;
            border-radius: 8px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 300; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .success { 
            background: #e8f5e8; 
            border-left: 4px solid #4caf50; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 4px; 
          }
          .info-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { 
            padding: 30px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            background: #fafafa;
            border-top: 1px solid #eee;
          }
          .footer-logo {
            max-width: 80px;
            height: auto;
            margin-bottom: 15px;
            opacity: 0.7;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="{{LOGO_URL}}" alt="{{APP_NAME}} Logo" class="header-logo" />
            <h1>{{APP_NAME}}</h1>
            <p>✅ Contraseña Actualizada</p>
          </div>
          <div class="content">
            <h2>Hola {{USER_NAME}},</h2>
            <div class="success">
              <strong>¡Contraseña actualizada con éxito en {{APP_NAME}}!</strong>
            </div>
            <p>Tu contraseña ha sido cambiada exitosamente.</p>
            
            <div class="info-box">
              <strong>📋 Detalles del cambio:</strong>
              <ul>
                <li><strong>Fecha:</strong> {{CHANGED_DATE}}</li>
                <li><strong>Hora:</strong> {{CHANGED_TIME}}</li>
                <li><strong>IP aproximada:</strong> {{IP_ADDRESS}}</li>
              </ul>
            </div>
            
            <p><strong>⚠️ ¿No fuiste tú?</strong></p>
            <p>Si no realizaste este cambio, contacta inmediatamente nuestro soporte en <a href="mailto:{{SUPPORT_EMAIL}}">{{SUPPORT_EMAIL}}</a></p>
          </div>
          <div class="footer">
            <img src="{{LOGO_URL}}" alt="{{APP_NAME}}" class="footer-logo" />
            <p><strong>{{APP_NAME}}</strong></p>
            <p>Mantén tu cuenta segura - Tu seguridad es nuestra prioridad</p>
            <p>&copy; {{CURRENT_YEAR}} - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
    
    'account-blocked': `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alerta de Seguridad - {{APP_NAME}}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header-logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
            background: white;
            padding: 10px;
            border-radius: 8px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 300; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .alert { 
            background: #ffebee; 
            border-left: 4px solid #f44336; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 4px; 
          }
          .info-box, .action-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .action-box {
            background: #fff3e0;
            border-color: #ffb74d;
          }
          .footer { 
            padding: 30px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            background: #fafafa;
            border-top: 1px solid #eee;
          }
          .footer-logo {
            max-width: 80px;
            height: auto;
            margin-bottom: 15px;
            opacity: 0.7;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="{{LOGO_URL}}" alt="{{APP_NAME}} Logo" class="header-logo" />
            <h1>{{APP_NAME}}</h1>
            <p>🛡️ Alerta de Seguridad</p>
          </div>
          <div class="content">
            <h2>Hola {{USER_NAME}},</h2>
            <div class="alert">
              <strong>🔒 Tu cuenta de {{APP_NAME}} ha sido temporalmente bloqueada</strong>
            </div>
            <p>Debido a múltiples intentos de login fallidos, tu cuenta ha sido bloqueada por seguridad.</p>
            
            <div class="info-box">
              <strong>📋 Detalles del bloqueo:</strong>
              <ul>
                <li><strong>Tiempo restante:</strong> {{BLOCK_DURATION}} minutos</li>
                <li><strong>Acceso restaurado:</strong> {{UNBLOCK_TIME}}</li>
                <li><strong>IP detectada:</strong> {{IP_ADDRESS}}</li>
              </ul>
            </div>
            
            <p>Si no intentaste acceder a tu cuenta, es posible que alguien esté tratando de hacerlo sin autorización.</p>
            
            <div class="action-box">
              <strong>🔧 ¿Qué puedes hacer?</strong>
              <ul>
                <li>Esperar {{BLOCK_DURATION}} minutos antes de intentar nuevamente</li>
                <li>Usar la opción "Olvidé mi contraseña" si no recuerdas tu clave</li>
                <li>Contactar soporte si crees que esto es un error</li>
                <li>Revisar la seguridad de tu contraseña</li>
              </ul>
            </div>
            
            <p>Si necesitas ayuda, contacta nuestro soporte en <a href="mailto:{{SUPPORT_EMAIL}}">{{SUPPORT_EMAIL}}</a></p>
          </div>
          <div class="footer">
            <img src="{{LOGO_URL}}" alt="{{APP_NAME}}" class="footer-logo" />
            <p><strong>{{APP_NAME}}</strong></p>
            <p>Tu seguridad es nuestra prioridad - Equipo de Seguridad</p>
            <p>&copy; {{CURRENT_YEAR}} - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

    return templates[templateName] || '<p>Template no encontrado</p>';
  }

  // REEMPLAZAR VARIABLES EN TEMPLATE (sin cambios)
  replaceVariables(template, variables) {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    
    return result;
  }

  // ENVIAR EMAIL CON RESEND
  async sendEmail(to, subject, templateName, variables = {}) {
    try {
      if (!this.isConfigured) {
        await this.initialize();
      }

      // Modo simulación para desarrollo
      if (this.isConfigured === 'simulation') {
        console.log('📧 EMAIL SIMULADO:', {
          to,
          subject,
          template: templateName,
          variables: Object.keys(variables)
        });
        return { success: true, messageId: 'simulated-' + Date.now() };
      }

      // Cargar y procesar template
      const template = await this.loadTemplate(templateName);
      
      // Variables globales por defecto
      const defaultVariables = {
        APP_NAME: process.env.APP_NAME || 'Mi Aplicación',
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
        CURRENT_YEAR: new Date().getFullYear(),
        SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'soporte@miapp.com',
        LOGO_URL: process.env.LOGO_URL || 'https://res.cloudinary.com/<tu_cloud_name>/image/upload/logo.png'
};

      const allVariables = { ...defaultVariables, ...variables };
      const htmlContent = this.replaceVariables(template, allVariables);

      // Configurar email para Resend
      const emailData = {
        from: process.env.FROM_EMAIL || `${process.env.APP_NAME || 'Mi App'} <noreply@${this.extractDomain()}>`,
        to: [to],
        subject,
        html: htmlContent,
        // Resend automáticamente genera versión texto desde HTML
      };

      // Enviar email con Resend
      const { data, error } = await this.resend.emails.send(emailData);
      
      if (error) {
        console.error('Error de Resend:', error);
        throw new Error(`Error de Resend: ${error.message}`);
      }

      console.log(`✅ Email enviado exitosamente via Resend a ${to}: ${subject}`);
      console.log(`📧 ID del mensaje: ${data.id}`);

      return { 
        success: true, 
        messageId: data.id,
        provider: 'resend'
      };

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw error;
    }
  }

  // EXTRAER DOMINIO PARA EMAIL FROM
  extractDomain() {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const url = new URL(frontendUrl);
      return url.hostname;
    } catch {
      return 'localhost';
    }
  }

  // CONVERTIR HTML A TEXTO PLANO (Resend lo hace automáticamente, pero útil para debug)
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // EMAIL DE RECUPERACIÓN DE CONTRASEÑA
  async sendPasswordResetEmail(email, resetToken, userName = null) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const variables = {
        USER_NAME: userName || email.split('@')[0],
        RESET_URL: resetUrl,
        EXPIRES_IN: '1 hora',
        ...(process.env.NODE_ENV === 'development' && {
          TOKEN: resetToken // Solo para debugging
        })
      };

      const result = await this.sendEmail(
        email,
        `Recuperar contraseña - ${process.env.APP_NAME || 'Tu App'}`,
        'password-reset',
        variables
      );

      return result;
    } catch (error) {
      console.error('❌ Error enviando email de recuperación:', error);
      throw error;
    }
  }

  // EMAIL DE CONFIRMACIÓN DE CAMBIO
  async sendPasswordChangedConfirmation(email, userName = null, ipAddress = null) {
    try {
      const now = new Date();
      const variables = {
        USER_NAME: userName || email.split('@')[0],
        CHANGED_DATE: now.toLocaleDateString('es-ES'),
        CHANGED_TIME: now.toLocaleTimeString('es-ES'),
        IP_ADDRESS: ipAddress || 'No disponible'
      };

      const result = await this.sendEmail(
        email,
        `Contraseña actualizada - ${process.env.APP_NAME || 'Tu App'}`,
        'password-changed',
        variables
      );

      return result;
    } catch (error) {
      console.error('❌ Error enviando confirmación de cambio:', error);
      throw error;
    }
  }

  // EMAIL DE CUENTA BLOQUEADA
  async sendAccountBlockedEmail(email, userName = null, minutesLeft = 30, ipAddress = null) {
    try {
      const unblockTime = new Date(Date.now() + minutesLeft * 60 * 1000);
      
      const variables = {
        USER_NAME: userName || email.split('@')[0],
        BLOCK_DURATION: minutesLeft,
        UNBLOCK_TIME: unblockTime.toLocaleString('es-ES'),
        IP_ADDRESS: ipAddress || 'No disponible'
      };

      const result = await this.sendEmail(
        email,
        `Alerta de seguridad - ${process.env.APP_NAME || 'Tu App'}`,
        'account-blocked',
        variables
      );

      return result;
    } catch (error) {
      console.error('❌ Error enviando alerta de bloqueo:', error);
      throw error;
    }
  }

  // EMAIL DE PRUEBA
  async sendTestEmail(email) {
    try {
      const result = await this.sendEmail(
        email,
        `Email de prueba - ${process.env.APP_NAME || 'Tu App'}`,
        'password-reset',
        {
          USER_NAME: 'Usuario de Prueba',
          RESET_URL: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/test`,
          EXPIRES_IN: '1 hora'
        }
      );

      return result;
    } catch (error) {
      console.error('❌ Error enviando email de prueba:', error);
      throw error;
    }
  }

  // OBTENER ESTADÍSTICAS
  getStats() {
    return {
      configured: this.isConfigured,
      provider: 'resend',
      templatesLoaded: this.templateCache.size,
      client: !!this.resend
    };
  }
}

// Singleton para usar en toda la aplicación
const emailService = new EmailService();

module.exports = emailService;