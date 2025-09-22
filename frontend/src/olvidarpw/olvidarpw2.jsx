import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";

export default function OlvidarPw2() {
  const { token } = useParams(); // Obtener token de la URL
  const location = useLocation(); // Para obtener query params si es necesario
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [tokenValidated, setTokenValidated] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const navigate = useNavigate();

  // Validar token al montar el componente
  useEffect(() => {
    let currentToken = token;
    
    // Si no hay token en params, intentar obtenerlo de query params
    if (!currentToken) {
      const urlParams = new URLSearchParams(location.search);
      currentToken = urlParams.get('token');
    }
    
    console.log("=== OBTENIENDO Y VALIDANDO TOKEN ===");
    console.log("Token desde params:", token);
    console.log("Token desde query:", new URLSearchParams(location.search).get('token'));
    console.log("Token final:", currentToken);

    if (!currentToken) {
      setError("Token no válido - acceso denegado. Debe acceder desde el enlace del email.");
      setValidatingToken(false);
      return;
    }

    // Validar que el token tenga el formato correcto (64 caracteres hex)
    if (currentToken.length !== 64 || !/^[a-f0-9]{64}$/i.test(currentToken)) {
      setError("Formato de token inválido. Debe acceder desde el enlace del email.");
      setValidatingToken(false);
      return;
    }

    // Guardar el token y validarlo
    setResetToken(currentToken);
    validateTokenWithServer(currentToken);
  }, [token, location]);

  // Función para validar el token con el servidor
  const validateTokenWithServer = async (tokenToValidate) => {
    try {
      setValidatingToken(true);
      
      const response = await fetch("https://checknote-27fe.onrender.com/api/v1/auth/validate-reset-token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokenToValidate }),
      });

      console.log("Status validación token:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Token válido para email:", data.email);
        setTokenValidated(true);
        setError("");
      } else {
        const errorData = await response.json();
        console.log("❌ Token inválido:", errorData.message);
        setError("Token inválido, expirado o ya utilizado. Solicite un nuevo enlace de recuperación.");
        setTokenValidated(false);
      }
    } catch (err) {
      console.error("Error validando token:", err);
      setError("Error de conexión al validar el token. Inténtelo más tarde.");
      setTokenValidated(false);
    } finally {
      setValidatingToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que tenemos token válido
    if (!resetToken || !tokenValidated) {
      setError("Token no válido. Debe acceder desde el enlace del email.");
      return;
    }

    // Validaciones básicas
    if (!password || !confirmPassword) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    // Validar que las contraseñas coinciden
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Validar contraseña usando las mismas reglas que el PasswordResetService
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors.join(". "));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    console.log("=== RESTABLECIENDO CONTRASEÑA ===");
    console.log("Token a usar:", resetToken.substring(0, 20) + "...");

    try {
      // Payload que coincida exactamente con lo que espera el backend
      const payload = { 
        token: resetToken,
        nuevaContrasena: password,
        confirmarContrasena: confirmPassword // Agregar confirmación también
      };

      console.log("Payload enviado:", { 
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

      console.log("Status reset:", response.status);

      let data;
      try {
        const responseText = await response.text();
        console.log("Respuesta raw:", responseText);
        
        if (responseText) {
          data = JSON.parse(responseText);
          console.log("Respuesta parseada:", data);
        } else {
          data = {};
        }
      } catch (parseError) {
        console.error("Error parseando respuesta:", parseError);
        throw new Error("Respuesta del servidor no es válida");
      }

      if (response.ok) {
        console.log("✅ Contraseña restablecida exitosamente");
        setSuccess("Contraseña restablecida exitosamente. Será redirigido al login...");
        
        // Redirigir después de 3 segundos para que el usuario vea el mensaje
        setTimeout(() => {
          navigate("/login", { 
            state: { 
              message: "Contraseña restablecida exitosamente. Puedes iniciar sesión con tu nueva contraseña.",
              type: "success"
            }
          });
        }, 3000);
      } else {
        console.log("❌ Error:", data.message);
        
        let errorMessage;
        if (response.status === 400) {
          errorMessage = data.message || "Datos inválidos o token expirado";
        } else if (response.status === 401) {
          errorMessage = "Token expirado o inválido. Solicita un nuevo enlace de recuperación.";
        } else if (response.status === 404) {
          errorMessage = "Token no encontrado. Solicita un nuevo enlace de recuperación.";
        } else {
          errorMessage = data.message || "Error al restablecer la contraseña";
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error en la petición:", err);
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Error de conexión. Verifica tu internet y el estado del servidor.");
      } else if (err.message.includes('JSON')) {
        setError("Error procesando respuesta del servidor.");
      } else {
        setError("Error de conexión: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función de validación de contraseña (replica las reglas del PasswordResetService)
  const validatePassword = (password) => {
    const errors = [];

    if (!password) {
      errors.push('La contraseña es requerida');
      return { valid: false, errors };
    }

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (password.length > 128) {
      errors.push('La contraseña no puede exceder 128 caracteres');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial');
    }

    // Verificar patrones comunes débiles
    const weakPatterns = [
      /(.)\1{3,}/, // Caracteres repetidos
      /123456|abcdef|qwerty/i, // Secuencias comunes
      /password|123456|admin|user/i // Palabras comunes
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        errors.push('La contraseña contiene patrones muy comunes o repetitivos');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Función para evaluar la fortaleza de la contraseña en tiempo real
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '#6c757d' };
    
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) strength += 1;
    else feedback.push('8+ caracteres');

    if (/[a-z]/.test(password)) strength += 1;
    else feedback.push('minúsculas');

    if (/[A-Z]/.test(password)) strength += 1;
    else feedback.push('mayúsculas');

    if (/\d/.test(password)) strength += 1;
    else feedback.push('números');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
    else feedback.push('símbolos');

    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#006600'];
    const texts = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];

    return {
      strength,
      text: texts[strength] || 'Sin evaluar',
      color: colors[strength] || '#6c757d',
      missing: feedback
    };
  };

  const passwordStrength = getPasswordStrength(password);

  // Si estamos validando el token, mostrar loading
  if (validatingToken) {
    return (
      <div className="main-container gradient-bg">
        <div className="card forgot-style with-shadow">
          <div className="logo size-md">
            <img src="/logo.png" alt="Checknote" />
            <h1>Checknote</h1>
          </div>
          
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h2 className="title-secondary">Validando token...</h2>
            <p style={{ color: '#6c757d' }}>Por favor espere mientras validamos su token de recuperación</p>
            <div style={{ margin: '20px 0' }}>
              <div className="spinner" style={{ 
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #007bff',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay token válido, mostrar error
  if (!resetToken || !tokenValidated) {
    return (
      <div className="main-container gradient-bg">
        <div className="card forgot-style with-shadow">
          <div className="logo size-md">
            <img src="/logo.png" alt="Checknote" />
            <h1>Checknote</h1>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2 className="title-secondary" style={{ color: '#dc3545' }}>Acceso denegado</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              {error || "Debe acceder desde el enlace enviado a su correo electrónico"}
            </p>
            <Link to="/olvidar-password" className="btn btn-primary btn-rounded">
              Solicitar enlace de recuperación
            </Link>
          </div>

          <div className="links-section">
            <Link to="/login" className="link">Volver al inicio de sesión</Link>
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
        <h2 className="title-secondary">Nueva Contraseña</h2>
        <p className="subtitle">Ingrese una contraseña segura para su cuenta</p>

        {/* Info de debugging */}
        {process.env.NODE_ENV === 'development' && resetToken && (
          <div style={{ 
            background: '#2d3748', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            fontSize: '12px',
            color: '#a0aec0'
          }}>
            <strong>DEBUG INFO:</strong><br />
            Token disponible: ✅ {resetToken.substring(0, 20)}...<br />
            Token length: {resetToken.length}<br />
            Token validado: {tokenValidated ? '✅' : '❌'}<br />
            URL reset: /api/v1/auth/reset-password
          </div>
        )}

        {/* Formulario */}
        <form className="form compact" onSubmit={handleSubmit}>
          {/* Nueva Contraseña */}
          <div className="field-group">
            <img src="/pw.png" alt="Contraseña" className="field-icon" />
            <div className="field-input">
              <label>Nueva Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres con mayús, minus, número y símbolo"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
                maxLength={128}
              />
            </div>
          </div>

          {/* Indicador de fortaleza */}
          {password && (
            <div style={{ 
              marginBottom: '15px',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '5px',
              border: `1px solid ${passwordStrength.color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  Fortaleza: <span style={{ color: passwordStrength.color }}>{passwordStrength.text}</span>
                </span>
                <div style={{
                  width: '100px',
                  height: '6px',
                  background: '#e9ecef',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(passwordStrength.strength / 5) * 100}%`,
                    height: '100%',
                    background: passwordStrength.color,
                    transition: 'all 0.3s ease'
                  }}></div>
                </div>
              </div>
              {passwordStrength.missing.length > 0 && (
                <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '5px' }}>
                  Falta: {passwordStrength.missing.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Confirmar Contraseña */}
          <div className="field-group">
            <img src="/pw.png" alt="Confirmar" className="field-icon" />
            <div className="field-input">
              <label>Confirmar Contraseña</label>
              <input
                type="password"
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              {confirmPassword && password !== confirmPassword && (
                <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '3px' }}>
                  Las contraseñas no coinciden
                </div>
              )}
              {confirmPassword && password === confirmPassword && confirmPassword.length >= 8 && (
                <div style={{ fontSize: '11px', color: '#28a745', marginTop: '3px' }}>
                  ✓ Las contraseñas coinciden
                </div>
              )}
            </div>
          </div>

          {/* Requisitos de contraseña */}
          <div style={{ 
            fontSize: '12px', 
            color: '#6c757d', 
            marginBottom: '15px',
            textAlign: 'left',
            padding: '10px',
            background: '#f8f9fa',
            borderRadius: '5px',
          }}>
            <strong>Requisitos de contraseña:</strong>
            <ul style={{ marginTop: '5px', paddingLeft: '15px' }}>
              <li style={{ color: password.length >= 8 ? '#28a745' : '#6c757d' }}>
                {password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
              </li>
              <li style={{ color: /[A-Z]/.test(password) ? '#28a745' : '#6c757d' }}>
                {/[A-Z]/.test(password) ? '✓' : '○'} Al menos 1 letra mayúscula
              </li>
              <li style={{ color: /[a-z]/.test(password) ? '#28a745' : '#6c757d' }}>
                {/[a-z]/.test(password) ? '✓' : '○'} Al menos 1 letra minúscula
              </li>
              <li style={{ color: /\d/.test(password) ? '#28a745' : '#6c757d' }}>
                {/\d/.test(password) ? '✓' : '○'} Al menos 1 número
              </li>
              <li style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '#28a745' : '#6c757d' }}>
                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '○'} Al menos 1 carácter especial
              </li>
            </ul>
          </div>

          {/* Success Message */}
          {success && (
            <div style={{ 
              padding: '10px', 
              background: '#d4edda', 
              color: '#155724', 
              border: '1px solid #c3e6cb',
              borderRadius: '5px', 
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              {success}
            </div>
          )}

          {/* Error */}
          {error && <p className="text-error">{error}</p>}

          {/* Botón */}
          <button 
            type="submit" 
            className="btn btn-primary btn-rounded" 
            disabled={
              loading || 
              !password.trim() || 
              !confirmPassword.trim() || 
              password !== confirmPassword ||
              passwordStrength.strength < 4 // Requiere contraseña fuerte
            }
          >
            {loading ? "Restableciendo..." : "Establecer Nueva Contraseña"}
          </button>
        </form>

        {/* Links adicionales */}
        <div className="links-section">
          <Link to="/olvidar-password" className="link small">Solicitar nuevo enlace</Link> | 
          <Link to="/login" className="link small"> Volver al login</Link>
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