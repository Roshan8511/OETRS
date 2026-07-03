import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";
import { API_BASE_URL } from "../config/api";

const API = `${API_BASE_URL}/api`;

function AdminDashboard() {
  const [events, setEvents]   = useState([]);
  const [users, setUsers]     = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("events");

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ show: false, eventId: null, eventTitle: "" });
  const [deleting, setDeleting] = useState(false);

  // Event bookings modal
  const [eventBookingsModal, setEventBookingsModal] = useState({ show: false, event: null, bookings: [], loading: false, search: "" });

  // User history modal
  const [userModal, setUserModal] = useState({ show: false, user: null, bookings: [], loading: false });

  // Search states
  const [userSearch, setUserSearch] = useState("");

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [evRes, usRes, smRes] = await Promise.all([
        axios.get(`${API}/events`, { headers: headers() }),
        axios.get(`${API}/admin/users`, { headers: headers() }),
        axios.get(`${API}/admin/summary`, { headers: headers() })
      ]);
      setEvents(evRes.data);
      setUsers(usRes.data);
      setSummary(smRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── helpers ──────────────────────────────────────────────
  const getEventImage = (ev) => {
    if (ev.image && !["default-event.jpg","null","undefined"].includes(ev.image)) return ev.image;
    if (ev.posterImage && !["default-event.jpg","null","undefined"].includes(ev.posterImage)) return ev.posterImage;
    return null;
  };

  const getEventDate = (ev) => {
    try {
      if (ev.eventType === "single" && ev.singleDate) return new Date(ev.singleDate).toLocaleDateString("en-IN");
      if (ev.eventType === "movie" && ev.movieStartDate) return `${new Date(ev.movieStartDate).toLocaleDateString("en-IN")} – ${new Date(ev.movieEndDate).toLocaleDateString("en-IN")}`;
      if (ev.eventType === "multi-day" && ev.eventDates?.[0]?.date) return new Date(ev.eventDates[0].date).toLocaleDateString("en-IN");
    } catch {}
    return "Date TBA";
  };

  const getCatIcon = (cat) => ({ music:"🎵",movies:"🎬",sports:"⚽",education:"📚",business:"💼",technology:"💻",food:"🍕",art:"🎨",other:"🎯" }[cat] || "📅");

  const fmt = (dateStr) => { try { return new Date(dateStr).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }); } catch { return "—"; } };

  // ── Delete event ──────────────────────────────────────────
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/events/${deleteModal.eventId}`, { headers: headers() });
      setMessage({ text: "Event deleted!", type: "success" });
      setEvents(prev => prev.filter(e => e._id !== deleteModal.eventId));
      setSummary(prev => prev ? { ...prev, totalEvents: prev.totalEvents - 1 } : prev);
      setDeleteModal({ show: false, eventId: null, eventTitle: "" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch { setMessage({ text: "Failed to delete event", type: "error" }); }
    finally { setDeleting(false); }
  };

  // ── Event bookings ────────────────────────────────────────
  const openEventBookings = async (ev) => {
    setEventBookingsModal({ show: true, event: ev, bookings: [], loading: true, search: "" });
    try {
      const res = await axios.get(`${API}/admin/events/${ev._id}/bookings`, { headers: headers() });
      setEventBookingsModal(prev => ({ ...prev, bookings: res.data, loading: false }));
    } catch {
      setEventBookingsModal(prev => ({ ...prev, loading: false }));
    }
  };

  // ── User modal ────────────────────────────────────────────
  const openUserModal = async (user) => {
    setUserModal({ show: true, user, bookings: [], loading: true });
    try {
      const res = await axios.get(`${API}/admin/users/${user._id}/bookings`, { headers: headers() });
      setUserModal(prev => ({ ...prev, bookings: res.data, loading: false }));
    } catch {
      setUserModal(prev => ({ ...prev, loading: false }));
    }
  };

  // ── Filtered users (case-sensitive search by name or email) ──
  const filteredUsers = userSearch
    ? users.filter(u => u.name?.includes(userSearch) || u.email?.includes(userSearch))
    : users;

  // ── Filtered event bookings search ──
  const filteredEventBookings = eventBookingsModal.search
    ? eventBookingsModal.bookings.filter(b =>
        b.userId?.name?.includes(eventBookingsModal.search) ||
        b.userId?.email?.includes(eventBookingsModal.search))
    : eventBookingsModal.bookings;

  if (loading) return (
    <div className="admin-dashboard-container">
      <div className="loading-spinner"></div>
      <p>Loading dashboard…</p>
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <Link to="/admin/create-event" className="create-event-btn">+ Create New Event</Link>
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      {/* Stats */}
      {summary && (
        <div className="stats-grid">
          {[
            { icon:"📅", val: summary.totalEvents, label:"Total Events" },
            { icon:"👥", val: summary.totalUsers,  label:"Total Users" },
            { icon:"🎫", val: summary.totalBookings, label:"Total Bookings" },
            { icon:"💰", val: `₹${(summary.totalRevenue||0).toLocaleString("en-IN")}`, label:"Total Revenue" }
          ].map((s,i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-info"><h3>{s.val}</h3><p>{s.label}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs — no Bookings tab */}
      <div className="admin-tabs">
        {["events","users"].map(tab => (
          <button key={tab} className={`tab ${activeTab===tab?"active":""}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase()+tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Events Tab ── */}
      {activeTab === "events" && (
        <div className="events-management">
          <h2>Manage Events</h2>
          <div className="events-grid">
            {events.map(ev => (
              <div key={ev._id} className="event-card">
                <div className="event-image">
                  {getEventImage(ev)
                    ? <img src={getEventImage(ev)} alt={ev.title} onError={e=>e.target.style.display="none"} />
                    : <div className="image-placeholder">{getCatIcon(ev.category)}</div>}
                </div>
                <div className="event-details">
                  <h3>{ev.title}</h3>
                  <p className="event-category">{getCatIcon(ev.category)} {ev.category}</p>
                  <p className="event-date">📅 {getEventDate(ev)}</p>
                  <p className="event-type">🎟️ {ev.eventType}</p>
                  <p className="event-seats">💺 {ev.availableSeats ?? "—"} seats left</p>
                </div>
                <div className="event-actions">
                  <Link to={`/admin/edit-event/${ev._id}`} className="edit-btn">Edit</Link>
                  <button className="bookings-btn" onClick={() => openEventBookings(ev)}>Bookings</button>
                  <button className="delete-btn" onClick={() => setDeleteModal({ show:true, eventId:ev._id, eventTitle:ev.title })}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {events.length === 0 && (
            <div className="no-data">
              <p>No events yet.</p>
              <Link to="/admin/create-event" className="create-first-btn">Create Event</Link>
            </div>
          )}
        </div>
      )}

      {/* ── Users Tab ── */}
      {activeTab === "users" && (
        <div className="users-management">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
            <h2>Manage Users</h2>
            <div className="admin-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search by name or email (case-sensitive)…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              {userSearch && <button className="clear-search" onClick={() => setUserSearch("")}>✕</button>}
            </div>
          </div>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>History</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.name || "N/A"}</td>
                    <td>{user.email}</td>
                    <td><span className="role-badge">{user.role || "user"}</span></td>
                    <td>{new Date(user.createdAt).toLocaleDateString("en-IN")}</td>
                    <td>
                      <button className="view-history-btn" onClick={() => openUserModal(user)}>View Bookings</button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign:"center", color:"#888", padding:"24px" }}>No users match "{userSearch}"</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show:false, eventId:null, eventTitle:"" })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Delete Event</h3>
            <p>Are you sure you want to delete <strong>"{deleteModal.eventTitle}"</strong>?<br/>
              <small style={{color:"#e53935"}}>All bookings for this event will remain in the database.</small>
            </p>
            <div className="modal-actions">
              <button className="confirm-delete-btn" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button className="cancel-btn" onClick={() => setDeleteModal({ show:false, eventId:null, eventTitle:"" })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Event Bookings Modal ── */}
      {eventBookingsModal.show && (
        <div className="modal-overlay" onClick={() => setEventBookingsModal(p => ({ ...p, show:false }))}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bookings — {eventBookingsModal.event?.title}</h3>
              <button className="modal-close" onClick={() => setEventBookingsModal(p => ({ ...p, show:false }))}>✕</button>
            </div>

            {/* Search inside event bookings */}
            <div className="admin-search-box" style={{ marginBottom:"16px" }}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search by user name or email (case-sensitive)…"
                value={eventBookingsModal.search}
                onChange={e => setEventBookingsModal(p => ({ ...p, search: e.target.value }))}
              />
              {eventBookingsModal.search && (
                <button className="clear-search" onClick={() => setEventBookingsModal(p => ({ ...p, search:"" }))}>✕</button>
              )}
            </div>

            {eventBookingsModal.loading ? (
              <div style={{ textAlign:"center", padding:"40px" }}>
                <div className="loading-spinner"></div><p>Loading…</p>
              </div>
            ) : filteredEventBookings.length === 0 ? (
              <p style={{ textAlign:"center", color:"#888", padding:"30px" }}>
                {eventBookingsModal.search ? `No results for "${eventBookingsModal.search}"` : "No bookings for this event yet."}
              </p>
            ) : (
              <div className="modal-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr><th>User</th><th>Email</th><th>Qty</th><th>Amount</th><th>Status</th><th>Seats</th><th>Booked On</th></tr>
                  </thead>
                  <tbody>
                    {filteredEventBookings.map(b => (
                      <tr key={b._id}>
                        <td>{b.userId?.name || "N/A"}</td>
                        <td>{b.userId?.email || "N/A"}</td>
                        <td>{b.quantity}</td>
                        <td>₹{b.totalAmount?.toLocaleString("en-IN")}</td>
                        <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                        <td style={{ fontSize:"12px" }}>{b.selectedSeats?.map(s=>s.displayName).join(", ") || "—"}</td>
                        <td style={{ fontSize:"12px" }}>{fmt(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── User Booking History Modal ── */}
      {userModal.show && (
        <div className="modal-overlay" onClick={() => setUserModal(p => ({ ...p, show:false }))}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking History — {userModal.user?.name || userModal.user?.email}</h3>
              <button className="modal-close" onClick={() => setUserModal(p => ({ ...p, show:false }))}>✕</button>
            </div>
            {userModal.loading ? (
              <div style={{ textAlign:"center", padding:"40px" }}>
                <div className="loading-spinner"></div><p>Loading…</p>
              </div>
            ) : userModal.bookings.length === 0 ? (
              <p style={{ textAlign:"center", color:"#888", padding:"30px" }}>No bookings found for this user.</p>
            ) : (
              <div className="modal-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr><th>Event</th><th>Qty</th><th>Amount</th><th>Status</th><th>Seats</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {userModal.bookings.map(b => (
                      <tr key={b._id}>
                        <td>{b.eventId?.title || "Deleted Event"}</td>
                        <td>{b.quantity}</td>
                        <td>₹{b.totalAmount?.toLocaleString("en-IN")}</td>
                        <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                        <td style={{ fontSize:"12px" }}>{b.selectedSeats?.map(s=>s.displayName).join(", ") || "—"}</td>
                        <td style={{ fontSize:"12px" }}>{fmt(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;