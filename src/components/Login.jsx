import React from "react";
import "./Login.css";
import logo from "../assets/logo.png";       // This should be your soundwaves & title combined
import cassette from "../assets/cassette.png"; // This should include the cassette with headphones

const Login = ({ getAccessToken }) => {
  return (
    <div className="login-container">
      {/* Header – Logo Image */}
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* Player – Cassette Image & Login Button */}
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
