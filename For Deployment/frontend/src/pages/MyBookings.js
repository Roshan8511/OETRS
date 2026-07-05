import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./MyBookings.css";
import { API_BASE_URL } from "../config/api";

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [stats, setStats] = useState({ total: 0, confirmed: 0, cancelled: 0, totalSpent: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;

  useEffect(() => { fetchBookings(); }, []);
  useEffect(() => { filterAndSortBookings(); }, [bookings, searchTerm, statusFilter, sortBy]);

  const fetchBookings = async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) { setError("Please login to view bookings"); setLoading(false); return; }
      const res = await axios.get(`${API_BASE_URL}/api/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setBookings(data);
      calculateStats(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings. Please try again.");
    } finally { setLoading(false); }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      confirmed: data.filter(b => b.status === "confirmed").length,
      cancelled: data.filter(b => b.status === "cancelled").length,
      totalSpent: data.filter(b => b.status === "confirmed").reduce((s, b) => s + (b.totalAmount || 0), 0)
    });
  };

  const filterAndSortBookings = () => {
    let f = [...bookings];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter(b =>
        b.eventId?.title?.toLowerCase().includes(q) ||
        getEventVenue(b.eventId)?.toLowerCase().includes(q) ||
        b._id?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") f = f.filter(b => b.status === statusFilter);
    switch (sortBy) {
      case "newest": f.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case "oldest": f.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case "highest": f.sort((a, b) => b.totalAmount - a.totalAmount); break;
      case "lowest": f.sort((a, b) => a.totalAmount - b.totalAmount); break;
      default: break;
    }
    setFilteredBookings(f); setCurrentPage(1);
  };

  const getEventImage = (event) => {
    if (!event) return null;
    if (event.image && !["default-event.jpg","null","undefined"].includes(event.image)) return event.image;
    if (event.posterImage && !["default-event.jpg","null","undefined"].includes(event.posterImage)) return event.posterImage;
    return null;
  };

  // singleVenue / eventDates[].venue / cinemaShows[].location are stored as
  // OBJECTS in the database ({ name, location: {...} }), not plain strings.
  // Returning that object here and rendering it directly as JSX crashes React
  // ("Objects are not valid as a React child") and blanks the whole page.
  const getVenueName = (venueData) => {
    if (!venueData) return null;
    if (typeof venueData === "string") return venueData;
    if (typeof venueData === "object") {
      return (
        venueData.name ||
        venueData.cinemaName ||
        venueData.city ||
        venueData.fullAddress ||
        venueData.location?.city ||
        venueData.location?.fullAddress ||
        null
      );
    }
    return null;
  };

  const getEventVenue = (event) => {
    if (!event) return "Venue TBA";
    if (event.eventType === "single" && event.singleVenue) return getVenueName(event.singleVenue) || "Venue TBA";
    if (event.eventType === "movie" && event.cinemaShows?.[0]?.cinemaName) return event.cinemaShows[0].cinemaName;
    if (event.eventType === "movie" && event.cinemaShows?.[0]?.location) return getVenueName(event.cinemaShows[0].location) || "Venue TBA";
    if (event.eventType === "multi-day" && event.eventDates?.[0]?.venue) return getVenueName(event.eventDates[0].venue) || "Venue TBA";
    if (event.venue) return getVenueName(event.venue) || "Venue TBA";
    return "Venue TBA";
  };

  const getEventDate = (event) => {
    if (!event) return null;
    try {
      if (event.eventType === "single" && event.singleDate) return new Date(event.singleDate);
      if (event.eventType === "movie" && event.movieStartDate) return new Date(event.movieStartDate);
      if (event.eventType === "multi-day" && event.eventDates?.[0]?.date) return new Date(event.eventDates[0].date);
      if (event.startDate) return new Date(event.startDate);
      if (event.date) return new Date(event.date);
    } catch (e) {}
    return null;
  };

  const formatEventDate = (event) => {
    const d = getEventDate(event);
    if (!d || isNaN(d)) return "Date TBA";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const formatBookedOn = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch { return "—"; }
  };

  const getEventType = (event) => {
    if (!event) return "EVENT";
    if (event.eventType === "movie") return "MOVIE";
    if (event.eventType === "multi-day") return "MULTI-DAY";
    return "EVENT";
  };

  const getCategoryColor = (category) => {
    const colors = { music: "#9c27b0", sports: "#2196f3", movies: "#e91e63",
      technology: "#00bcd4", business: "#ff9800", food: "#4caf50",
      art: "#ff5722", education: "#3f51b5" };
    return colors[category?.toLowerCase()] || "#667eea";
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    setCancellingId(bookingId); setError(""); setSuccess("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/bookings/cancel/${bookingId}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Booking cancelled successfully.");
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking.");
    } finally { setCancellingId(null); }
  };

  // ✅ FIXED: Delete from database permanently
  const handleDelete = async (bookingId) => {
    if (!window.confirm("Permanently delete this cancelled booking from your history? This action cannot be undone.")) return;
    setDeletingId(bookingId);
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      // API call to delete booking from database
      await axios.delete(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess("Booking permanently removed from your history.");
      fetchBookings(); // Refresh the list from database
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Failed to delete booking. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadTicket = async (booking) => {
    setDownloadingId(booking._id);
    const event = booking.eventId;
    const imageUrl = getEventImage(event);
    const venue = getEventVenue(event);
    const eventDateStr = formatEventDate(event);
    const bookedOn = formatBookedOn(booking.createdAt);
    const bookingRef = booking._id?.slice(-10).toUpperCase();
    const catColor = getCategoryColor(event?.category);
    const seats = booking.selectedSeats?.length > 0
      ? booking.selectedSeats.map(s => s.displayName || s.id).join(", ") : null;

    let imgBase64 = "";
    if (imageUrl) {
      try {
        const res = await fetch(imageUrl + (imageUrl.includes("?") ? "&" : "?") + "_t=" + Date.now(), { mode: "cors" });
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        imgBase64 = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        try {
          imgBase64 = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth || 800;
              canvas.height = img.naturalHeight || 400;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.onerror = reject;
            img.src = imageUrl;
          });
        } catch (e2) {
          imgBase64 = "";
        }
      }
    }

    const barHeights = [40,30,50,20,45,35,55,25,48,32,52,22,44,38,56,28,42,36,48,26,46,34,54,24,44,30,50,28];
    const barWidths  = [3,2,4,2,3,2,4,2,3,2,4,1,3,2,4,2,3,2,3,2,4,2,3,1,3,2,4,2];
    const barsHTML = barHeights.map((h, i) =>
      `<div style="height:${h}px;width:${barWidths[i]}px;background:#1a1a2e;border-radius:1px;display:inline-block;margin-right:2px;vertical-align:bottom;"></div>`
    ).join("");

    const ticketHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Ticket — ${event?.title || "Event"}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;background:#f0f2f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}
  .ticket{max-width:660px;width:100%;background:white;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.18);}
  .hero{position:relative;height:220px;background:linear-gradient(135deg,${catColor},#1a1a2e);overflow:hidden;}
  .hero img{width:100%;height:100%;object-fit:cover;display:block;}
  .hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.1) 60%);}
  .hero-content{position:absolute;bottom:20px;left:24px;right:24px;}
  .type-badge{display:inline-block;background:${catColor};color:white;font-size:10px;font-weight:700;padding:3px 10px;border-radius:12px;letter-spacing:1px;margin-bottom:8px;}
  .hero-title{color:white;font-size:26px;font-weight:800;line-height:1.2;text-shadow:0 2px 8px rgba(0,0,0,0.4);}
  .status-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:${booking.status==="confirmed"?"#e8f5e9":"#fce4ec"};border-bottom:1px solid ${booking.status==="confirmed"?"#c8e6c9":"#f8bbd0"};}
  .status-pill{font-size:13px;font-weight:700;color:${booking.status==="confirmed"?"#2e7d32":"#c62828"};}
  .booking-ref{font-size:12px;color:#666;font-family:monospace;}
  .body{padding:24px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #eee;border-radius:12px;overflow:hidden;margin-bottom:24px;}
  .cell{padding:14px 18px;border-right:1px solid #eee;border-bottom:1px solid #eee;}
  .cell:nth-child(even){border-right:none;}
  .cell.full{grid-column:1/-1;border-right:none;}
  .cell-label{font-size:10px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:5px;}
  .cell-val{font-size:14px;font-weight:600;color:#1a1a2e;line-height:1.4;}
  .tear{display:flex;align-items:center;margin:0;padding:0 24px;}
  .tear-line{flex:1;border-top:2px dashed #ddd;}
  .barcode-section{padding:20px 24px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px;}
  .barcode-id{font-family:monospace;font-size:13px;font-weight:700;color:#1a1a2e;letter-spacing:2px;margin-top:8px;display:block;}
  .price-label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;}
  .price-amount{font-size:34px;font-weight:800;color:${catColor};}
  .footer{background:#f8f9fa;padding:14px 24px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;}
  .brand{font-size:16px;font-weight:800;color:#1a1a2e;}
  .note{font-size:11px;color:#999;}
  @media print{body{background:white;padding:0;}.ticket{box-shadow:none;}}
</style>
</head>
<body>
<div class="ticket">
  <div class="hero">
    ${imgBase64 ? `<img src="${imgBase64}" alt="${event?.title||""}" style="width:100%;height:100%;object-fit:cover;display:block;" onload="this.dataset.loaded='1'">` : ""}
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="type-badge">${getEventType(event)} · ${(event?.category||"EVENT").toUpperCase()}</div>
      <div class="hero-title">${event?.title||"Event"}</div>
    </div>
  </div>
  <div class="status-bar">
    <div class="status-pill">${booking.status==="confirmed"?"✓ CONFIRMED":"✕ CANCELLED"}</div>
    <div class="booking-ref">REF: ${bookingRef}</div>
  </div>
  <div class="body">
    <div class="grid">
      <div class="cell"><div class="cell-label">📅 Event Date</div><div class="cell-val">${eventDateStr}</div></div>
      <div class="cell"><div class="cell-label">📍 Venue</div><div class="cell-val">${venue}</div></div>
      <div class="cell"><div class="cell-label">🎫 Tickets</div><div class="cell-val">${booking.quantity||1} ticket${(booking.quantity||1)>1?"s":""}</div></div>
      <div class="cell"><div class="cell-label">🏷️ Category</div><div class="cell-val">${event?.category||"General"}</div></div>
      ${seats ? `<div class="cell full"><div class="cell-label">💺 Seats</div><div class="cell-val">${seats}</div></div>` : ""}
      <div class="cell full" style="border-bottom:none;"><div class="cell-label">🕐 Booked On</div><div class="cell-val">${bookedOn}</div></div>
    </div>
    <div class="tear"><div class="tear-line"></div></div>
  </div>
  <div class="barcode-section">
    <div>
      <div>${barsHTML}</div>
      <span class="barcode-id">${booking._id?.slice(-14).toUpperCase()}</span>
    </div>
    <div style="text-align:right;">
      <div class="price-label">Total Paid</div>
      <div class="price-amount">₹${(booking.totalAmount||0).toLocaleString("en-IN")}</div>
    </div>
  </div>
  <div class="footer">
    <div class="brand">OETMS</div>
    <div class="note">Valid for one entry only · Non-transferable</div>
  </div>
</div>
<script>
  window.onload = function() {
    var img = document.querySelector('.hero img');
    if (img) {
      if (img.complete && img.naturalWidth > 0) {
        setTimeout(function(){ window.print(); }, 300);
      } else {
        img.onload  = function(){ setTimeout(function(){ window.print(); }, 300); };
        img.onerror = function(){ setTimeout(function(){ window.print(); }, 300); };
        setTimeout(function(){ window.print(); }, 3000);
      }
    } else {
      setTimeout(function(){ window.print(); }, 300);
    }
  };
</script>
</body>
</html>`;

    const blob = new Blob([ticketHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      const a = document.createElement("a");
      a.href = url; a.download = `OETMS-Ticket-${bookingRef}.html`; a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    setDownloadingId(null);
  };

  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const paginated = filteredBookings.slice((currentPage-1)*bookingsPerPage, currentPage*bookingsPerPage);

  if (loading) {
    return (
      <div className="mb-page">
        <div className="mb-container">
          <div className="mb-loading">
            <div className="mb-spinner"></div>
            <p>Loading your bookings…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-page">
      <div className="mb-container">

        <div className="mb-header">
          <div>
            <h1>My Bookings</h1>
            <p>All your tickets in one place</p>
          </div>
          <button className="mb-refresh-btn" onClick={fetchBookings}>↻ Refresh</button>
        </div>

        {bookings.length > 0 && (
          <div className="mb-stats">
            {[
              { icon: "🎫", num: stats.total, label: "Total", color: "#e8eeff", numColor: "#667eea" },
              { icon: "✅", num: stats.confirmed, label: "Confirmed", color: "#e8f5e9", numColor: "#2e7d32" },
              { icon: "❌", num: stats.cancelled, label: "Cancelled", color: "#fce4ec", numColor: "#c62828" },
              { icon: "💰", num: `₹${stats.totalSpent.toLocaleString("en-IN")}`, label: "Total Spent", color: "#fff8e1", numColor: "#e65100" }
            ].map((s, i) => (
              <div key={i} className="mb-stat-card">
                <div className="mb-stat-icon" style={{ background: s.color }}>{s.icon}</div>
                <div>
                  <div className="mb-stat-num" style={{ color: s.numColor }}>{s.num}</div>
                  <div className="mb-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {bookings.length > 0 && (
          <div className="mb-filters">
            <div className="mb-search">
              <span>🔍</span>
              <input type="text" placeholder="Search by event, venue or booking ID…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="mb-filter-row">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mb-select">
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="mb-select">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>
        )}

        {error && <div className="mb-alert mb-alert-error">⚠️ {error}</div>}
        {success && <div className="mb-alert mb-alert-success">✅ {success}</div>}

        {paginated.length > 0 ? (
          <>
            <div className="mb-list">
              {paginated.map((booking) => {
                const event = booking.eventId;
                const imageUrl = getEventImage(event);
                const venue = getEventVenue(event);
                const eventDateStr = formatEventDate(event);
                const catColor = getCategoryColor(event?.category);
                const isExpanded = expandedId === booking._id;
                const seats = booking.selectedSeats?.length > 0
                  ? booking.selectedSeats.map(s => s.displayName || s.id).join(", ") : null;

                return (
                  <div key={booking._id} className={`mb-card ${booking.status}`}>
                    <div className="mb-card-image" style={{ background: catColor }}>
                      {imageUrl
                        ? <img src={imageUrl} alt={event?.title} onError={e => e.target.style.display="none"} />
                        : <div className="mb-img-fallback">
                            {event?.category==="movies"?"🎬":event?.category==="music"?"🎵":event?.category==="sports"?"⚽":"🎫"}
                          </div>
                      }
                      <div className="mb-card-image-overlay" />
                      <span className="mb-card-badge">{getEventType(event)}</span>
                    </div>

                    <div className="mb-card-body">
                      <div className="mb-card-top">
                        <div className="mb-card-title-block">
                          <h3>{event?.title || "Event"}</h3>
                          <span className={`mb-status-pill ${booking.status}`}>
                            {booking.status === "confirmed" ? "● Confirmed" : "● Cancelled"}
                          </span>
                        </div>
                        <div className="mb-card-amount">₹{(booking.totalAmount||0).toLocaleString("en-IN")}</div>
                      </div>

                      <div className="mb-card-info-row">
                        <div className="mb-info-item">
                          <span className="mb-info-label">Event Date</span>
                          <span className="mb-info-value">📅 {eventDateStr}</span>
                        </div>
                        <div className="mb-info-item">
                          <span className="mb-info-label">Venue</span>
                          <span className="mb-info-value">📍 {venue}</span>
                        </div>
                        <div className="mb-info-item">
                          <span className="mb-info-label">Tickets</span>
                          <span className="mb-info-value">🎫 {booking.quantity||1}</span>
                        </div>
                        <div className="mb-info-item">
                          <span className="mb-info-label">Booked On</span>
                          <span className="mb-info-value">🕐 {formatBookedOn(booking.createdAt)}</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mb-expanded">
                          <div className="mb-expanded-grid">
                            <div className="mb-expanded-item">
                              <span className="mb-expanded-label">Booking ID</span>
                              <span className="mb-expanded-val mono">{booking._id}</span>
                            </div>
                            <div className="mb-expanded-item">
                              <span className="mb-expanded-label">Category</span>
                              <span className="mb-expanded-val">{event?.category||"General"}</span>
                            </div>
                            {seats && (
                              <div className="mb-expanded-item full">
                                <span className="mb-expanded-label">Seats</span>
                                <span className="mb-expanded-val">{seats}</span>
                              </div>
                            )}
                            {booking.showTime && (
                              <div className="mb-expanded-item">
                                <span className="mb-expanded-label">Show Time</span>
                                <span className="mb-expanded-val">⏰ {booking.showTime?.time || booking.showTime}</span>
                              </div>
                            )}
                            <div className="mb-expanded-item">
                              <span className="mb-expanded-label">Price / Ticket</span>
                              <span className="mb-expanded-val">₹{booking.quantity ? Math.round((booking.totalAmount||0)/booking.quantity) : booking.totalAmount}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mb-card-actions">
                        <button className="mb-btn-ghost" onClick={() => setExpandedId(isExpanded ? null : booking._id)}>
                          {isExpanded ? "▲ Less" : "▼ Details"}
                        </button>
                        <div className="mb-action-btns">
                          {booking.status === "confirmed" && (
                            <>
                              <button className="mb-btn-download"
                                onClick={() => handleDownloadTicket(booking)}
                                disabled={downloadingId === booking._id}>
                                {downloadingId === booking._id ? "Preparing…" : "⬇ Download Ticket"}
                              </button>
                              <button className="mb-btn-cancel"
                                onClick={() => handleCancel(booking._id)}
                                disabled={cancellingId === booking._id}>
                                {cancellingId === booking._id ? "Cancelling…" : "Cancel"}
                              </button>
                            </>
                          )}
                          {booking.status === "cancelled" && (
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span className="mb-cancelled-note">Booking cancelled</span>
                              <button 
                                className="mb-btn-delete" 
                                onClick={() => handleDelete(booking._id)} 
                                disabled={deletingId === booking._id}
                                title="Permanently remove from history"
                              >
                                {deletingId === booking._id ? "Deleting…" : "🗑 Delete Permanently"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mb-pagination">
                <button className="mb-page-btn" onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1}>← Prev</button>
                {[...Array(totalPages)].map((_,i) => {
                  const p = i+1;
                  if (p===1||p===totalPages||Math.abs(p-currentPage)<=1)
                    return <button key={p} className={`mb-page-btn${currentPage===p?" active":""}`} onClick={()=>setCurrentPage(p)}>{p}</button>;
                  else if (Math.abs(p-currentPage)===2)
                    return <span key={p} className="mb-page-dots">…</span>;
                  return null;
                })}
                <button className="mb-page-btn" onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages}>Next →</button>
              </div>
            )}
          </>
        ) : (
          <div className="mb-empty">
            <div className="mb-empty-icon">🎟️</div>
            <h3>{searchTerm||statusFilter!=="all" ? "No bookings match your filters" : "No bookings yet"}</h3>
            <p>{searchTerm||statusFilter!=="all" ? "Try adjusting your search or filter." : "Start exploring events and book your first ticket!"}</p>
            <Link to="/events" className="mb-explore-btn">Browse Events →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookings;
