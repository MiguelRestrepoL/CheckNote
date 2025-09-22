import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// NO importar registro.css - usar solo el global.css

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

    // Validaciones del lado del cliente
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
      const res = await fetch("https://checknote-27fe.onrender.com/api/v1/users/registro/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres,
          apellidos,
          edad: parseInt(edad, 10),
          correo,
          contrasena,
          confirmarContrasena
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || "Error en el registro. Inténtalo de nuevo.");
        throw new Error(errorData.message || "Error en el registro. Inténtalo de nuevo.");
      }

      // Registro exitoso, redirigir a login
      navigate("/login", {
        state: { success: "¡Registro exitoso! Por favor, inicia sesión." },
      });

    } catch (err) {
      // Error ya manejado arriba
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container gradient-bg">
      <div className="two-column-layout">
        {/* Columna izquierda - Info */}
        <div className="info-column">
          <div className="logo size-xl">
            <img src="/logo.png" alt="Checknote Logo" />
          </div>
          <p>Organízate más fácil que nunca</p>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="card register-style with-shadow">
          <h2 className="title-primary">Crear cuenta</h2>
          
          <form className="form spaced" onSubmit={handleSubmit}>
            {/* Nombres */}
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

            {/* Apellidos */}
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

            {/* Edad */}
            <div className="field-group">
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

            {/* Email */}
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

            {/* Contraseña */}
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

            {/* Confirmar Contraseña */}
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

            {/* Checkbox términos */}
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="terms"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              <label htmlFor="terms">Estoy de acuerdo con los términos y condiciones</label>
            </div>

            {/* Error */}
            {error && <p className="text-error">{error}</p>}

            {/* Botón Registrar */}
            <button type="submit" className="btn btn-primary btn-rounded" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>

          {/* Links */}
          <div className="links-section">
            <Link to="#" className="link small">Condiciones de uso</Link> | <Link to="#" className="link small">Términos y servicios</Link>
          </div>

          {/* Link para ir al login */}
          <div className="links-section">
            ¿Ya tiene cuenta? <Link to="/login" className="link">Inicie sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registro;