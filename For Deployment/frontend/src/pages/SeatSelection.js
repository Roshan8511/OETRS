import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SeatSelection.css";
import { API_BASE_URL } from "../config/api";

/*
  Seat layout per cinema (professional theatre style):
  Rows A-B  → RECLINER   (6 seats each)  — premium
  Rows C-D  → EXECUTIVE  (10, 9 seats)   — upper
  Rows E-F  → ROYAL      (10, 9 seats)   — mid
  Rows G-H  → LOUNGER    (8, 7 seats)    — front
*/

const LAYOUT_DEF = [
  { category: "recliner",  label: "RECLINER",  rows: [{ r:"A", n:6 },{ r:"B", n:6 }]  },
  { category: "executive", label: "EXECUTIVE", rows: [{ r:"C", n:10 },{ r:"D", n:9 }] },
  { category: "royal",     label: "ROYAL",     rows: [{ r:"E", n:10 },{ r:"F", n:9 }] },
  { category: "lounger",   label: "LOUNGER",   rows: [{ r:"G", n:8 },{ r:"H", n:7 }]  }
];

function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { event, cinema, showDate, showTime, date, venue } = location.state || {};

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats]     = useState(new Set()); // e.g. Set {"A1","B3"}
  const [loadingSeats, setLoadingSeats]   = useState(true);
  const [zoom, setZoom] = useState(1);

  const basePrice      = showTime?.price || 200;
  const prices = {
    recliner:  Math.round(basePrice * 1.5),
    executive: Math.round(basePrice * 1.1),
    royal:     basePrice,
    lounger:   Math.round(basePrice * 1.1)
  };

  useEffect(() => {
    if (!event || !showTime) { navigate("/events"); return; }
    fetchBookedSeats();
  }, []);

  const fetchBookedSeats = async () => {
    setLoadingSeats(true);
    try {
      // Fetch the latest event data to get current bookedSeats from DB
      const res = await axios.get(`${API_BASE_URL}/api/events/${event._id}`);
      const latestEvent = res.data;
      const booked = new Set();
      if (latestEvent.cinemaShows) {
        for (const cs of latestEvent.cinemaShows) {
          if (cs.cinemaName === cinema?.cinemaName) {
            for (const sd of cs.showDates) {
              if (new Date(sd.date).toDateString() === new Date(showDate?.date).toDateString()) {
                for (const st of sd.showTimes) {
                  if (st.time === showTime?.time) {
                    (st.bookedSeats || []).forEach(s => booked.add(s));
                  }
                }
              }
            }
          }
        }
      }
      setBookedSeats(booked);
    } catch (e) {
      console.error("Failed to fetch seat data:", e);
    } finally {
      setLoadingSeats(false);
    }
  };

  const getSeatStatus = (rowLabel, seatNum) => {
    const name = `${rowLabel}${seatNum}`;
    if (bookedSeats.has(name)) return "sold";
    return "available";
  };

  const totalAmount = selectedSeats.reduce((s, seat) => s + seat.price, 0);
  const convenienceFee = Math.round(totalAmount * 0.1);

  const handleSeatClick = (categoryKey, rowLabel, seatNum, status) => {
    if (status === "sold") return;
    const displayName = `${rowLabel}${seatNum}`;
    const seatId = `${categoryKey}-${displayName}`;
    const isSelected = selectedSeats.some(s => s.id === seatId);

    if (isSelected) {
      setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
    } else {
      if (selectedSeats.length >= 10) { alert("Max 10 seats per booking."); return; }
      setSelectedSeats(prev => [...prev, {
        id: seatId,
        displayName,
        category: categoryKey,
        categoryName: LAYOUT_DEF.find(l => l.category === categoryKey)?.label || categoryKey,
        row: rowLabel,
        seatNumber: seatNum,
        price: prices[categoryKey]
      }]);
    }
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) { alert("Please select at least one seat."); return; }
    const bookingDetails = {
      eventId:    event._id,
      eventTitle: event.title,
      eventCategory: event.category,
      eventType:  event.eventType,
      eventVenue: cinema?.cinemaName || venue?.name,
      eventDate:  date ? `${date.day}, ${date.date} ${date.month}` : new Date(showDate?.date).toLocaleDateString(),
      eventTime:  showTime?.time || "TBA",
      eventImage: event.image || event.posterImage || null,
      ticketPrice: Math.round(totalAmount / selectedSeats.length),
      quantity:   selectedSeats.length,
      totalAmount: totalAmount + convenienceFee,
      selectedSeats,
      cinema, showDate, showTime
    };
    localStorage.setItem("pendingBooking", JSON.stringify(bookingDetails));
    navigate("/payment", { state: { bookingDetails } });
  };

  if (!event || !showTime) return null;

  return (
    <div className="seat-selection-page">
      <div className="seat-selection-container">
        {/* Header */}
        <div className="booking-header">
          <div className="booking-info">
            <h2>{event.title}</h2>
            <div className="booking-details">
              <div className="booking-detail"><span>📅</span><span>{date?.day}, {date?.date} {date?.month}</span></div>
              <div className="booking-detail"><span>🎪</span><span>{cinema?.cinemaName || venue?.name}</span></div>
              <div className="booking-detail"><span>📍</span><span>{cinema?.location || venue?.location}</span></div>
              <div className="booking-detail"><span>⏰</span><span>{showTime?.time}</span></div>
            </div>
          </div>
          <div className="booking-price">
            <div className="label">Selected</div>
            <div className="amount">{selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {/* Cinema Layout */}
        <div className="cinema-layout">
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => setZoom(p => Math.max(p-0.15, 0.7))}>−</button>
            <span style={{ color:"#ccc", fontSize:"12px", minWidth:"40px", textAlign:"center" }}>{Math.round(zoom*100)}%</span>
            <button className="zoom-btn" onClick={() => setZoom(p => Math.min(p+0.15, 1.6))}>+</button>
          </div>

          <div className="screen">🎬 SCREEN</div>

          {loadingSeats ? (
            <div style={{ textAlign:"center", padding:"40px", color:"#ccc" }}>
              <div style={{ fontSize:"24px", marginBottom:"8px" }}>⟳</div>
              Loading seat availability…
            </div>
          ) : (
            <div style={{ transform:`scale(${zoom})`, transformOrigin:"top center", transition:"transform 0.2s" }}>
              {LAYOUT_DEF.map(({ category, label, rows }) => (
                <div key={category} className="seat-category">
                  <div className="category-title">
                    {label}
                    <span className="category-price">₹{prices[category]}</span>
                  </div>
                  {rows.map(({ r: rowLabel, n: count }) => (
                    <div key={rowLabel} style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"6px", justifyContent:"center" }}>
                      <span style={{ color:"#888", fontSize:"12px", width:"16px", textAlign:"center", flexShrink:0 }}>{rowLabel}</span>
                      <div className="seat-grid" style={{ justifyContent:"center" }}>
                        {Array.from({ length: count }, (_, i) => {
                          const seatNum = i + 1;
                          const status  = getSeatStatus(rowLabel, seatNum);
                          const displayName = `${rowLabel}${seatNum}`;
                          const seatId = `${category}-${displayName}`;
                          const isSelected = selectedSeats.some(s => s.id === seatId);
                          return (
                            <div
                              key={seatNum}
                              className={`seat ${status} ${category} ${isSelected ? "selected" : ""}`}
                              onClick={() => handleSeatClick(category, rowLabel, seatNum, status)}
                              title={status === "sold" ? `${displayName} — Booked` : `${displayName} — ₹${prices[category]}`}
                            >
                              {seatNum}
                            </div>
                          );
                        })}
                      </div>
                      <span style={{ color:"#888", fontSize:"12px", width:"16px", textAlign:"center", flexShrink:0 }}>{rowLabel}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="seat-legend">
            <div className="legend-item"><div className="legend-box available"></div><span>Available</span></div>
            <div className="legend-item"><div className="legend-box selected"></div><span>Selected</span></div>
            <div className="legend-item"><div className="legend-box sold"></div><span>Booked</span></div>
            <div className="legend-item"><div className="legend-box recliner"></div><span>Recliner ₹{prices.recliner}</span></div>
            <div className="legend-item"><div className="legend-box executive"></div><span>Executive ₹{prices.executive}</span></div>
            <div className="legend-item"><div className="legend-box royal"></div><span>Royal ₹{prices.royal}</span></div>
            <div className="legend-item"><div className="legend-box lounger"></div><span>Lounger ₹{prices.lounger}</span></div>
          </div>
        </div>

        {/* Summary */}
        <div className="booking-summary">
          <h3>Booking Summary</h3>
          {selectedSeats.length === 0 ? (
            <p style={{ color:"#888", textAlign:"center", padding:"20px 0" }}>No seats selected yet</p>
          ) : (
            <>
              <div className="selected-seats" style={{ marginBottom:"16px" }}>
                {selectedSeats.map(seat => (
                  <span key={seat.id} className="seat-tag">
                    {seat.displayName} ({seat.categoryName}) — ₹{seat.price}
                  </span>
                ))}
              </div>
              <div className="summary-row"><span>Tickets ({selectedSeats.length})</span><span>₹{totalAmount}</span></div>
              <div className="summary-row"><span>Convenience Fee (10%)</span><span>₹{convenienceFee}</span></div>
              <div className="summary-row total"><span>Total</span><span>₹{totalAmount + convenienceFee}</span></div>
            </>
          )}
        </div>

        <button className="proceed-btn" onClick={handleProceedToPayment} disabled={selectedSeats.length === 0}>
          {selectedSeats.length === 0 ? "Select Seats to Continue" : `Proceed to Payment — ₹${totalAmount + convenienceFee}`}
        </button>
      </div>
    </div>
  );
}

export default SeatSelection;