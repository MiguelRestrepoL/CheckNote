import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";  
import "./Tasks.css"; // Importa los estilos específicos de Tasks

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {  
      setLoading(true);
      setError("");
      try {
        // --- INICIO: FETCH REAL AL BACKEND ---
        // Asegúrate de que la URL sea correcta y que tu backend esté corriendo.
        const userId = localStorage.getItem("userId"); // Asumiendo que guardas el ID del usuario
        if (!userId) {
          throw new Error("Usuario no autenticado. Por favor, inicia sesión.");
        }

        const res = await fetch("http://localhost:3001/api/tasks", {
          method: "GET", // O POST si necesitas enviar algo, pero GET es lo común para listar
          headers: {
            "Content-Type": "application/json",
            // Si usas autenticación por token, añádelo aquí:
            // "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
        });

        const data = await res.json();

        if (!res.ok) {
          // Si hay un error del servidor (ej: 404, 500, 401)
          throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
        }
        // --- FIN: FETCH REAL AL BACKEND ---

        // Si todo va bien, actualizamos el estado con las tareas
        setTasks(data.tasks); // Asumiendo que la respuesta tiene un array llamado 'tasks'

      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(err.message || "No se pudieron cargar las tareas. Intenta de nuevo.");
        // Podrías redirigir al login si el error es de autenticación (ej: 401)
        // if (err.message.includes("401")) {
        //   localStorage.removeItem("token");
        //   localStorage.removeItem("userId");
        //   // navigate("/login");
        // }
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar el componente

  const getStatusLabel = (completed) => {
    return completed ? "C" : "P";
  };

  const getStatusClass = (completed) => {
    return completed ? "completed" : "pending";
  };

  return (
    <div className="page-root">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-left">
          <img src="/usuario.png" alt="usuario" className="icon user-icon" />
          {/* Aquí podrías mostrar el nombre del usuario si lo tienes en localStorage */}
          <span className="username">{'Usuario'}</span>
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

          {loading && <p>Cargando tareas...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !error && tasks.length === 0 && (
            <p>Aún no tienes tareas. ¡Crea la primera!</p>
          )}

          {!loading && !error && tasks.length > 0 && (
            <div className="task-list-container">
              {tasks.map((task) => (
                <div key={task.id} className="task-row">
                  <div className="task-left">
                    {/* El ícono de estado muestra 'P' o 'C' y se colorea según el estado */}
                    <span className={`task-status-icon ${getStatusClass(task.completada)}`}>
                      {getStatusLabel(task.completada)}
                    </span>
                    <span className="task-label">{task.titulo}</span>
                  </div>
                  <div className="task-right">
                    {/* Aquí podrías añadir un link para ver/editar detalles */}
                    <Link to={`/task/${task.id}`} className="task-arrow">›</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón para crear nueva tarea */}
          <div className="add-wrap">
            <Link to="/crear-tarea" className="add-btn">
              ＋
            </Link>
          </div>
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