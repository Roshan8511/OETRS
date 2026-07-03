import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function getUserPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const base64 = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [payload, setPayload] = useState(getUserPayload());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Update payload when token changes
  useEffect(() => {
    const handleStorageChange = () => {
      setPayload(getUserPayload());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const isLoggedIn = !!payload;
  const role = payload?.role || (payload?.isAdmin ? "admin" : "user");
  const userName = payload?.name || payload?.email || "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    setPayload(null);
    navigate("/login");
  };

  // Check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      {/* LEFT : Brand/Logo */}
      <div className="navbar-left">
        <Link to="/" style={{ textDecoration: "none", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="navbar-brand-icon">🎫</span>
          <span className="navbar-brand">OETMS</span>
        </Link>
      </div>

      {/* Mobile menu button */}
      

      {/* RIGHT : Navigation Links */}
      <div className={`navbar-right ${mobileMenuOpen ? 'open' : ''}`}>
        <Link 
          to="/" 
          className={isActive('/') ? 'active' : ''}
        >
          Home
        </Link>
        
        <Link 
          to="/events" 
          className={isActive('/events') ? 'active' : ''}
        >
          Events
        </Link>

        {isLoggedIn && (
          <Link 
            to="/my-bookings" 
            className={isActive('/my-bookings') ? 'active' : ''}
          >
            My Bookings
          </Link>
        )}
        <Link 
          to="/about" 
          className={isActive('/about') ? 'active' : ''}
        >
          About Us
        </Link>

        {role === "admin" && (
          <Link 
            to="/admin" 
            className={isActive('/admin') ? 'active' : ''}
          >
            Admin
          </Link>
        )}

        <div className="user-info">
          {isLoggedIn ? (
            <>
              <span className="user-name">
                {userName.split(' ')[0]}
              </span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className={isActive('/login') ? 'active' : ''}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;