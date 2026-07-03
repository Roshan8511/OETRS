import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, eventName, amount, quantity } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) {
      console.log("No booking ID found, redirecting...");
      navigate("/events");
    } else {
      console.log("Payment page loaded with:", { bookingId, eventName, amount, quantity });
    }
  }, [bookingId, navigate]);

  const initiatePayment = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      const token = localStorage.getItem("token");
      console.log("Initiating payment for booking:", bookingId);

      const response = await axios.post(
        `${API_BASE_URL}/api/payments/initiate`,
        { bookingId },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("Initiate response:", response.data);
      setPaymentId(response.data.payment.id);
      setMessage("Payment initiated! Click Process to simulate payment.");
    } catch (error) {
      console.error("Initiate error:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (success) => {
    if (!paymentId) {
      setError("Please initiate payment first");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      console.log(`Processing payment ${paymentId} with success=${success}`);

      const response = await axios.post(
        `${API_BASE_URL}/api/payments/process/${paymentId}`,
        { simulateSuccess: success },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("Process response:", response.data);

      if (success) {
        setMessage("✅ Payment successful! Redirecting to your bookings...");
        setTimeout(() => {
          navigate("/my-bookings");
        }, 2000);
      } else {
        setError("❌ Payment failed. Try again or use different method.");
      }
    } catch (error) {
      console.error("Process error:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Payment processing failed");
    } finally {
      setLoading(false);
    }
  };

  if (!bookingId) {
    return <div>No booking information found. Redirecting...</div>;
  }

  return (
    <div style={{
      maxWidth: "500px",
      margin: "40px auto",
      padding: "30px",
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0 0 20px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
        Payment Page
      </h2>

      <div style={{
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "25px"
      }}>
        <h3>Booking Summary</h3>
        <p><strong>Event:</strong> {eventName}</p>
        <p><strong>Quantity:</strong> {quantity}</p>
        <p><strong>Total Amount:</strong> ₹{amount}</p>
        <p><strong>Booking ID:</strong> {bookingId}</p>
      </div>

      {!paymentId ? (
        <button
          onClick={initiatePayment}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "10px"
          }}
        >
          {loading ? "Initiating..." : "Initiate Mock Payment"}
        </button>
      ) : (
        <div>
          <button
            onClick={() => processPayment(true)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "10px"
            }}
          >
            {loading ? "Processing..." : "✅ Simulate Success"}
          </button>
          
          <button
            onClick={() => processPayment(false)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Processing..." : "❌ Simulate Failure"}
          </button>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#d4edda",
          color: "#155724",
          borderRadius: "5px",
          textAlign: "center"
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          borderRadius: "5px",
          textAlign: "center"
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}

export default PaymentPage;