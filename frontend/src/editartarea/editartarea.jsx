import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function EditarTarea() {
  const [tareas, setTareas] = useState([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState("");
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "", 
    fechaVencimiento: "", 
    hora: "",
    prioridad: "media",
    estado: "pendiente",
    completada: false, 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTareas, setLoadingTareas] = useState(true);
  const navigate = useNavigate();

  // Cargar todas las tareas del usuario
  const cargarTareas = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError("No hay sesión activa. Redirigiendo al login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    try {
      setLoadingTareas(true);
      setError("");
      
      console.log("Cargando todas las tareas para editar...");
      
      const response = await fetch("https://checknote-27fe.onrender.com/api/v1/tasks", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          
          setError("Tu sesión ha expirado. Redirigiendo al login...");
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
        
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log("Response data:", responseText);

      let tareasData = [];
      try {
        const responseData = responseText ? JSON.parse(responseText) : {};
        tareasData = responseData.tasks || responseData.data || responseData;
        if (!Array.isArray(tareasData)) {
          tareasData = [];
        }
      } catch (parseError) {
        console.error("Error parseando JSON:", parseError);
        tareasData = [];
      }

      console.log(`Cargadas ${tareasData.length} tareas`);
      setTareas(tareasData);

    } catch (err) {
      console.error("Error cargando tareas:", err);
      setError("Error al cargar las tareas: " + err.message);
    } finally {
      setLoadingTareas(false);
    }
  };

  // Verificar sesión y cargar tareas al montar
  useEffect(() => {
    cargarTareas();
  }, [navigate]);

  // Función para convertir fecha ISO a formato de input
  const formatearFechaParaInput = (fechaISO) => {
    if (!fechaISO) return { fecha: "", hora: "" };
    
    const fecha = new Date(fechaISO);
    const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaStr = fecha.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    
    return { fecha: fechaStr, hora: horaStr };
  };

  // Manejar selección de tarea
  const handleTareaSelect = (e) => {
    const tareaId = e.target.value;
    setTareaSeleccionada(tareaId);
    
    if (tareaId) {
      const tarea = tareas.find(t => (t.id || t._id) === tareaId);
      if (tarea) {
        const { fecha, hora } = formatearFechaParaInput(tarea.fechaVencimiento);
        
        setFormData({
          titulo: tarea.titulo || "",
          descripcion: tarea.descripcion || "",
          fechaVencimiento: fecha,
          hora: hora,
          prioridad: tarea.prioridad || "media",
          estado: tarea.estado || "pendiente",
          completada: tarea.completada || false
        });
      }
    } else {
      // Limpiar formulario si no hay tarea seleccionada
      setFormData({
        titulo: "",
        descripcion: "",
        fechaVencimiento: "",
        hora: "",
        prioridad: "media",
        estado: "pendiente", 
        completada: false
      });
    }
  };

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

    if (!tareaSeleccionada) {
      setError("Por favor selecciona una tarea para editar");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setError("No se encontró información de autenticación");
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
      estado: formData.estado,
      completada: formData.completada,
      fechaVencimiento: fechaCompleta
    };

    console.log("Datos a actualizar:", taskData);
    console.log("ID de tarea:", tareaSeleccionada);

    try {
      const response = await fetch(`https://checknote-27fe.onrender.com/api/v1/tasks/${tareaSeleccionada}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      console.log("Update response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          
          setError("Tu sesión ha expirado. Redirigiendo al login...");
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }

        const errorText = await response.text();
        console.error("Update error response:", errorText);
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
      }

      const updateResult = await response.json();
      console.log("Tarea actualizada exitosamente:", updateResult);
      
      navigate('/home', { 
        state: { success: "Tarea actualizada exitosamente!" } 
      });

    } catch (err) {
      console.error("Error al actualizar:", err);
      setError("Error al actualizar la tarea: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener emoji según el estado
  const getEstadoEmoji = (estado) => {
    switch(estado) {
      case 'pendiente': return '⏰';
      case 'en_progreso': return '⚡';
      case 'terminada': return '✅';
      default: return '📝';
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
              ✏️ Editar Tarea
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Selector de tarea */}
              <div>
                <label htmlFor="tareaSelect" style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Tarea a editar ({tareas.length} disponibles)
                </label>
                {loadingTareas ? (
                  <div style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    ⏳ Cargando tareas...
                  </div>
                ) : tareas.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    📝 No hay tareas disponibles para editar
                  </div>
                ) : (
                  <select
                    id="tareaSelect"
                    value={tareaSeleccionada}
                    onChange={handleTareaSelect}
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
                      cursor: 'pointer',
                      maxHeight: '120px',
                      overflowY: 'auto'
                    }}
                  >
                    <option value="" style={{ background: '#111827', color: '#ffffff' }}>
                      Selecciona una tarea...
                    </option>
                    {tareas.map(tarea => (
                      <option 
                        key={tarea.id || tarea._id} 
                        value={tarea.id || tarea._id}
                        style={{ background: '#111827', color: '#ffffff' }}
                      >
                        {getEstadoEmoji(tarea.estado)} {tarea.titulo} - {tarea.prioridad?.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mostrar información de la tarea seleccionada */}
              {tareaSeleccionada && tareas.length > 0 && (
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  📝 Editando: <strong>{formData.titulo}</strong>
                  <br />
                  Estado actual: <strong>{formData.estado?.replace('_', ' ')}</strong>
                  <br />
                  Prioridad: <strong>{formData.prioridad}</strong>
                </div>
              )}

              {/* Solo mostrar el resto del formulario si hay una tarea seleccionada */}
              {tareaSeleccionada && (
                <>
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

                  {/* Estado y Prioridad en una fila */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Estado Kanban */}
                    <div>
                      <label htmlFor="estado" style={{ 
                        display: 'block', 
                        marginBottom: '6px', 
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        fontWeight: '500'
                      }}>
                        Estado
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

                    {/* Prioridad */}
                    <div>
                      <label htmlFor="prioridad" style={{ 
                        display: 'block', 
                        marginBottom: '6px', 
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        fontWeight: '500'
                      }}>
                        Prioridad
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
                          🟢 Baja
                        </option>
                        <option value="media" style={{ background: '#111827', color: '#ffffff' }}>
                          🟡 Media
                        </option>
                        <option value="alta" style={{ background: '#111827', color: '#ffffff' }}>
                          🔴 Alta
                        </option>
                      </select>
                    </div>
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
                      Marcar como completada
                    </label>
                  </div>
                </>
              )}

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

              {/* Botones */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="submit" 
                  disabled={loading || !tareaSeleccionada}
                  className="filter"
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: (loading || !tareaSeleccionada)
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                      : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (loading || !tareaSeleccionada) ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition)',
                    boxShadow: 'var(--shadow-filter)',
                    opacity: (loading || !tareaSeleccionada) ? 0.7 : 1
                  }}
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
                
                <button 
                  type="button"
                  onClick={() => navigate('/home')}
                  style={{
                    padding: '14px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all var(--transition)'
                  }}
                >
                  Cancelar
                </button>
              </div>
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