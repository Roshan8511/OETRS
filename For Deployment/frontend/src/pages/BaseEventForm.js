import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./BaseEventForm.css";
import { API_BASE_URL } from "../config/api";

function BaseEventForm({ category, categoryIcon, title, fields, multiDate = false }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({});
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showDates, setShowDates] = useState([]);

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

    if (!file.type.startsWith('image/')) {
      setMessage({ text: "Please upload an image file", type: "error" });
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

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage({ text: "", type: "" });
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
    formDataToSend.append('description', formData.description || '');

    // Add all dynamic fields
    fields.forEach(field => {
      if (formData[field.name]) {
        formDataToSend.append(field.name, formData[field.name]);
      }
    });

    if (image) {
      formDataToSend.append('image', image);
    }

    // Determine API URL based on category
    let apiUrl = `${API_BASE_URL}/api/events`;
    switch(category) {
      case "music":
        apiUrl = `${API_BASE_URL}/api/music`;
        break;
      case "sports":
        apiUrl = `${API_BASE_URL}/api/sports`;
        break;
      case "education":
        apiUrl = `${API_BASE_URL}/api/education`;
        break;
      case "business":
        apiUrl = `${API_BASE_URL}/api/business`;
        break;
      case "technology":
        apiUrl = `${API_BASE_URL}/api/technology`;
        break;
      case "food":
        apiUrl = `${API_BASE_URL}/api/food`;
        break;
      case "art":
        apiUrl = `${API_BASE_URL}/api/art`;
        break;
      case "other":
        apiUrl = `${API_BASE_URL}/api/other`;
        break;
      default:
        apiUrl = `${API_BASE_URL}/api/events`;
    }

    console.log("Sending to:", apiUrl);
    console.log("Data:", Object.fromEntries(formDataToSend));

    const response = await axios.post(apiUrl, formDataToSend, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    setMessage({ text: `${title} created successfully! Redirecting...`, type: "success" });
    setTimeout(() => navigate("/admin"), 2000);

  } catch (error) {
    console.error("Error:", error);
    setMessage({ text: error.response?.data?.message || "Failed to create event", type: "error" });
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
          <div className="header-icon">{categoryIcon}</div>
          <h1>Create {title}</h1>
          <p>Fill in the details to add a new {category} event</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="base-event-form" encType="multipart/form-data">
          {/* Title */}
          <div className="form-group">
            <label>Event Title <span className="required-star">*</span></label>
            <input type="text" name="title" onChange={handleChange} placeholder={`e.g., ${title} Festival 2026`} required />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" onChange={handleChange} placeholder="Describe your event..." rows="4" />
          </div>

          {/* Image Upload */}
          <div className="image-upload-section">
            <input type="file" id="image-upload" className="file-input" accept="image/*" onChange={handleImageChange} />
            {!imagePreview ? (
              <label htmlFor="image-upload" className="image-upload-label">
                <span className="upload-icon">📸</span>
                <span className="upload-text">Click to upload event image</span>
                <span className="upload-hint">PNG, JPG, GIF up to 5MB</span>
              </label>
            ) : (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button type="button" className="remove-image-btn" onClick={removeImage}>✕</button>
              </div>
            )}
          </div>

          {/* Dynamic Fields */}
          {fields.map((field) => (
            <div key={field.name} className="form-group">
              <label>{field.label} {field.required && <span className="required-star">*</span>}</label>
              <input
                type={field.type || "text"}
                name={field.name}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required || false}
                min={field.min}
                max={field.max}
                step={field.step}
              />
            </div>
          ))}

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Creating..." : `Create ${title}`}
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

export default BaseEventForm;