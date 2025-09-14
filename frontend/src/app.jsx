import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import InicioSesion from "./inicioSesion/login.jsx";
import Registro from "./registrarse/registro.jsx";

function App() {
  return (
    <div>
      <nav style={{ textAlign: "center", marginBottom: "20px" }}>
        <Link to="/login" style={{ margin: "0 10px" }}>Login</Link>
        <Link to="/registro" style={{ margin: "0 10px" }}>Registro</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<InicioSesion />} />
        <Route path="/registro" element={<Registro />} />
      </Routes>
    </div>
  );
}

export default App;
