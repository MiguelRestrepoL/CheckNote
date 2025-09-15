import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./inicioSesion.css";

export default function InicioSesion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Almacena el token si lo recibes (ejemplo)
        // localStorage.setItem('token', data.token);
        // Redirigir a la página de inicio con un mensaje de éxito
        navigate("/home", { state: { success: "¡Inicio de sesión exitoso!" } });
      } else {
        setError(data.message || "Credenciales incorrectas. Inténtalo de nuevo.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor. Revisa tu red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="logo">
          <img src="/logo.png" alt="Checknote logo" />
        </div>

        <h2>¡Bienvenido nuevamente!</h2>
        <p>Ingrese su correo y contraseña para acceder</p>

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Campo de Email */}
          <div className="field-group">
            <img src="/correo.png" alt="Email" className="field-icon" />
            <div className="field-input">
              <label>Email</label>
              <input
                type="email"
                placeholder="Ingrese su correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div className="field-group">
            <img src="/clave.png" alt="Contraseña" className="field-icon" />
            <div className="field-input">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Botón de Iniciar sesión */}
          <div className="btn-container">
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </button>
          </div>
        </form>

        {/* Mensaje de error */}
        {error && <p className="error">{error}</p>}

        {/* Enlace de Olvidó su contraseña */}
        <Link to="/olvidar-password" className="forgot-password">
          ¿Olvidó su contraseña?
        </Link>

        {/* Botón de Google (sin funcionalidad, solo el diseño) */}
        <div className="btn-container">
          <button className="btn-google">
            <img src="/google.png" alt="Google" className="google-icon" />
            Continuar con Google
          </button>
        </div>

        {/* Enlace de Registro */}
        <p className="register">
          ¿No tiene cuenta? <Link to="/registro">Registrarse</Link>
        </p>
      </div>
    </div>
  );
}