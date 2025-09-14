import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import InicioSesion from "./inicioSesion/login.jsx";
import Registro from "./registrarse/registro.jsx";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<InicioSesion />} />
        <Route path="/registro" element={<Registro />} />
      </Routes>
    </div>
  );
}

export default App;
