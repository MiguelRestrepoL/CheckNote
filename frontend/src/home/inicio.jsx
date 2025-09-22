import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";

export default function Inicio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tareas, setTareas] = useState({
    pendiente: [],
    en_progreso: [],
    terminada: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.success;

  // Recupera los datos del usuario del localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { nombres: 'Usuario' };

  // Función SUPER SIMPLE para cargar tareas - SIN VERIFY
  const cargarTareas = async () => {
    const token = localStorage.getItem('token');
    
    console.log("=== CARGA SIMPLE DE TAREAS ===");
    console.log("Token presente:", token ? "✅ SÍ" : "❌ NO");
    
    if (!token) {
      setError("No hay sesión activa. Redirigiendo al login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("Cargando tareas directamente (SIN verify)...");
      console.log("Token completo que se está enviando:", token);
      console.log("Longitud del token:", token.length);
      console.log("¿Empieza con 'Bearer'?", token.startsWith('Bearer'));
      
      const response = await fetch("https://checknote-27fe.onrender.com/api/v1/tasks", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Tasks response status:", response.status);
      console.log("Tasks response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ Error response body completo:", errorText);
        
        if (response.status === 401) {
          console.log("❌ 401 en /tasks - Token inválido o expirado");
          
          // ANTES de limpiar, vamos a intentar hacer verify nuevamente para comparar
          console.log("🔍 Haciendo verify nuevamente para comparar...");
          try {
            const testVerify = await fetch("https://checknote-27fe.onrender.com/api/v1/auth/verify", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}) // ← AGREGAR BODY VACÍO PARA EVITAR ERROR JSON
            });
            console.log("🔍 Test verify status:", testVerify.status);
            if (testVerify.ok) {
              const testVerifyData = await testVerify.json();
              console.log("🔍 Test verify data:", testVerifyData);
            } else {
              const testVerifyError = await testVerify.text();
              console.log("🔍 Test verify error:", testVerifyError);
            }
          } catch (verifyErr) {
            console.log("🔍 Error en test verify:", verifyErr);
          }
          
          // Limpiar sesión solo después de la investigación
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
        
        console.log("Error response body:", errorText);
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
      }

      // Procesar respuesta exitosa
      const responseText = await response.text();
      console.log("✅ Respuesta exitosa:", responseText);

      let tareasData = [];
      try {
        const responseData = responseText ? JSON.parse(responseText) : {};
        // Manejar diferentes estructuras de respuesta
        tareasData = responseData.tasks || responseData.data || responseData;
        if (!Array.isArray(tareasData)) {
          tareasData = [];
        }
      } catch (parseError) {
        console.error("Error parseando JSON:", parseError);
        tareasData = [];
      }
      
      // Organizar tareas por estado
      const tareasOrganizadas = {
        pendiente: tareasData.filter(tarea => tarea.estado === 'pendiente'),
        en_progreso: tareasData.filter(tarea => tarea.estado === 'en_progreso'),
        terminada: tareasData.filter(tarea => tarea.estado === 'terminada')
      };

      console.log("Tareas organizadas:", {
        pendiente: tareasOrganizadas.pendiente.length,
        en_progreso: tareasOrganizadas.en_progreso.length,
        terminada: tareasOrganizadas.terminada.length
      });

      setTareas(tareasOrganizadas);

    } catch (err) {
      console.error("Error cargando tareas:", err);
      setError("Error al cargar las tareas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTareas();
  }, [navigate]);

  // Calcular progreso basado en tareas completadas
  const totalTareas = tareas.pendiente.length + tareas.en_progreso.length + tareas.terminada.length;
  const tareasCompletadas = tareas.terminada.length;
  const porcentajeProgreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Función para limpiar sesión y forzar nuevo login
  const forzarNuevoLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const getPriorityClass = (prioridad) => {
    switch(prioridad?.toLowerCase()) {
      case 'alta': return 'priority-alta';
      case 'media': return 'priority-media';
      case 'baja': return 'priority-baja';
      default: return 'priority-media';
    }
  };

  const renderTareas = (listaTareas) => {
    if (loading) {
      return (
        <div className="kanban-task" style={{ opacity: 0.7, textAlign: 'center' }}>
          <div className="kanban-task-title">⏳ Cargando...</div>
        </div>
      );
    }

    if (listaTareas.length === 0) {
      return (
        <div className="kanban-task" style={{ opacity: 0.5, fontStyle: 'italic' }}>
          <div className="kanban-task-title">No hay tareas</div>
        </div>
      );
    }

    return listaTareas.map(tarea => (
      <div key={tarea.id || tarea._id} className="kanban-task">
        <div className="kanban-task-title">{tarea.titulo || 'Sin título'}</div>
        <span className={`kanban-task-priority ${getPriorityClass(tarea.prioridad)}`}>
          {(tarea.prioridad || 'media').toUpperCase()}
        </span>
      </div>
    ));
  };

  return (
    <div className="page-root">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-left">
          <img src="/usuario.png" alt="usuario" className="icon user-icon" />
          <span className="username">{user.nombres || 'Invitado'}</span>
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
          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: '500',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                ⚠️ Error de Conexión
              </div>
              <div>{error}</div>
              
              <button
                onClick={cargarTareas}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginRight: '8px'
                }}
              >
                🔄 Reintentar
              </button>
              
              <button
                onClick={forzarNuevoLogin}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🚪 Nuevo Login
              </button>
            </div>
          )}

          {/* Debug info (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              background: '#2d3748', 
              padding: '10px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              fontSize: '12px',
              color: '#a0aec0'
            }}>
              <strong>DEBUG INFO:</strong><br />
              Token: {localStorage.getItem('token') ? '✅ Presente' : '❌ Ausente'}<br />
              Total tareas: {totalTareas}
            </div>
          )}

          {/* Tarjeta de progreso */}
          <section className="task-card">
            <h3 className="task-title">Panel de Tareas</h3>
            <p className="task-sub">
              {loading ? "Cargando tus tareas..." : 
               error ? "Error cargando tareas" :
               "Progreso general de tus tareas"}
            </p>

            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress" style={{ width: `${porcentajeProgreso}%` }} />
              </div>
            </div>

            <div className="progress-info">
              <span>{porcentajeProgreso}% completado</span>
              <span>{tareasCompletadas} de {totalTareas} tareas ✅</span>
            </div>
          </section>

          {/* Filtros */}
          <div className="filters">
            <Link to="/tareas" className="filter">📋 Todas</Link>
            <button className="filter">📅 Calendario</button>
            <button className="filter">⭐ Prioridad</button>
          </div>

          {/* Layout Kanban */}
          <div className="kanban-container">
            {/* Columna Pendientes */}
            <div className="kanban-column">
              <div className="kanban-header">
                <span className="kanban-icon">⏰</span>
                <h4 className="kanban-title">Pendientes ({tareas.pendiente.length})</h4>
              </div>
              <div className="kanban-tasks">
                {renderTareas(tareas.pendiente)}
              </div>
            </div>

            {/* Columna En Proceso */}
            <div className="kanban-column">
              <div className="kanban-header">
                <span className="kanban-icon">⚡</span>
                <h4 className="kanban-title">En Proceso ({tareas.en_progreso.length})</h4>
              </div>
              <div className="kanban-tasks">
                {renderTareas(tareas.en_progreso)}
              </div>
            </div>

            {/* Columna Completadas */}
            <div className="kanban-column">
              <div className="kanban-header">
                <span className="kanban-icon">✅</span>
                <h4 className="kanban-title">Completadas ({tareas.terminada.length})</h4>
              </div>
              <div className="kanban-tasks">
                {renderTareas(tareas.terminada)}
              </div>
            </div>
          </div>

          {/* Botón flotante */}
          <div className="add-wrap">
            <div className="floating-menu">
              <div className={`floating-options ${menuOpen ? 'active' : ''}`}>
                <Link to="/crear-tarea" className="floating-option create">📝</Link>
                <Link to="/editar-tarea" className="floating-option edit">✏️</Link>
                <Link to="/eliminar-tarea" className="floating-option delete">🗑️</Link>
              </div>
              <button 
                className={`add-btn ${menuOpen ? 'active' : ''}`}
                onClick={toggleMenu}
              >
                +
              </button>
            </div>
          </div>
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