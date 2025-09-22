import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";  
import "./Tasks.css"; // Importa los estilos específicos de Tasks

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {  
      setLoading(true);
      setError("");
      
      try {
        // Verificar autenticación
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        
        if (!token) {
          throw new Error("No hay sesión activa. Redirigiendo al login...");
        }
        
        if (!userId) {
          throw new Error("No se encontró información del usuario.");
        }

        console.log("Token:", token); // Para debugging
        console.log("UserID:", userId); // Para debugging

        const res = await fetch("https://checknote-27fe.onrender.com/api/v1/tasks", {
          method: "GET", 
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // *** AGREGADO: Header de autorización ***
          },
        });

        console.log("Status de respuesta:", res.status); // Para debugging

        if (!res.ok) {
          const errorData = await res.json();
          console.log("Error del servidor:", errorData); // Para debugging
          
          // Manejo específico de errores de autenticación
          if (res.status === 401) {
            throw new Error("Tu sesión ha expirado. Redirigiendo al login...");
          } else if (res.status === 403) {
            throw new Error("No tienes permisos para ver estas tareas.");
          } else {
            throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
          }
        }

        const data = await res.json();
        console.log("Datos recibidos:", data); // Para debugging

        // Verificar la estructura de la respuesta
        if (data.tasks && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        } else if (Array.isArray(data)) {
          // En caso de que la respuesta sea directamente un array
          setTasks(data);
        } else {
          console.warn("Estructura de respuesta inesperada:", data);
          setTasks([]);
        }

      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(err.message || "No se pudieron cargar las tareas. Intenta de nuevo.");
        
        // Si es error de autenticación, limpiar localStorage y redirigir
        if (err.message.includes("sesión ha expirado") || err.message.includes("No hay sesión activa")) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [navigate]); // Agregamos navigate como dependencia

  const getStatusLabel = (completed) => {
    return completed ? "C" : "P";
  };

  const getStatusClass = (completed) => {
    return completed ? "completed" : "pending";
  };

  // Función para formatear la fecha de vencimiento
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return "";
    }
  };

  // Función para obtener la clase de prioridad
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'alta': return 'priority-high';
      case 'media': return 'priority-medium';
      case 'baja': return 'priority-low';
      default: return 'priority-medium';
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
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Buscar tareas..." />
          </div>
        </div>

        <div className="topbar-right">
          <img src="/settings.png" alt="settings" className="icon" />
        </div>
      </header>

      {/* MAIN */}
      <main className="main">
        <div className="center-column">
          <h2>Mis Tareas</h2>

          {loading && (
            <div className="loading-container">
              <p>Cargando tareas...</p>
            </div>
          )}
          
          {error && (
            <div className="error-container">
              <p className="error">{error}</p>
            </div>
          )}

          {!loading && !error && tasks.length === 0 && (
            <div className="empty-state">
              <p>Aún no tienes tareas. ¡Crea la primera!</p>
              <Link to="/crear-tarea" className="create-first-task-btn">
                Crear mi primera tarea
              </Link>
            </div>
          )}

          {!loading && !error && tasks.length > 0 && (
            <div className="task-list-container">
              {tasks.map((task) => (
                <div key={task._id || task.id} className="task-row">
                  <div className="task-left">
                    {/* El ícono de estado muestra 'P' o 'C' y se colorea según el estado */}
                    <span className={`task-status-icon ${getStatusClass(task.completada)}`}>
                      {getStatusLabel(task.completada)}
                    </span>
                    <div className="task-info">
                      <span className="task-label">{task.titulo}</span>
                      {task.fechaVencimiento && (
                        <span className="task-date">{formatDate(task.fechaVencimiento)}</span>
                      )}
                      {task.prioridad && (
                        <span className={`task-priority ${getPriorityClass(task.prioridad)}`}>
                          {task.prioridad.charAt(0).toUpperCase() + task.prioridad.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-right">
                    {/* Link para ver/editar detalles - usando _id que es común en MongoDB */}
                    <Link to={`/task/${task._id || task.id}`} className="task-arrow">›</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón para crear nueva tarea */}
          {!loading && (
            <div className="add-wrap">
              <Link to="/crear-tarea" className="add-btn" title="Crear nueva tarea">
                ＋
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <Link to="/home">
          <img src="/home.png" alt="home" className="icon" />
          <span>Inicio</span>
        </Link>
      </footer>
    </div>
  );
}