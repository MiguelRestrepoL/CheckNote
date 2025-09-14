import "./registro.css";
import React from "react";

function Registro() {
  return (
    <div className="register-container">
      {/* Lado izquierdo */}
      <div className="register-left">
        <img src="/logo-checknote.png" alt="Checknote Logo" className="main-logo" />
        <h1>Checknote</h1>
        <p>Organízate más fácil que nunca</p>
      </div>

      {/* Lado derecho */}
      <div className="register-card">
        <h2>Crear cuenta</h2>

        <form className="register-form">
          {/* Nombres */}
          <div className="field-group">
            <img src="/usuario.png" alt="Nombre" className="field-icon" />
            <div className="field-input">
              <label>Nombres</label>
              <input type="text" placeholder="Ingrese su nombre" />
            </div>
          </div>

          {/* Apellido (sin icono, dejamos espacio en blanco) */}
          <div className="field-group">
            <div className="field-icon empty"></div>
            <div className="field-input">
              <label>Apellido</label>
              <input type="text" placeholder="Ingrese su apellido" />
            </div>
          </div>

          {/* Email */}
          <div className="field-group">
            <img src="/correo.png" alt="Email" className="field-icon" />
            <div className="field-input">
              <label>E-mail</label>
              <input type="email" placeholder="Ingrese su correo" />
            </div>
          </div>

          {/* Contraseña */}
          <div className="field-group">
            <img src="/clave.png" alt="Contraseña" className="field-icon" />
            <div className="field-input">
              <label>Contraseña</label>
              <input type="password" placeholder="Ingrese su contraseña" />
            </div>
          </div>

          {/* Confirmar contraseña (sin icono, espacio en blanco) */}
          <div className="field-group">
            <div className="field-icon empty"></div>
            <div className="field-input">
              <label>Confirme su contraseña</label>
              <input type="password" placeholder="Repita su contraseña" />
            </div>
          </div>

          {/* Checkbox */}
          <div className="terms">
            <input type="checkbox" id="terms" />
            <label htmlFor="terms">
              Estoy de acuerdo con los términos y condiciones
            </label>
          </div>

          {/* Botón principal */}
          <button type="submit" className="btn-register">Registrarse</button>

          {/* Botón Google */}
          <div className="google-login">
            <img src="/google.png" alt="Google" />
            <span>Continuar con Google</span>
          </div>
        </form>

        <div className="links">
          <a href="#">Condiciones de uso</a> | <a href="#">Términos y servicios</a>
        </div>
      </div>
    </div>
  );
}

export default Registro;
