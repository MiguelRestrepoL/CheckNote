import React from "react";
import "./topbar.css";

export default function Topbar({ userName = "Usuario" }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src="/usuario.png" alt="usuario" className="icon user-icon" />
        <span className="username">{userName}</span>
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
  );
}

//PENDING