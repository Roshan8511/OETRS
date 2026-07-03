import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import AuthPage from "./pages/AuthPage";
import Events from "./pages/Events";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import EventDetails from "./pages/EventDetails";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import PaymentGateway from "./pages/PaymentGateway";
import PaymentSuccess from "./pages/PaymentSuccess";
import SeatSelection from "./pages/SeatSelection";

function getPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function AdminRoute({ children }) {
  const payload = getPayload();
  if (!payload) return <div>Please login first.</div>;
  const role = payload.role || (payload.isAdmin ? "admin" : "user");
  if (role !== "admin") return <div>Access denied. Admin only.</div>;
  return children;
}

function PrivateRoute({ children }) {
  const payload = getPayload();
  if (!payload) return <div>Please login first.</div>;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />

        {/* Seat Selection (movie flow) */}
        <Route path="/seat-selection" element={<PrivateRoute><SeatSelection /></PrivateRoute>} />

        {/* Payment Routes */}
        <Route path="/payment" element={<PrivateRoute><PaymentGateway /></PrivateRoute>} />
        <Route path="/payment-success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/create-event" element={<AdminRoute><CreateEvent /></AdminRoute>} />
        <Route path="/admin/edit-event/:id" element={<AdminRoute><EditEvent /></AdminRoute>} />
        <Route path="/create-event" element={<AdminRoute><CreateEvent /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
