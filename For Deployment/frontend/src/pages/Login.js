import React, { useState } from "react";
import axios from "axios";
import "./Login.css";
import { API_BASE_URL } from "../config/api";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {

      const res = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password }
      );

      localStorage.setItem("token", res.data.token);

      setMessage("Login successful");

      window.location.href = "/";

    } catch (error) {
      setMessage("Login failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">

        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>

        {message && (
          <p className="login-message">{message}</p>
        )}

      </div>
    </div>
  );
}

export default Login;