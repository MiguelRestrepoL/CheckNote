import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./inicioSesion.css";

export default function InicioSesion() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loginRes = await fetch("https://checknote-27fe.onrender.com/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo, contrasena }),
      });

      if (!loginRes.ok) {
        const errorData = await loginRes.json();
        throw new Error(errorData.message || "Credenciales incorrectas. Inténtalo de nuevo.");
      }

      const loginData = await loginRes.json();
      const token = loginData.token;
      const user = loginData.user;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user._id); 
      localStorage.setItem('userName', user.nombres); 
      const verifyRes = await fetch("https://checknote-27fe.onrender.com/api/v1/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          "Authorization": `Bearer ${token}`
        },

      });

      if (!verifyRes.ok) {

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        throw new Error("La sesión no es válida. Por favor, inicia sesión de nuevo.");
      }


      navigate("/home", { state: { success: "¡Inicio de sesión exitoso!" } });

    } catch (err) {
      setError(err.message);

      if (err.message !== "La sesión no es válida. Por favor, inicia sesión de nuevo.") {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">
          <img src="/logo.png" alt="Checknote logo" />
        </div>
        <h2>¡Bienvenido nuevamente!</h2>
        <p>Ingrese su correo y contraseña para acceder</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <img src="/correo.png" alt="Email" className="field-icon" />
            <div className="field-input">
              <label>E-mail</label>
              <input
                type="email"
                placeholder="Ingrese su correo"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field-group">
            <img src="/clave.png" alt="Contraseña" className="field-icon" />
            <div className="field-input">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Ingrese su contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="btn-container">
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
        <Link to="/olvidar-password" className="forgot-password">
          ¿Olvidó su contraseña?
        </Link>
        <div className="btn-container">
          <button className="btn-google">
            <img src="/google.png" alt="Google" className="google-icon" />
            Continuar con Google
          </button>
        </div>
        <p className="register">
          ¿No tiene cuenta? <Link to="/registro">Registrarse</Link>
        </p>
      </div>
    </div>
  );
}