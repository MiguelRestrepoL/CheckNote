import React from "react";
import { useLocation, Link } from "react-router-dom";
import "./inicio.css";

export default function Inicio() {
  const location = useLocation();
  const successMessage = location.state?.success;

  // Recupera los datos del usuario del localStorage, si están disponibles
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { nombres: 'Usuario' }; // Valor por defecto si no hay usuario

  return (
    <div className="page-root">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-left">
          {/* Asumiendo que tienes una imagen de perfil o un avatar aquí */}
          {/* <img src={user.profilePic || "/default-avatar.png"} alt="usuario" className="icon user-icon" /> */}
          <span className="username">{user.nombres || 'Invitado'}</span> {/* Muestra el nombre del usuario */}
        </div>

        <div className="topbar-center">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Buscar tareas..." />
          </div>
        </div>

        <div className="topbar-right">
          {/* Asumiendo que tienes una ruta para la configuración */}
          <Link to="/settings">
            <img src="/settings.png" alt="settings" className="icon" />
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="main">
        <div className="center-column">
          {/* ⚡ MENSAJE DE ÉXITO */}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {/* tarjeta progreso (ejemplo, podrías fetch datos reales aquí) */}
          <section className="task-card">
            <h3 className="task-title">Ejemplo de Tarea Importante</h3>
            <p className="task-sub">Progreso de la tarea</p>

            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress" style={{ width: "48%" }} />
              </div>
            </div>

            <div className="progress-info"> {/* Renombrado de progress-meta a progress-info */}
              <span>48% completado</span>
              <span>Prioridad: Media</span> {/* Ejemplo de prioridad */}
            </div>
          </section>

          {/* filtros */}
          <div className="filters">
            {/* Cambiado el botón "Todas" a un Link */}
            <Link to="/tareas" className="filter">📋 Todas</Link>
            <button className="filter">📅 Calendario</button>
            <button className="filter">⭐ Prioridad</button>
          </div>

          {/* lista de tareas (ejemplo, deberías fetch datos reales) */}
          <div className="task-list">
            <div className="task-row">
              <div className="task-left">
                <span className="task-ico">📄</span>
                <span className="task-label">Tareas totales</span>
              </div>
              <div className="task-right">
                <span className="task-number">20</span>
                <span className="task-arrow">›</span>
              </div>
            </div>

            <div className="task-row highlighted">
              <div className="task-left">
                <span className="task-ico">✅</span>
                <span className="task-label">Tareas completadas</span>
              </div>
              <div className="task-right">
                <span className="task-number done">15</span>
                <span className="task-arrow">›</span>
              </div>
            </div>

            <div className="task-row">
              <div className="task-left">
                <span className="task-ico">📂</span>
                <span className="task-label">Tareas pendientes</span>
              </div>
              <div className="task-right">
                <span className="task-number pending">5</span>
                <span className="task-arrow">›</span>
              </div>
            </div>
          </div>

          {/* boton + */}
          <div className="add-wrap">
            <Link to="/crear-tarea" className="add-btn">＋</Link>
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