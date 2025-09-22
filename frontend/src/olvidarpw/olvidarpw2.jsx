import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./olvidarpw2.css"; // Asegúrate de que este archivo CSS exista

export default function OlvidarPw2() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password /* , token u otro identificador */ }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Redirigir a la página de inicio de sesión o confirmación
        navigate("/login"); // O a una página de "contraseña restablecida con éxito"
      } else {
        setError(data.message || "Error al restablecer la contraseña");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-card-pw2">
      {/* LOGO */}
      <div className="logo">
        <img src="/logo.png" alt="Checknote" /> {/* Asegúrate de que la ruta del logo sea correcta */}
        <span>Checknote</span>
      </div>

      <h2>Ingrese una nueva contraseña para su cuenta</h2>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <img src="pw.png" alt="key" className="icon" /> {/* Asegúrate de que la ruta del ícono de llave sea correcta */}
          <input
            type="password"
            placeholder="Nueva Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <img src="pw.png" alt="key" className="icon" /> {/* Ícono de llave para confirmación */}
          <input
            type="password"
            placeholder="Confirmar Nueva Contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Procesando..." : "Restablecer Contraseña"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}