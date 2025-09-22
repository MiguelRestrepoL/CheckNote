import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// NO importar creartarea.css - usar solo globalcss2.css

export default function CrearTarea() {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "", 
    fechaVencimiento: "", 
    hora: "",
    prioridad: "media",
    estado: "pendiente", // Nuevo campo para Kanban
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
      fechaCompleta = new Date(`${formData.fechaVencimiento}T${formData.hora}:00`).toISOString();
    } else if (formData.fechaVencimiento) {
      fechaCompleta = new Date(`${formData.fechaVencimiento}T23:59:00`).toISOString();
    }

    // Preparar datos para enviar
    const taskData = {
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim(),
      prioridad: formData.prioridad,
      estado: formData.estado, // Incluir estado para Kanban
      completada: formData.completada,
      fechaVencimiento: fechaCompleta,
      userId: userId
    };

    console.log("Datos a enviar:", taskData);
    console.log("Token:", token);

    try {
      const res = await fetch("https://checknote-27fe.onrender.com/api/v1/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      console.log("Status de respuesta:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.log("Error del servidor:", errorData);
        
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
      console.log("Tarea creada exitosamente:", result);
      
      navigate('/home', { 
        state: { success: "✅ Tarea creada exitosamente" } 
      });

    } catch (err) {
      console.error("Error de red:", err);
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
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-left">
          <img src="/usuario.png" alt="usuario" className="icon user-icon" />
          <span className="username">{localStorage.getItem('userName') || 'Usuario'}</span>
        </div>

        <div className="topbar-center">
          <div className="search-wrap">
            <img src="/search.png" alt="buscar" className="search-icon" />
            <input className="search-input" placeholder="Buscar tareas..." />
          </div>
        </div>

        <div className="topbar-right">
          <Link to="/perfil">
            <img src="/settings.png" alt="configuración" className="icon" />
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="main">
        <div className="center-column">
          {/* Formulario en tarjeta */}
          <section className="task-card" style={{ maxWidth: '520px', textAlign: 'left' }}>
            <h3 className="task-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
              📝 Crear Nueva Tarea
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Título */}
              <div>
                <label htmlFor="titulo" style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Título de la tarea
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej: Completar proyecto de React"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all var(--transition)',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-light)';
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }}
                />
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe los detalles de la tarea..."
                  required
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all var(--transition)',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-light)';
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }}
                />
              </div>

              {/* Fecha y Hora */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="fechaVencimiento" style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    fontWeight: '500'
                  }}>
                    Fecha límite
                  </label>
                  <input
                    type="date"
                    id="fechaVencimiento"
                    name="fechaVencimiento"
                    value={formData.fechaVencimiento}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all var(--transition)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="hora" style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    fontWeight: '500'
                  }}>
                    Hora límite
                  </label>
                  <input
                    type="time"
                    id="hora"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all var(--transition)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Prioridad */}
              <div>
                <label htmlFor="prioridad" style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Nivel de prioridad
                </label>
                <select
                  id="prioridad"
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all var(--transition)',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="baja" style={{ background: '#111827', color: '#ffffff' }}>
                    🟢 Baja prioridad
                  </option>
                  <option value="media" style={{ background: '#111827', color: '#ffffff' }}>
                    🟡 Prioridad media
                  </option>
                  <option value="alta" style={{ background: '#111827', color: '#ffffff' }}>
                    🔴 Alta prioridad
                  </option>
                </select>
              </div>

              {/* Estado Kanban */}
              <div>
                <label htmlFor="estado" style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Estado inicial de la tarea
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all var(--transition)',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="pendiente" style={{ background: '#111827', color: '#ffffff' }}>
                    ⏰ Pendiente
                  </option>
                  <option value="en_progreso" style={{ background: '#111827', color: '#ffffff' }}>
                    ⚡ En Progreso
                  </option>
                  <option value="terminada" style={{ background: '#111827', color: '#ffffff' }}>
                    ✅ Terminada
                  </option>
                </select>
              </div>

              {/* Checkbox completada */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  id="completada"
                  name="completada"
                  checked={formData.completada}
                  onChange={handleChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--primary)',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="completada" style={{ 
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  ✅ Marcar como completada
                </label>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  {error}
                </div>
              )}

              {/* Botón submit */}
              <button 
                type="submit" 
                disabled={loading}
                className="filter"
                style={{
                  marginTop: '12px',
                  padding: '14px 24px',
                  background: loading 
                    ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                    : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition)',
                  boxShadow: 'var(--shadow-filter)',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(16,185,129,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'var(--shadow-filter)';
                  }
                }}
              >
                {loading ? "⏳ Creando tarea..." : "✨ Crear Tarea"}
              </button>
            </form>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <Link to="/home" className="footer-link">
          <img src="/home.png" alt="inicio" className="icon" />
          <span className="footer-text">Inicio</span>
        </Link>
      </footer>
    </div>
  );
}