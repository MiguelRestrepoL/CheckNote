import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";

export default function OlvidarPw2() {
  const { token } = useParams();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [tokenValidated, setTokenValidated] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const navigate = useNavigate();

  // Obtener y validar token al montar el componente
  useEffect(() => {
    let currentToken = token;
    
    // Si no hay token en params, intentar obtenerlo de query params
    if (!currentToken) {
      const urlParams = new URLSearchParams(location.search);
      currentToken = urlParams.get('token');
    }
    
    console.log("=== VALIDANDO TOKEN DE RESET ===");
    console.log("Token desde params:", token);
    console.log("Token desde query:", new URLSearchParams(location.search).get('token'));
    console.log("Token final:", currentToken);

    if (!currentToken) {
      setError("Token no encontrado. Debe acceder desde el enlace del email.");
      setValidatingToken(false);
      return;
    }

    // Validar formato del token (debe ser un string de al menos 32 caracteres)
    if (currentToken.length < 32) {
      setError("Formato de token inválido. Debe acceder desde el enlace del email.");
      setValidatingToken(false);
      return;
    }

    console.log("✅ Token disponible, listo para usar");
    setResetToken(currentToken);
    setTokenValidated(true);
    setValidatingToken(false);
  }, [token, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que tenemos token válido
    if (!resetToken || !tokenValidated) {
      setError("Token no válido. Debe acceder desde el enlace del email.");
      return;
    }

    // Validaciones básicas
    if (!password.trim()) {
      setError("La nueva contraseña es requerida.");
      return;
    }

    if (!confirmPassword.trim()) {
      setError("La confirmación de contraseña es requerida.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0]); // Mostrar solo el primer error
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    console.log("=== INICIANDO RESET DE CONTRASEÑA ===");
    console.log("Token a usar:", resetToken.substring(0, 20) + "...");

    try {
      // Formato correcto según el AuthController (camelCase)
      const payload = {
        token: resetToken,
        nuevaContrasena: password,      // camelCase como espera el controller
        confirmarContrasena: confirmPassword  // camelCase como espera el controller
      };

      console.log("Enviando payload:", {
        token: resetToken.substring(0, 20) + "...",
        nuevaContrasena: "[OCULTA]",
        confirmarContrasena: "[OCULTA]"
      });

      const response = await fetch("https://checknote-27fe.onrender.com/api/v1/auth/reset-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Respuesta - Status:", response.status);

      let data = {};
      try {
        const responseText = await response.text();
        console.log("Respuesta raw:", responseText);
        
        if (responseText) {
          data = JSON.parse(responseText);
          console.log("Respuesta parseada:", data);
        }
      } catch (parseError) {
        console.error("Error parseando respuesta:", parseError);
        // No lanzar error aquí, podría ser respuesta exitosa sin JSON
      }

      if (response.ok) {
        console.log("✅ Contraseña restablecida exitosamente");
        setSuccess("¡Contraseña restablecida exitosamente! Redirigiendo al login...");
        
        // Limpiar formulario
        setPassword("");
        setConfirmPassword("");
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
          navigate("/login", { 
            state: { 
              message: "Contraseña restablecida exitosamente. Ya puedes iniciar sesión.",
              type: "success"
            }
          });
        }, 3000);
        
      } else {
        // Manejar errores específicos
        let errorMessage = "Error al restablecer la contraseña";
        
        if (response.status === 400) {
          errorMessage = data.message || "Datos inválidos. Verifique el token y las contraseñas.";
        } else if (response.status === 401) {
          errorMessage = "Token expirado o inválido. Solicite un nuevo enlace.";
          setTimeout(() => {
            navigate("/olvidar-password", { 
              state: { 
                message: "Token expirado. Solicite un nuevo enlace de recuperación.",
                type: "warning"
              }
            });
          }, 3000);
        } else if (response.status === 404) {
          errorMessage = "Token no encontrado. Solicite un nuevo enlace.";
          setTimeout(() => {
            navigate("/olvidar-password", { 
              state: { 
                message: "Token no encontrado. Solicite un nuevo enlace.",
                type: "warning"
              }
            });
          }, 3000);
        } else if (response.status >= 500) {
          errorMessage = "Error del servidor. Intente nuevamente más tarde.";
        } else {
          errorMessage = data.message || `Error ${response.status}: ${response.statusText}`;
        }
        
        console.log("❌ Error:", errorMessage);
        setError(errorMessage);
      }

    } catch (err) {
      console.error("Error en la petición:", err);
      
      let errorMessage = "Error de conexión";
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = "Error de conexión. Verifique su internet y el estado del servidor.";
      } else if (err.message.includes('JSON')) {
        errorMessage = "Error procesando respuesta del servidor.";
      } else {
        errorMessage = err.message || "Error desconocido";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función de validación simplificada pero efectiva
  const validatePassword = (password) => {
    const errors = [];

    if (!password) {
      return { valid: false, errors: ['La contraseña es requerida'] };
    }

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (password.length > 128) {
      errors.push('La contraseña no puede exceder 128 caracteres');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una letra minúscula');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula');
    }

    if (!/\d/.test(password)) {
      errors.push('Debe contener al menos un número');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial (!@#$%^&*...)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Función para evaluar fortaleza
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: 'Sin evaluar', color: '#6c757d', missing: [] };
    
    let strength = 0;
    let missing = [];

    if (password.length >= 8) strength += 1;
    else missing.push('8+ caracteres');

    if (/[a-z]/.test(password)) strength += 1;
    else missing.push('minúsculas');

    if (/[A-Z]/.test(password)) strength += 1;
    else missing.push('mayúsculas');

    if (/\d/.test(password)) strength += 1;
    else missing.push('números');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
    else missing.push('símbolos');

    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#006600'];
    const texts = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];

    return {
      strength,
      text: texts[strength] || 'Sin evaluar',
      color: colors[strength] || '#6c757d',
      missing
    };
  };

  const passwordStrength = getPasswordStrength(password);

  // Loading mientras validamos token
  if (validatingToken) {
    return (
      <div className="main-container gradient-bg">
        <div className="card forgot-style with-shadow">
          <div className="logo size-md">
            <img src="/logo.png" alt="Checknote" />
            <h1>Checknote</h1>
          </div>
          
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #28a745',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px auto'
            }}></div>
            <h2 className="title-secondary">Validando enlace...</h2>
            <p style={{ color: '#6c757d' }}>Verificando que su enlace sea válido</p>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error de token
  if (!resetToken || !tokenValidated) {
    return (
      <div className="main-container gradient-bg">
        <div className="card forgot-style with-shadow">
          <div className="logo size-md">
            <img src="/logo.png" alt="Checknote" />
            <h1>Checknote</h1>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2 className="title-secondary" style={{ color: '#dc3545' }}>❌ Acceso denegado</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              {error || "Debe acceder desde el enlace enviado a su correo electrónico"}
            </p>
            <Link to="/olvidar-password" className="btn btn-primary btn-rounded">
              Solicitar nuevo enlace
            </Link>
          </div>

          <div className="links-section">
            <Link to="/login" className="link">← Volver al login</Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulario principal
  return (
    <div className="main-container gradient-bg">
      <div className="card forgot-style with-shadow">
        {/* Logo */}
        <div className="logo size-md">
          <img src="/logo.png" alt="Checknote" />
          <h1>Checknote</h1>
        </div>

        {/* Título */}
        <h2 className="title-secondary">🔐 Nueva Contraseña</h2>
        <p className="subtitle">Cree una contraseña segura para su cuenta</p>

        {/* Formulario */}
        <form className="form compact" onSubmit={handleSubmit}>
          {/* Nueva Contraseña */}
          <div className="field-group">
            <img src="/pw.png" alt="Contraseña" className="field-icon" />
            <div className="field-input">
              <label>Nueva Contraseña *</label>
              <input
                type="password"
                placeholder="Ingrese su nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
                maxLength={128}
                style={{
                  borderColor: password && validatePassword(password).valid ? '#28a745' : 
                              password && !validatePassword(password).valid ? '#dc3545' : '#ced4da'
                }}
              />
            </div>
          </div>

          {/* Indicador de fortaleza */}
          {password && (
            <div style={{ 
              marginBottom: '15px',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: `1px solid ${passwordStrength.color}20`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>
                  Fortaleza: <span style={{ color: passwordStrength.color }}>{passwordStrength.text}</span>
                </span>
                <div style={{
                  width: '100px',
                  height: '8px',
                  background: '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(passwordStrength.strength / 5) * 100}%`,
                    height: '100%',
                    background: passwordStrength.color,
                    transition: 'width 0.3s ease',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>
              {passwordStrength.missing.length > 0 && (
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  <strong>Falta:</strong> {passwordStrength.missing.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Confirmar Contraseña */}
          <div className="field-group">
            <img src="/pw.png" alt="Confirmar" className="field-icon" />
            <div className="field-input">
              <label>Confirmar Contraseña *</label>
              <input
                type="password"
                placeholder="Confirme su nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  borderColor: confirmPassword && password === confirmPassword ? '#28a745' : 
                              confirmPassword && password !== confirmPassword ? '#dc3545' : '#ced4da'
                }}
              />
              {confirmPassword && (
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  {password === confirmPassword ? (
                    <span style={{ color: '#28a745' }}>✓ Las contraseñas coinciden</span>
                  ) : (
                    <span style={{ color: '#dc3545' }}>✗ Las contraseñas no coinciden</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mensaje de éxito */}
          {success && (
            <div style={{ 
              padding: '12px', 
              background: '#d4edda', 
              color: '#155724', 
              border: '1px solid #c3e6cb',
              borderRadius: '8px', 
              marginBottom: '15px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {success}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ 
              padding: '12px', 
              background: '#f8d7da', 
              color: '#721c24', 
              border: '1px solid #f5c6cb',
              borderRadius: '8px', 
              marginBottom: '15px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          {/* Botón */}
          <button 
            type="submit" 
            className="btn btn-primary btn-rounded" 
            disabled={
              loading || 
              !password.trim() || 
              !confirmPassword.trim() || 
              password !== confirmPassword ||
              !validatePassword(password).valid
            }
            style={{
              opacity: (loading || 
                       !password.trim() || 
                       !confirmPassword.trim() || 
                       password !== confirmPassword ||
                       !validatePassword(password).valid) ? 0.6 : 1
            }}
          >
            {loading ? "🔄 Restableciendo..." : "🔐 Establecer Nueva Contraseña"}
          </button>
        </form>

        {/* Enlaces */}
        <div className="links-section">
          <Link to="/olvidar-password" className="link">Solicitar nuevo enlace</Link>
          <span style={{ margin: '0 8px', color: '#dee2e6' }}>|</span>
          <Link to="/login" className="link">← Volver al login</Link>
        </div>

        {/* Información de debugging solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && resetToken && (
          <div style={{ 
            marginTop: '20px',
            background: '#2d3748', 
            padding: '12px', 
            borderRadius: '8px', 
            fontSize: '11px',
            color: '#a0aec0',
            fontFamily: 'monospace'
          }}>
            <strong>🔧 DEBUG INFO:</strong><br />
            Token: {resetToken.substring(0, 20)}... ({resetToken.length} chars)<br />
            Validado: {tokenValidated ? '✅' : '❌'}<br />
            Endpoint: POST /api/v1/auth/reset-password
          </div>
        )}
      </div>
    </div>
  );
}