import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./registro.css";

function Registro() {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [edad, setEdad] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones del lado del cliente (mantenerlas)
    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(contrasena)) {
      setError("La contraseña debe contener al menos 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial.");
      return;
    }

    if (!terms) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://checknote-27fe.onrender.com/api/v1/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres,
          apellidos,
          edad: parseInt(edad, 10), // Asegurarse de que la edad sea un número
          correo,
          contrasena,
          // ¡Asegúrate de enviar confirmarContrasena al backend!
          confirmarContrasena
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Muestra el mensaje de error del backend si está disponible
        setError(errorData.message || "Error en el registro. Inténtalo de nuevo.");
        throw new Error(errorData.message || "Error en el registro. Inténtalo de nuevo.");
      }

      // Registro exitoso, redirigir a login
      navigate("/login", {
        state: { success: "¡Registro exitoso! Por favor, inicia sesión." },
      });

    } catch (err) {
      // El error ya se ha establecido en setError si res.ok es false,
      // pero podrías querer manejar otros errores de red aquí si es necesario.
      // setError(err.message); // Si necesitas re-establecer el error por alguna razón
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <img src="/logo.png" alt="Checknote Logo" className="main-logo" />
        <p>Organízate más fácil que nunca</p>
      </div>
      <div className="register-card">
        <h2>Crear cuenta</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <img src="/usuario.png" alt="Nombre" className="field-icon" />
            <div className="field-input">
              <label>Nombres</label>
              <input
                type="text"
                placeholder="Ingrese su nombre"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field-group">
            <div className="field-icon empty"></div>
            <div className="field-input">
              <label>Apellido</label>
              <input
                type="text"
                placeholder="Ingrese su apellido"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field-group">
            {/* Asumiendo que tienes un icono para edad */}
            <img src="/edad.png" alt="Edad" className="field-icon" /> 
            <div className="field-input">
              <label>Edad</label>
              <input
                type="number"
                placeholder="Ingrese su edad"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                min="13"
                required
              />
            </div>
          </div>
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
          <div className="field-group">
            <div className="field-icon empty"></div>
            <div className="field-input">
              <label>Confirme su contraseña</label>
              <input
                type="password"
                placeholder="Repita su contraseña"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="terms">
            <input
              type="checkbox"
              id="terms"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            <label htmlFor="terms">Estoy de acuerdo con los términos y condiciones</label>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-register" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>
          <div className="google-login">
            <img src="/google.png" alt="Google" />
            <span>Continuar con Google</span>
          </div>
        </form>
        <div className="links">
          <Link to="#">Condiciones de uso</Link> | <Link to="#">Términos y servicios</Link>
        </div>
      </div>
    </div>
  );
}

export default Registro;
