import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./creartarea.css";

export default function CrearTarea() {
  const [formData, setFormData] = useState({
    titulo: "",
    detalles: "",
    fecha: "",
    hora: "",
    estado: "pendiente", // Corresponde a completada: false
    prioridad: "media", // Nuevo campo según tu modelo
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpiar errores previos
    setLoading(true);

    // Preparar los datos para enviar a la API
    // Combinar fecha y hora en un objeto Date para el backend
    const fechaCompleta = formData.fecha && formData.hora ? new Date(`${formData.fecha}T${formData.hora}:00`) : null;

    // Convertir el estado a booleano para el backend
    const completada = formData.estado === "completada";

    // Obtener el ID del usuario logueado (asumiendo que está en localStorage)
    const userToken = localStorage.getItem('token');
    if (!userToken) {
        setError("Debes iniciar sesión para crear tareas.");
        setLoading(false);
        return;
    }
    // Aquí deberías decodificar el token o tener el ID de usuario disponible de otra forma.
    // Por ahora, asumimos que puedes obtenerlo. Si no, deberás ajustar cómo se recupera.
    // Ejemplo: const userId = JSON.parse(localStorage.getItem('user'))._id;

    // **Simulación:** Si no tienes el ID del usuario disponible, puedes comentar esta línea.
    // En un caso real, obtendrías el userId del token decodificado o de alguna variable de contexto.
    // const userId = "tu_user_id_aqui"; // Reemplaza con el ID real del usuario

    try {
      const response = await fetch("http://localhost:3001/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}` // Envía el token de autenticación
        },
        body: JSON.stringify({
          titulo: formData.titulo,
          descripcion: formData.detalles,
          fechaVencimiento: fechaCompleta,
          completada: completada,
          prioridad: formData.prioridad,
          // userId: userId, // Agrega el ID del usuario si lo obtuviste
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/home", { state: { success: "Tarea registrada exitosamente ✅" } });
      } else {
        // Manejar errores de la API
        setError(data.message || "Error al registrar la tarea. Inténtalo de nuevo.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-root">
      {/* ===== TOPBAR IGUAL A INICIO ===== */}
      <header className="topbar">
        <div className="topbar-left">
          <img src="/usuario.png" alt="usuario" className="icon user-icon" />
          <span className="username">{'{user_name}'}</span>
        </div>
        <div className="topbar-center">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Buscar" />
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
            <label>Título</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Escribe el título de la tarea"
              required
            />

            <label>Detalles</label>
            <textarea
              name="detalles"
              value={formData.detalles}
              onChange={handleChange}
              placeholder="Escribe los detalles..."
              required
            ></textarea>

            {/* ----- Nueva estructura para fecha y hora ----- */}
            <div className="date-time-row">
              <div>
                <label>Fecha para terminar tarea</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Hora para terminar tarea</label>
                <input
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            {/* --------------------------------------------- */}

            <label>Prioridad</label>
            <select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              required
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>

            <label>Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
            </select>

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar tarea"}
            </button>
          </form>
        </div>
      </main>

      {/* ===== FOOTER IGUAL A INICIO ===== */}
      <footer className="footer">
        <Link to="/home">
          <img src="/home.png" alt="home" className="icon" />
          <span>Inicio</span>
        </Link>
      </footer>
    </div>
  );
}