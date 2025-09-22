import React from "react";
import { Link } from "react-router-dom";
import "./footernav.css";

export default function FooterNav() {
  return (
    <footer className="footer">
      <Link to="/home" className="footer-item">
        <img src="/home.png" alt="home" className="icon" />
        <span>Inicio</span>
      </Link>
    </footer>
  );
}

//PENDING