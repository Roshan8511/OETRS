import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./PaymentGateway.css";
import { API_BASE_URL } from "../config/api";

function PaymentGateway() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  
  // Card Payment State
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: ""
  });
  
  // UPI Payment State
  const [upiId, setUpiId] = useState("");
  
  // Net Banking State
  const [selectedBank, setSelectedBank] = useState("");
  
  // Payment Status
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Timer for OTP simulation
  const [countdown, setCountdown] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const banks = [
    { id: "sbi", name: "State Bank of India", logo: "🏦", color: "#2E7D32" },
    { id: "hdfc", name: "HDFC Bank", logo: "🏛️", color: "#0044CC" },
    { id: "icici", name: "ICICI Bank", logo: "🏢", color: "#F15A22" },
    { id: "axis", name: "Axis Bank", logo: "📊", color: "#8B0000" },
    { id: "kotak", name: "Kotak Mahindra Bank", logo: "💎", color: "#800080" },
    { id: "yes", name: "Yes Bank", logo: "✅", color: "#4CAF50" },
    { id: "pnb", name: "Punjab National Bank", logo: "🏦", color: "#9C27B0" },
    { id: "bob", name: "Bank of Baroda", logo: "🌐", color: "#FF9800" }
  ];

  // Offers
  const offers = [
    { id: 1, code: "WELCOME20", discount: 20, minAmount: 500, description: "20% off on first booking" },
    { id: 2, code: "EVENT10", discount: 10, minAmount: 300, description: "10% off on all events" },
    { id: 3, code: "GROUP5", discount: 5, minAmount: 1000, description: "5% off on bulk bookings" },
    { id: 4, code: "FESTIVE15", discount: 15, minAmount: 800, description: "15% off festive season" }
  ];
  
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [offerCode, setOfferCode] = useState("");
  const [discountedAmount, setDiscountedAmount] = useState(null);
  const [originalAmount, setOriginalAmount] = useState(0);

  useEffect(() => {
    // Get booking details from location state or localStorage
    const state = location.state;
    if (state && state.bookingDetails) {
      setBookingDetails(state.bookingDetails);
      setOriginalAmount(state.bookingDetails.totalAmount);
      setDiscountedAmount(state.bookingDetails.totalAmount);
    } else {
      // Fallback - check localStorage
      const savedBooking = localStorage.getItem("pendingBooking");
      if (savedBooking) {
        const booking = JSON.parse(savedBooking);
        setBookingDetails(booking);
        setOriginalAmount(booking.totalAmount);
        setDiscountedAmount(booking.totalAmount);
      } else {
        // Redirect back if no booking details
        setMessage({ text: "No booking details found. Please try again.", type: "error" });
        setTimeout(() => navigate("/events"), 2000);
      }
    }
  }, [location, navigate]);

  // Handle Card Input Formatting
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    value = value.replace(/(\d{4})/g, "$1 ").trim();
    setCardDetails({ ...cardDetails, cardNumber: value });
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\s/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    setCardDetails({ ...cardDetails, expiryDate: value });
  };

  const handleCvvChange = (e) => {
    let value = e.target.value;
    if (value.length > 3) value = value.slice(0, 3);
    setCardDetails({ ...cardDetails, cvv: value });
  };

  // Validate Card Details
  const validateCardDetails = () => {
    const cardNum = cardDetails.cardNumber.replace(/\s/g, "");
    if (cardNum.length !== 16) {
      setMessage({ text: "Please enter a valid 16-digit card number", type: "error" });
      return false;
    }
    if (!cardDetails.cardholderName.trim()) {
      setMessage({ text: "Please enter cardholder name", type: "error" });
      return false;
    }
    if (cardDetails.expiryDate.length !== 5) {
      setMessage({ text: "Please enter valid expiry date (MM/YY)", type: "error" });
      return false;
    }
    if (cardDetails.cvv.length !== 3) {
      setMessage({ text: "Please enter valid CVV", type: "error" });
      return false;
    }
    return true;
  };

  // Validate UPI Details
  const validateUpiDetails = () => {
    if (!upiId.includes("@") || !upiId.trim()) {
      setMessage({ text: "Please enter a valid UPI ID (e.g., name@bank)", type: "error" });
      return false;
    }
    return true;
  };

  // Validate Net Banking Details
  const validateNetBankingDetails = () => {
    if (!selectedBank) {
      setMessage({ text: "Please select a bank", type: "error" });
      return false;
    }
    return true;
  };

  // Apply Offer
  const applyOffer = () => {
    const offer = offers.find(o => o.code === offerCode.toUpperCase());
    if (!offer) {
      setMessage({ text: "Invalid offer code", type: "error" });
      return;
    }
    if (originalAmount < offer.minAmount) {
      setMessage({ text: `Minimum order amount for this offer is ₹${offer.minAmount}`, type: "error" });
      return;
    }
    
    const discount = (originalAmount * offer.discount) / 100;
    const newAmount = originalAmount - discount;
    setDiscountedAmount(newAmount);
    setAppliedOffer(offer);
    setMessage({ text: `Offer applied! You saved ₹${discount.toFixed(2)}`, type: "success" });
    setOfferCode("");
  };

  // Remove Offer
  const removeOffer = () => {
    setDiscountedAmount(originalAmount);
    setAppliedOffer(null);
    setMessage({ text: "Offer removed", type: "success" });
  };

  // Simulate OTP sending
  const sendOtp = () => {
    setShowOtpModal(true);
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Store timer reference to clear later
    window.otpTimer = timer;
  };

  // Process Payment
  const processPayment = async () => {
    // Validate based on payment method
    if (paymentMethod === "card" && !validateCardDetails()) return;
    if (paymentMethod === "upi" && !validateUpiDetails()) return;
    if (paymentMethod === "netbanking" && !validateNetBankingDetails()) return;
    
    // Show OTP modal for card/UPI (simulation)
    if (paymentMethod === "card" || paymentMethod === "upi") {
      sendOtp();
    } else {
      // Net banking - direct payment
      await completePayment();
    }
  };

  // Verify OTP and complete payment
  const verifyOtpAndPay = async () => {
    if (otpCode.length !== 6) {
      setMessage({ text: "Please enter a valid 6-digit OTP", type: "error" });
      return;
    }
    
    setShowOtpModal(false);
    if (window.otpTimer) clearInterval(window.otpTimer);
    await completePayment();
  };

  // Complete Payment
  const completePayment = async () => {
    setLoading(true);
    setPaymentStatus("processing");
    
    try {
      const token = localStorage.getItem("token");
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transactionId = "TXN_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

      // ✅ CREATE the booking in the database now that payment is "confirmed"
      let savedBookingId = null;
      if (bookingDetails && bookingDetails.eventId) {
        try {
          const bookingRes = await axios.post(
            `${API_BASE_URL}/api/bookings`,
            {
              eventId: bookingDetails.eventId,
              quantity: bookingDetails.quantity || 1,
              totalAmount: discountedAmount,
              selectedSeats: bookingDetails.selectedSeats || [],
              cinema: bookingDetails.cinema || null,
              showDate: bookingDetails.showDate || null,
              showTime: bookingDetails.showTime || null,
              transactionId,
              paymentMethod,
              paymentStatus: "completed"
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          savedBookingId = bookingRes.data.booking?._id;
          console.log("✅ Booking saved:", savedBookingId);
        } catch (err) {
          console.error("Error saving booking:", err.response?.data || err.message);
          // Don't block the success flow for a save error
        }
      }

      setPaymentStatus("success");
      localStorage.setItem("lastPayment", JSON.stringify({ transactionId, amount: discountedAmount, paymentMethod }));
      localStorage.removeItem("pendingBooking");
      setMessage({ text: "Payment successful! Redirecting...", type: "success" });
      
      setTimeout(() => {
        navigate("/payment-success", { 
          state: { 
            transactionId,
            amount: discountedAmount,
            bookingDetails: { ...bookingDetails, bookingId: savedBookingId }
          } 
        });
      }, 2000);

    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
      setMessage({ text: "Payment failed. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!bookingDetails) {
    return (
      <div className="payment-gateway-page">
        <div className="payment-container">
          <div className="loading-payment">
            <div className="loading-spinner"></div>
            <p>Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-gateway-page">
      <div className="payment-container">
        {/* Header */}
        <div className="payment-header">
          <h1>Secure Payment Gateway</h1>
          <p>Complete your booking with safe and secure payment</p>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`payment-message ${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <div className="payment-grid">
          {/* Left Column - Payment Methods */}
          <div className="payment-left">
            <div className="payment-methods-section">
              <h2>Select Payment Method</h2>
              
              <div className="payment-methods">
                <div 
                  className={`payment-method-card ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="method-radio">
                    <div className={`radio-circle ${paymentMethod === 'card' ? 'selected' : ''}`}>
                      {paymentMethod === 'card' && <div className="radio-dot"></div>}
                    </div>
                  </div>
                  <div className="method-icon">💳</div>
                  <div className="method-info">
                    <h4>Credit / Debit Card</h4>
                    <p>Pay using Visa, MasterCard, Rupay, Amex</p>
                  </div>
                </div>

                <div 
                  className={`payment-method-card ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <div className="method-radio">
                    <div className={`radio-circle ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                      {paymentMethod === 'upi' && <div className="radio-dot"></div>}
                    </div>
                  </div>
                  <div className="method-icon">📱</div>
                  <div className="method-info">
                    <h4>UPI / BHIM</h4>
                    <p>Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>
                </div>

                <div 
                  className={`payment-method-card ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('netbanking')}
                >
                  <div className="method-radio">
                    <div className={`radio-circle ${paymentMethod === 'netbanking' ? 'selected' : ''}`}>
                      {paymentMethod === 'netbanking' && <div className="radio-dot"></div>}
                    </div>
                  </div>
                  <div className="method-icon">🏦</div>
                  <div className="method-info">
                    <h4>Net Banking</h4>
                    <p>All major banks supported</p>
                  </div>
                </div>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <div className="payment-form fade-in">
                  <h3>Card Details</h3>
                  <div className="card-preview">
                    <div className="card-chip">💳</div>
                    <div className="card-number-preview">
                      {cardDetails.cardNumber || "•••• •••• •••• ••••"}
                    </div>
                    <div className="card-details-preview">
                      <div>
                        <label>Cardholder Name</label>
                        <div>{cardDetails.cardholderName || "YOUR NAME"}</div>
                      </div>
                      <div>
                        <label>Expiry</label>
                        <div>{cardDetails.expiryDate || "MM/YY"}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength="19"
                    />
                    <span className="card-icons">💳 Visa 💳 MasterCard 💳 Rupay</span>
                  </div>
                  
                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="As printed on card"
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiryDate}
                        onChange={handleExpiryChange}
                        maxLength="5"
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={handleCvvChange}
                        maxLength="3"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Payment Form */}
              {paymentMethod === 'upi' && (
                <div className="payment-form fade-in">
                  <h3>UPI Payment</h3>
                  <div className="upi-apps">
                    <div className="app-icon">📱 Google Pay</div>
                    <div className="app-icon">📱 PhonePe</div>
                    <div className="app-icon">📱 Paytm</div>
                    <div className="app-icon">📱 Amazon Pay</div>
                  </div>
                  
                  <div className="form-group">
                    <label>UPI ID</label>
                    <input
                      type="text"
                      placeholder="yourname@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <span className="field-hint">Enter your UPI ID (e.g., name@bank)</span>
                  </div>
                  
                  <div className="qr-code-placeholder">
                    <div className="qr-icon">📱</div>
                    <p>Scan QR code with any UPI app</p>
                  </div>
                </div>
              )}

              {/* Net Banking Form */}
              {paymentMethod === 'netbanking' && (
                <div className="payment-form fade-in">
                  <h3>Select Your Bank</h3>
                  <div className="banks-grid">
                    {banks.map(bank => (
                      <div
                        key={bank.id}
                        className={`bank-card ${selectedBank === bank.id ? 'selected' : ''}`}
                        onClick={() => setSelectedBank(bank.id)}
                      >
                        <span className="bank-logo">{bank.logo}</span>
                        <span className="bank-name">{bank.name}</span>
                        {selectedBank === bank.id && <span className="bank-check">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Secure Note */}
            <div className="secure-note">
              <span className="secure-icon">🔒</span>
              <div>
                <strong>100% Secure Payment</strong>
                <p>Your payment information is encrypted and secure</p>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="payment-right">
            <div className="order-summary">
              <h2>Order Summary</h2>
              
              <div className="event-summary">
                {bookingDetails.eventImage && (
                  <img
                    src={bookingDetails.eventImage}
                    alt={bookingDetails.eventTitle}
                    onError={(e) => { e.target.style.display = "none"; }}
                    style={{
                      width: "100%",
                      height: "140px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      display: "block"
                    }}
                  />
                )}
                {!bookingDetails.eventImage && (
                  <div style={{
                    width: "100%",
                    height: "100px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "36px"
                  }}>🎫</div>
                )}
                <h3>{bookingDetails.eventTitle || "Event"}</h3>
                <p>📍 {bookingDetails.eventVenue || "Venue"}</p>
                <p>📅 {bookingDetails.eventDate || new Date().toLocaleDateString()}</p>
                {bookingDetails.eventTime && bookingDetails.eventTime !== "TBA" && (
                  <p>⏰ {bookingDetails.eventTime}</p>
                )}
                {bookingDetails.selectedSeats && bookingDetails.selectedSeats.length > 0 && (
                  <p style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
                    Seats: {bookingDetails.selectedSeats.map(s => s.displayName || s.id).join(", ")}
                  </p>
                )}
              </div>
              
              <div className="price-details">
                <div className="price-row">
                  <span>Ticket Price</span>
                  <span>{formatCurrency(bookingDetails.ticketPrice || 0)} × {bookingDetails.quantity || 1}</span>
                </div>
                <div className="price-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(originalAmount)}</span>
                </div>
                
                {appliedOffer && (
                  <div className="price-row discount">
                    <span>Discount ({appliedOffer.discount}%)</span>
                    <span>-{formatCurrency(originalAmount - discountedAmount)}</span>
                  </div>
                )}
                
                <div className="price-row total">
                  <span>Total Amount</span>
                  <span>{formatCurrency(discountedAmount)}</span>
                </div>
              </div>
              
              {/* Offer Code */}
              <div className="offer-section">
                <div className="offer-input">
                  <input
                    type="text"
                    placeholder="Enter offer code"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    disabled={appliedOffer !== null}
                  />
                  {appliedOffer ? (
                    <button className="remove-offer-btn" onClick={removeOffer}>Remove</button>
                  ) : (
                    <button className="apply-offer-btn" onClick={applyOffer}>Apply</button>
                  )}
                </div>
                <div className="available-offers">
                  <p>Available Offers:</p>
                  {offers.slice(0, 3).map(offer => (
                    <span key={offer.id} className="offer-tag">{offer.code}</span>
                  ))}
                </div>
              </div>
              
              <button 
                className="pay-now-btn"
                onClick={processPayment}
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner-small"></span>
                    Processing...
                  </span>
                ) : (
                  `Pay ${formatCurrency(discountedAmount)}`
                )}
              </button>
              
              <div className="payment-guarantee">
                <div>🔒 Secure SSL Encryption</div>
                <div>💰 100% Money Back Guarantee</div>
                <div>📧 Instant E-Ticket Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="modal-content otp-modal">
            <h3>Verify Payment</h3>
            <p>Enter the OTP sent to your registered mobile number</p>
            <div className="otp-input">
              <input
                type="text"
                maxLength="6"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            <div className="otp-timer">
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 
                <button className="resend-otp" onClick={sendOtp}>Resend OTP</button>
              }
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowOtpModal(false)}>Cancel</button>
              <button className="btn-verify" onClick={verifyOtpAndPay}>Verify & Pay</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {paymentStatus === "processing" && (
        <div className="modal-overlay">
          <div className="modal-content payment-processing">
            <div className="processing-spinner"></div>
            <h3>Processing Payment</h3>
            <p>Please wait while we securely process your payment...</p>
            <p className="do-not-close">Do not close this window</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentGateway;