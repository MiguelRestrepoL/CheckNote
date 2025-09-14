import "./inicioSesion.css";
import React from "react";

function InicioSesion() {
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="logo">
          <img src="/logo.png" alt="Checknote logo" />
          <h1>Checknote</h1>
        </div>

        <h2>¡Bienvenido nuevamente!</h2>
        <p>Ingrese su correo y contraseña para acceder</p>

        {/* Formulario */}
        <form className="login-form">
          <div className="field-group">
            <img src="/correo.png" alt="Email" className="field-icon" />
            <div className="field-input">
              <label>Email</label>
              <input type="email" placeholder="Ingrese su correo" />
            </div>
          </div>

          <div className="field-group">
            <img src="/clave.png" alt="Contraseña" className="field-icon" />
            <div className="field-input">
              <label>Contraseña</label>
              <input type="password" placeholder="Ingrese su contraseña" />
            </div>
          </div>

          <div className="btn-container">
            <button type="submit" className="btn-login">
              Iniciar sesión
            </button>
          </div>
        </form>

        {/* Enlace */}
        <a href="#" className="forgot-password">
          ¿Olvidó su contraseña?
        </a>

        {/* Google */}
        <div className="btn-container">
          <button className="btn-google">
            <img src="/google.png" alt="Google" className="google-icon" />
            Continuar con Google
          </button>
        </div>

        {/* Registro */}
        <p className="register">
          ¿No tiene cuenta? <a href="#">Registrarse</a>
        </p>
      </div>
    </div>
  );
}

export default InicioSesion;
