import React from "react";
import "./Login.css";
import logo from "../assets/logo.png";       // Contains sound waves and title
import cassette from "../assets/cassette.png"; // Contains cassette and headphones

const Login = ({ getAccessToken }) => {
  return (
    <div className="login-container">
      {/* Header – Logo Image (sound waves and title) */}
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* Player – Cassette Image with overlaid Login Button */}
      <div className="player">
        <img src={cassette} alt="Cassette with Headphones" className="cassette" />
        <button className="login-button" onClick={getAccessToken}>
          Log In
        </button>
      </div>
    </div>
  );
};

export default Login;

