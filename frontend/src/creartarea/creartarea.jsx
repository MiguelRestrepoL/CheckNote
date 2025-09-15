import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./creartarea.css";

export default function CrearTarea() {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "", 
    fechaVencimiento: "", 
    hora: "", // Agregamos el campo hora al estado
    prioridad: "media", 
    completada: false, 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar si hay token al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("No hay sesión activa. Redirigiendo al login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Obtener token y userId
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    // Verificar que tenemos los datos necesarios
    if (!token) {
      setError("No se encontró token de autenticación. Por favor, inicia sesión.");
      setLoading(false);
      navigate('/login');
      return;
    }

    if (!userId) {
      setError("No se encontró información del usuario. Por favor, inicia sesión nuevamente.");
      setLoading(false);
      navigate('/login');
      return;
    }

    // Combinar fecha y hora en formato ISO
    let fechaCompleta = null;
    if (formData.fechaVencimiento && formData.hora) {
      // Crear fecha completa en formato ISO
      fechaCompleta = new Date(`${formData.fechaVencimiento}T${formData.hora}:00`).toISOString();
    } else if (formData.fechaVencimiento) {
      // Si solo hay fecha, usar las 23:59 del día
      fechaCompleta = new Date(`${formData.fechaVencimiento}T23:59:00`).toISOString();
    }

    // Preparar datos para enviar
    const taskData = {
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim(),
      prioridad: formData.prioridad,
      completada: formData.completada,
      fechaVencimiento: fechaCompleta,
      userId: userId
    };

    console.log("Datos a enviar:", taskData); // Para debugging
    console.log("Token:", token); // Para debugging

    try {
      const res = await fetch("https://checknote-27fe.onrender.com/api/v1/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      console.log("Status de respuesta:", res.status); // Para debugging

      if (!res.ok) {
        const errorData = await res.json();
        console.log("Error del servidor:", errorData); // Para debugging
        
        // Manejo específico de errores de autenticación
        if (res.status === 401) {
          setError("Tu sesión ha expirado. Redirigiendo al login...");
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        } else if (res.status === 403) {
          setError("No tienes permisos para realizar esta acción.");
          return;
        } else if (res.status === 400) {
          setError(errorData.message || "Datos inválidos. Verifica los campos.");
          return;
        } else {
          setError(errorData.message || `Error del servidor: ${res.status}`);
          return;
        }
      }

      const result = await res.json();
      console.log("Tarea creada exitosamente:", result); // Para debugging
      
      // Redirigir al dashboard o mostrar mensaje de éxito
      navigate('/home', { 
        state: { message: "Tarea creada exitosamente" } 
      });

    } catch (err) {
      console.error("Error de red:", err); // Para debugging
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Error de conexión. Verifica tu conexión a internet.");
      } else {
        setError("Error inesperado: " + err.message);
      }
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
            <div className="date-time-row">
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
                  value={formData.hora}
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
            <div className="terms">
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
              {loading ? "Creando tarea..." : "Crear Tarea"}
            </button>
          </form>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <a href="/home">
          <img src="/home.png" alt="home" className="icon" />
          <span>Inicio</span>
        </a>
      </footer>
    </div>
  );
}