import React, { useState } from "react";
import axios from "axios";
import "./AuthPage.css";
import { API_BASE_URL } from "../config/api";

function AuthPage() {

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      if (isLogin) {
        // login
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/login`,
          { email, password }
        );

        localStorage.setItem("token", res.data.token);

        window.location.href = "/";

      } else {
        // register
        await axios.post(
          `${API_BASE_URL}/api/auth/register`,
          { name, email, password }
        );

        setMessage("Registration successful. You can login now.");
        setIsLogin(true);
      }

    } catch (err) {
      setMessage(
        err.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h2>{isLogin ? "Login" : "Create Account"}</h2>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

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

          <button type="submit">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        {message && (
          <p className="auth-message">{message}</p>
        )}

        <p className="switch-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Register" : " Login"}
          </span>
        </p>

      </div>
    </div>
  );
}

export default AuthPage;