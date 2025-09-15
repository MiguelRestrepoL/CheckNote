import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./olvidarpw1.css";

export default function OlvidarPw1() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Redirigir a la siguiente pantalla
        navigate("/olvidar-password2");
      } else {
        setError(data.message || "Error al procesar la solicitud");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-card">
      {/* LOGO */}
      <div className="logo">
        <img src="/logo.png" alt="Checknote" />
        <span>Checknote</span>
      </div>

      <h2>Ingrese el correo con el que creó la cuenta</h2>

      <form onSubmit={handleSubmit}>
        <label>
          <img src="/correo.png" alt="mail" className="icon" />
          Email
        </label>
        <input
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Procesando..." : "Confirmar correo"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <p className="register">
        ¿No tiene cuenta? <a href="/registro">Registrarse</a>
      </p>
    </div>
  );
}