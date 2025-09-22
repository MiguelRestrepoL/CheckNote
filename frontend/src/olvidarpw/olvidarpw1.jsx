import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function OlvidarPw1() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false); // Nuevo estado para éxito

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    console.log("=== DEBUGGING FORGOT PASSWORD ===");
    console.log("1. Email ingresado:", email);
    console.log("2. Email procesado:", email.trim().toLowerCase());

    try {
      const payload = { correo: email.trim().toLowerCase() };
      console.log("4. Payload a enviar:", JSON.stringify(payload, null, 2));

      const res = await fetch("https://checknote-27fe.onrender.com/api/v1/auth/request-password-reset", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      console.log("5. Status de respuesta:", res.status);

      let data;
      try {
        const responseText = await res.text();
        console.log("8. Respuesta raw:", responseText);
        
        if (responseText) {
          data = JSON.parse(responseText);
          console.log("9. Respuesta parseada:", data);
        } else {
          data = {};
        }
      } catch (parseError) {
        console.error("9. Error parseando respuesta:", parseError);
        throw new Error("Respuesta del servidor no es válida");
      }

      if (res.ok) {
        console.log("10. ✅ Éxito - Mostrando mensaje de confirmación");
        setSuccess(true); // Mostrar mensaje de éxito en lugar de redirigir
      } else {
        console.log("10. ❌ Error del servidor");
        
        let errorMessage;
        if (res.status === 400) {
          errorMessage = data.message || "Error en los datos enviados";
        } else if (res.status === 404) {
          errorMessage = "Correo no encontrado en el sistema";
        } else if (res.status === 429) {
          errorMessage = "Demasiadas solicitudes. Espera un momento e intenta nuevamente.";
        } else if (res.status === 500) {
          errorMessage = "Error interno del servidor. Intenta más tarde.";
        } else {
          errorMessage = data.message || `Error ${res.status}: ${res.statusText}`;
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error("11. ❌ Error en la petición:", err);
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Error de conexión. Verifica tu internet y que el servidor esté funcionando.");
      } else if (err.message.includes('JSON')) {
        setError("Error procesando respuesta del servidor.");
      } else {
        setError("Error de conexión con el servidor: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Si ya se envió exitosamente, mostrar mensaje de confirmación
  if (success) {
    return (
      <div className="main-container gradient-bg">
        <div className="card forgot-style with-shadow">
          <div className="logo size-md">
            <img src="/logo.png" alt="Checknote" />
            <h1>Checknote</h1>
          </div>

          <div className="success-message" style={{ textAlign: 'center', padding: '20px' }}>
            <h2 className="title-secondary">¡Correo enviado!</h2>
            <p style={{ color: '#c2dbc8ff', marginBottom: '20px' }}>
              Hemos enviado un enlace de recuperación a <strong>{email}</strong>
            </p>
            <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
              Revisa tu bandeja de entrada y haz clic en el enlace para restablecer tu contraseña.
              Si no ves el correo, revisa tu carpeta de spam.
            </p>
            
            <button 
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
              className="btn btn-secondary"
              style={{ marginTop: '10px' }}
            >
              Enviar otro correo
            </button>
          </div>

          <div className="links-section">
            <Link to="/login" className="link">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container gradient-bg">
      <div className="card forgot-style with-shadow">
        <div className="logo size-md">
          <img src="/logo.png" alt="Checknote" />
          <h1>Checknote</h1>
        </div>

        <h2 className="title-secondary">Ingrese el correo con el que creó la cuenta</h2>

        {/* Info de debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            background: '#2d3748', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            fontSize: '12px',
            color: '#a0aec0'
          }}>
            <strong>DEBUG INFO:</strong><br />
            Email: {email}<br />
            URL: /api/v1/auth/request-password-reset<br />
            Payload: {JSON.stringify({ correo: email.trim().toLowerCase() })}
          </div>
        )}

        <form className="form compact" onSubmit={handleSubmit}>
          <div className="field-group">
            <img src="/correo.png" alt="Email" className="field-icon" />
            <div className="field-input">
              <label>Email</label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && <p className="text-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading || !email.trim()}>
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
        </form>

        <div className="links-section">
          ¿No tiene cuenta? <Link to="/registro" className="link">Registrarse</Link>
        </div>
      </div>
    </div>
  );
}