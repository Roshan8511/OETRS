import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./EditEvent.css";
import { API_BASE_URL } from "../config/api";

function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({});
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const categories = [
    { id: "music", name: "Music", icon: "🎵" },
    { id: "sports", name: "Sports", icon: "⚽" },
    { id: "movies", name: "Movies", icon: "🎬" },
    { id: "business", name: "Business", icon: "💼" },
    { id: "technology", name: "Tech", icon: "💻" },
    { id: "food", name: "Food", icon: "🍕" },
    { id: "art", name: "Art", icon: "🎨" },
    { id: "education", name: "Education", icon: "📚" },
    { id: "comedy", name: "Comedy", icon: "😂" },
    { id: "other", name: "Other", icon: "🎯" }
  ];

  useEffect(() => { fetchEvent(); }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ev = res.data;
      setEvent(ev);

      // Build initial formData from the real event structure
      const fd = {
        title: ev.title || "",
        description: ev.description || "",
        category: ev.category || "music",
        eventType: ev.eventType || "single",
        // Single fields
        singleDate: ev.singleDate ? new Date(ev.singleDate).toISOString().slice(0,10) : "",
        singleVenue: ev.singleVenue || "",
        singleTotalSeats: ev.singleTotalSeats || ev.totalSeats || "",
        singlePrice: ev.singlePrice || ev.price || "",
        singleShowTimes: Array.isArray(ev.singleShowTimes) ? ev.singleShowTimes.join(", ") : (ev.singleShowTimes || ""),
        // Movie fields
        movieStartDate: ev.movieStartDate ? new Date(ev.movieStartDate).toISOString().slice(0,10) : "",
        movieEndDate: ev.movieEndDate ? new Date(ev.movieEndDate).toISOString().slice(0,10) : "",
        cinemaShows: ev.cinemaShows ? JSON.stringify(ev.cinemaShows, null, 2) : "[]",
        // Multi-day fields
        eventDates: ev.eventDates ? JSON.stringify(ev.eventDates, null, 2) : "[]"
      };
      setFormData(fd);
      if (ev.image || ev.posterImage) setCurrentImage(ev.image || ev.posterImage);
    } catch (err) {
      setMessage({ text: "Failed to load event", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMessage({ text: "Image must be under 5MB", type: "error" }); return; }
    if (!file.type.startsWith("image/")) { setMessage({ text: "Please upload an image file", type: "error" }); return; }
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { setMessage({ text: "Title is required", type: "error" }); return; }
    setSubmitting(true); setMessage({ text: "", type: "" });
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("title", formData.title.trim());
      fd.append("description", formData.description.trim());
      fd.append("category", formData.category);
      fd.append("eventType", formData.eventType);

      if (formData.eventType === "single") {
        if (!formData.singleDate || !formData.singleVenue || !formData.singleTotalSeats || !formData.singlePrice) {
          setMessage({ text: "Please fill all single event fields", type: "error" }); setSubmitting(false); return;
        }
        fd.append("singleDate", formData.singleDate);
        fd.append("singleVenue", formData.singleVenue);
        fd.append("singleTotalSeats", formData.singleTotalSeats);
        fd.append("singlePrice", formData.singlePrice);
        fd.append("singleShowTimes", formData.singleShowTimes);
      } else if (formData.eventType === "movie") {
        if (!formData.movieStartDate || !formData.movieEndDate) {
          setMessage({ text: "Please fill movie dates", type: "error" }); setSubmitting(false); return;
        }
        fd.append("movieStartDate", formData.movieStartDate);
        fd.append("movieEndDate", formData.movieEndDate);
        try {
          JSON.parse(formData.cinemaShows); // validate JSON
          fd.append("cinemaShows", formData.cinemaShows);
        } catch { fd.append("cinemaShows", "[]"); }
      } else if (formData.eventType === "multi-day") {
        try {
          JSON.parse(formData.eventDates);
          fd.append("eventDates", formData.eventDates);
        } catch { fd.append("eventDates", "[]"); }
      }

      if (image) fd.append("image", image);

      await axios.put(`${API_BASE_URL}/api/events/${id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      setMessage({ text: "Event updated successfully! Redirecting...", type: "success" });
      setTimeout(() => {
        navigate("/admin");
        window.location.reload(); // Forces refresh to show updated data
      }, 1500);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to update event", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-event-page">
        <div className="edit-event-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading event…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-event-page">
      <div className="edit-event-container">
        <div className="edit-event-header">
          <h1>Edit Event</h1>
          <p>Update details for: <strong>{event?.title}</strong></p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === "success" ? "✅" : "❌"} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-event-form" encType="multipart/form-data">
          {/* Title */}
          <div className="form-group">
            <label>Event Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
          </div>

          {/* Image */}
          <div className="image-upload-section">
            {!imagePreview && currentImage && (
              <div className="current-image">
                <img src={currentImage} alt="Current" />
                <div className="current-image-label">Current Image</div>
              </div>
            )}
            <input type="file" id="image-upload" className="file-input" accept="image/*" onChange={handleImageChange} />
            {!imagePreview ? (
              <label htmlFor="image-upload" className="image-upload-label">
                <span className="upload-icon">📸</span>
                <span className="upload-text">Click to upload new image</span>
                <span className="upload-hint">PNG, JPG up to 5MB (leave blank to keep current)</span>
              </label>
            ) : (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button type="button" className="remove-image-btn" onClick={() => { setImage(null); setImagePreview(""); }}>✕</button>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category *</label>
            <div className="category-selector">
              {categories.map(cat => (
                <label key={cat.id}
                  className={`category-option ${formData.category === cat.id ? "selected" : ""}`}
                  style={{ borderColor: formData.category === cat.id ? "#667eea" : "#e0e0e0",
                           background: formData.category === cat.id ? "#eef0ff" : "#f8f9fa" }}>
                  <input type="radio" name="category" value={cat.id}
                    checked={formData.category === cat.id}
                    onChange={() => setFormData(p => ({ ...p, category: cat.id }))} />
                  <span>{cat.icon}</span>
                  <span className="category-name">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Event type label (read-only) */}
          <div className="form-group">
            <label>Event Type</label>
            <div style={{ padding: "10px 14px", background: "#f0f0f0", borderRadius: "8px", fontWeight: 600 }}>
              {formData.eventType?.toUpperCase()} &nbsp;
              <small style={{ color: "#888", fontWeight: 400 }}>(type cannot be changed after creation)</small>
            </div>
          </div>

          {/* SINGLE fields */}
          {formData.eventType === "single" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Event Date *</label>
                  <input type="date" name="singleDate" value={formData.singleDate} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Venue *</label>
                  <input type="text" name="singleVenue" value={formData.singleVenue} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Seats *</label>
                  <input type="number" name="singleTotalSeats" value={formData.singleTotalSeats} onChange={handleChange} min="1" required />
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" name="singlePrice" value={formData.singlePrice} onChange={handleChange} min="0" required />
                </div>
              </div>
              <div className="form-group">
                <label>Show Times (comma separated)</label>
                <input type="text" name="singleShowTimes" value={formData.singleShowTimes} onChange={handleChange} placeholder="e.g. 10:00 AM, 2:00 PM, 7:00 PM" />
              </div>
            </>
          )}

          {/* MOVIE fields */}
          {formData.eventType === "movie" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Movie Start Date *</label>
                  <input type="date" name="movieStartDate" value={formData.movieStartDate} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Movie End Date *</label>
                  <input type="date" name="movieEndDate" value={formData.movieEndDate} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label>Cinema Shows (JSON) <small style={{color:"#888"}}>— edit carefully</small></label>
                <textarea name="cinemaShows" value={formData.cinemaShows} onChange={handleChange} rows="10"
                  style={{ fontFamily: "monospace", fontSize: "12px" }} />
              </div>
            </>
          )}

          {/* MULTI-DAY fields */}
          {formData.eventType === "multi-day" && (
            <div className="form-group">
              <label>Event Dates (JSON) <small style={{color:"#888"}}>— edit carefully</small></label>
              <textarea name="eventDates" value={formData.eventDates} onChange={handleChange} rows="10"
                style={{ fontFamily: "monospace", fontSize: "12px" }} />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-update" disabled={submitting}>
              {submitting ? "Updating…" : "Update Event"}
            </button>
            <button type="button" className="btn-cancel" onClick={() => navigate("/admin")} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEvent;