import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState(0);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    const state = location.state;
    if (state) {
      setTransactionId(state.transactionId);
      setAmount(state.amount);
      setBookingDetails(state.bookingDetails);
    } else {
      // Check localStorage
      const lastPayment = localStorage.getItem("lastPayment");
      if (lastPayment) {
        const payment = JSON.parse(lastPayment);
        setTransactionId(payment.transactionId);
        setAmount(payment.amount);
      }
    }
  }, [location]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
        <h1 style={{ color: '#1976D2', marginBottom: '10px' }}>Payment Successful!</h1>
        <p style={{ color: '#42A5F5', marginBottom: '30px' }}>Your booking has been confirmed</p>
        
        <div style={{
          background: '#F5F9FF',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <p><strong>Transaction ID:</strong> {transactionId}</p>
          <p><strong>Amount Paid:</strong> ₹{amount}</p>
          <p><strong>Event:</strong> {bookingDetails?.eventTitle || "Event"}</p>
          <p><strong>Quantity:</strong> {bookingDetails?.quantity || 1}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => navigate("/my-bookings")}
            style={{
              flex: 1,
              padding: '12px',
              background: '#1976D2',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            View My Bookings
          </button>
          <button 
            onClick={() => navigate("/events")}
            style={{
              flex: 1,
              padding: '12px',
              background: '#E3F2FD',
              color: '#1976D2',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Browse More Events
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;