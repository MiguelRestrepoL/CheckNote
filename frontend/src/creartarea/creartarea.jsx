import React, { useState, useEffect } from "react"; // Importamos useEffect para obtener el userId
import { useNavigate } from "react-router-dom";
import "./creartarea.css";

export default function CrearTarea() {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "", 
    fechaVencimiento: "", 
    prioridad: "media", 
    completada: false, 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 
  const userId = localStorage.getItem('userId') || '60d5ec4f2e7f3e001f8b4e4e'; // Ejemplo de userId

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

const token = localStorage.getItem('token'); // Obtén el token guardado

const handleSubmit = async (e) => {
  // ... (resto de tu código)

  try {
    const res = await fetch("https://checknote-27fe.onrender.com/api/v1/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // *** Agrega esta línea para enviar el token ***
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        completada: formData.completada,
        fechaVencimiento: fechaCompleta,
        userId: userId, // Sigue enviando el userId si el backend lo necesita explícitamente
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      // Si el error es por token, puedes ser más específico
      if (res.status === 401 || res.status === 403) {
         setError("Tu sesión ha expirado o no tienes permisos. Por favor, inicia sesión de nuevo.");
         // Podrías redirigir a la página de login aquí
         localStorage.removeItem('token'); // Limpiar token expirado
         localStorage.removeItem('userId');
         navigate('/login');
      } else {
         setError(errorData.message || "Error al crear la tarea.");
      }
      throw new Error(errorData.message || "Error al crear la tarea.");
    }

    // ... (resto de tu código)

  } catch (err) {
    // ... (manejo de errores)
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="page-root">
      {/* ===== TOPBAR ===== */}
      <header className="topbar">
        <div className="topbar-left">
          <img src="/usuario.png" alt="usuario" className="icon user-icon" />
          <span className="username">{localStorage.getItem('userName') || 'Usuario'}</span>
        </div>
        <div className="topbar-center">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Buscar tareas..." />
          </div>
        </div>
        <div className="topbar-right">
          <img src="/settings.png" alt="settings" className="icon" />
        </div>
      </header>

      {/* ===== FORMULARIO ===== */}
      <main className="main">
        <div className="form-wrap">
          <form onSubmit={handleSubmit}>
            <label htmlFor="titulo">Título</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Escribe el título de la tarea"
              required
            />

            <label htmlFor="descripcion">Detalles</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Escribe los detalles..."
              required
            ></textarea>

            {/* Campo combinado de Fecha y Hora */}
            <div className="date-time-row"> {/* Usando la clase para agrupar */}
              <div>
                <label htmlFor="fechaVencimiento">Fecha de vencimiento</label>
                <input
                  type="date"
                  id="fechaVencimiento"
                  name="fechaVencimiento"
                  value={formData.fechaVencimiento}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="hora">Hora de vencimiento</label>
                <input
                  type="time"
                  id="hora"
                  name="hora"
                  value={formData.hora} // Asumo que 'hora' se manejará temporalmente aquí
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label htmlFor="prioridad">Prioridad</label>
            <select
              id="prioridad"
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              required
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>

            {/* Checkbox para 'Completada' (estado) */}
            <div className="terms"> {/* Reutilizando la clase 'terms' para el checkbox */}
              <input
                type="checkbox"
                id="completada"
                name="completada"
                checked={formData.completada}
                onChange={handleChange}
              />
              <label htmlFor="completada">Tarea Completada</label>
            </div>

            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Tarea"}
            </button>
          </form>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <a href="/home"> {/* Usando <a> si no usas react-router para el footer */}
          <img src="/home.png" alt="home" className="icon" />
          <span>Inicio</span>
        </a>
      </footer>
    </div>
  );
}