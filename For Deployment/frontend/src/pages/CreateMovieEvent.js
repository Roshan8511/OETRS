import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./BaseEventForm.css";
import { API_BASE_URL } from "../config/api";

function CreateMovieEvent() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    theaters: []
  });
  
  const [currentTheater, setCurrentTheater] = useState({
    name: "",
    location: "",
    showTimes: [{ time: "", price: "" }]
  });
  
  const [theaters, setTheaters] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Image size should be less than 5MB", type: "error" });
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
    document.getElementById('image-upload').value = '';
  };

  const handleTheaterChange = (field, value) => {
    setCurrentTheater({ ...currentTheater, [field]: value });
  };

  const handleShowTimeChange = (index, field, value) => {
    const newShowTimes = [...currentTheater.showTimes];
    newShowTimes[index] = { ...newShowTimes[index], [field]: value };
    setCurrentTheater({ ...currentTheater, showTimes: newShowTimes });
  };

  const addShowTime = () => {
    setCurrentTheater({
      ...currentTheater,
      showTimes: [...currentTheater.showTimes, { time: "", price: "" }]
    });
  };

  const removeShowTime = (index) => {
    const newShowTimes = currentTheater.showTimes.filter((_, i) => i !== index);
    setCurrentTheater({ ...currentTheater, showTimes: newShowTimes });
  };

  const addTheater = () => {
    if (!currentTheater.name || !currentTheater.location) {
      setMessage({ text: "Please fill theater name and location", type: "error" });
      return;
    }
    setTheaters([...theaters, { ...currentTheater }]);
    setCurrentTheater({ name: "", location: "", showTimes: [{ time: "", price: "" }] });
    setMessage({ text: "Theater added successfully!", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 2000);
  };

  const removeTheater = (index) => {
    setTheaters(theaters.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (theaters.length === 0) {
      setMessage({ text: "Please add at least one theater", type: "error" });
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ text: "Please login first", type: "error" });
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', 'movies');
      formDataToSend.append('eventType', 'movie');
      formDataToSend.append('movieStartDate', formData.startDate);
      formDataToSend.append('movieEndDate', formData.endDate);
      formDataToSend.append('cinemaShows', JSON.stringify(theaters));
      
      if (image) {
        formDataToSend.append('image', image);
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/movies`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage({ text: "Movie created successfully! Redirecting...", type: "success" });
      setTimeout(() => navigate("/admin"), 2000);

    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: error.response?.data?.message || "Failed to create movie", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="base-event-page">
      <div className="base-event-container">
        <button className="back-button" onClick={() => navigate("/admin/create-event")}>
          ← Back to Categories
        </button>

        <div className="base-event-header">
          <div className="header-icon">🎬</div>
          <h1>Create Movie</h1>
          <p>Add a new movie with theaters and showtimes</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="base-event-form">
          <div className="form-group">
            <label>Movie Title <span className="required-star">*</span></label>
            <input type="text" name="title" onChange={handleChange} placeholder="e.g., The Kerala Story 2" required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" onChange={handleChange} placeholder="Describe the movie..." rows="4" />
          </div>

          <div className="image-upload-section">
            <input type="file" id="image-upload" className="file-input" accept="image/*" onChange={handleImageChange} />
            {!imagePreview ? (
              <label htmlFor="image-upload" className="image-upload-label">
                <span className="upload-icon">📸</span>
                <span className="upload-text">Click to upload movie poster</span>
              </label>
            ) : (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button type="button" className="remove-image-btn" onClick={removeImage}>✕</button>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Release Start Date <span className="required-star">*</span></label>
              <input type="date" name="startDate" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Release End Date <span className="required-star">*</span></label>
              <input type="date" name="endDate" onChange={handleChange} required />
            </div>
          </div>

          <h3>Theaters & Showtimes</h3>
          
          <div className="theater-section">
            <div className="form-row">
              <div className="form-group">
                <label>Theater Name</label>
                <input type="text" value={currentTheater.name} onChange={(e) => handleTheaterChange('name', e.target.value)} placeholder="e.g., PVR Cinemas" />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={currentTheater.location} onChange={(e) => handleTheaterChange('location', e.target.value)} placeholder="e.g., Phoenix Mall, Mumbai" />
              </div>
            </div>

            <label>Show Times</label>
            {currentTheater.showTimes.map((show, idx) => (
              <div key={idx} className="show-time-row">
                <input type="text" placeholder="Time (e.g., 03:30 PM)" value={show.time} onChange={(e) => handleShowTimeChange(idx, 'time', e.target.value)} />
                <input type="number" placeholder="Price (₹)" value={show.price} onChange={(e) => handleShowTimeChange(idx, 'price', e.target.value)} />
                {currentTheater.showTimes.length > 1 && (
                  <button type="button" className="remove-btn-small" onClick={() => removeShowTime(idx)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="add-showtime-btn" onClick={addShowTime}>+ Add Show Time</button>
            <button type="button" className="add-theater-btn" onClick={addTheater}>+ Add Theater</button>
          </div>

          {theaters.length > 0 && (
            <div className="theaters-list">
              <h4>Added Theaters:</h4>
              {theaters.map((theater, idx) => (
                <div key={idx} className="theater-item">
                  <div className="theater-info">
                    <strong>{theater.name}</strong> - {theater.location}
                    <div className="showtimes-list">
                      {theater.showTimes.map((show, sIdx) => (
                        <span key={sIdx} className="showtime-badge">{show.time} - ₹{show.price}</span>
                      ))}
                    </div>
                  </div>
                  <button type="button" className="remove-btn" onClick={() => removeTheater(idx)}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Creating..." : "Create Movie"}
            </button>
            <button type="button" className="btn-cancel" onClick={() => navigate("/admin/create-event")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateMovieEvent;