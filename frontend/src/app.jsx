import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import InicioSesion from "./inicioSesion/login.jsx";
import Registro from "./registrarse/registro.jsx";
import Inicio from "./home/inicio.jsx";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<InicioSesion />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/home" element={<Inicio />} />
      </Routes>
    </div>
  );
}

export default App;
