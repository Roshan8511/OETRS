import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreateEvent.css";
import { API_BASE_URL } from "../config/api";

function CreateEvent() {
  const navigate = useNavigate();
  
  // Basic event info
  const [eventType, setEventType] = useState("single");
  const [category, setCategory] = useState("music");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    imagePreview: "",
    location: {
      city: "",
      state: "",
      country: "India",
      fullAddress: ""
    }
  });
  
  // Single Event Fields
  const [singleData, setSingleData] = useState({
    singleDate: "",
    singleVenue: "",
    singleTotalSeats: "",
    singlePrice: "",
    singleShowTimes: ""
  });
  
  // Movie Event Fields
  const [movieData, setMovieData] = useState({
    movieStartDate: "",
    movieEndDate: "",
    cinemaShows: []
  });
  
  const [currentCinema, setCurrentCinema] = useState({
    cinemaName: "",
    location: "",
    showDates: [{ date: "", showTimes: [{ time: "", price: "", availableSeats: "" }] }]
  });
  
  // Multi-Day Event Fields
  const [multiDayData, setMultiDayData] = useState({
    eventDates: []
  });
  
  const [currentEventDate, setCurrentEventDate] = useState({
    date: "",
    venue: "",
    totalSeats: "",
    price: "",
    showTimes: [{ time: "", availableSeats: "" }]
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const categories = [
    { id: "music", name: "Music", icon: "🎵", color: "#667eea" },
    { id: "movies", name: "Movies", icon: "🎬", color: "#f6ad55" },
    { id: "sports", name: "Sports", icon: "⚽", color: "#48bb78" },
    { id: "education", name: "Education", icon: "📚", color: "#68d391" },
    { id: "business", name: "Business", icon: "💼", color: "#4299e1" },
    { id: "technology", name: "Technology", icon: "💻", color: "#9f7aea" },
    { id: "food", name: "Food", icon: "🍕", color: "#fc8181" },
    { id: "art", name: "Art", icon: "🎨", color: "#f687b3" },
    { id: "comedy", name: "Comedy", icon: "😂", color: "#ff9800" },
    { id: "other", name: "Other", icon: "🎯", color: "#a0aec0" }
  ];

  const eventTypeOptions = [
    { id: "single", name: "Single Event", icon: "🎪", description: "One-time event at a single venue" },
    { id: "movie", name: "Movie Event", icon: "🎬", description: "Movie with multiple cinemas and shows" },
    { id: "multi-day", name: "Multi-Day Event", icon: "📅", description: "Event spanning multiple dates" }
  ];

  // Image handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Image size should be less than 5MB", type: "error" });
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: file, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSingleChange = (e) => {
    setSingleData({ ...singleData, [e.target.name]: e.target.value });
  };

  // Movie cinema handlers
  const handleCinemaChange = (field, value) => {
    setCurrentCinema({ ...currentCinema, [field]: value });
  };

  const handleShowDateChange = (index, field, value) => {
    const newShowDates = [...currentCinema.showDates];
    newShowDates[index] = { ...newShowDates[index], [field]: value };
    setCurrentCinema({ ...currentCinema, showDates: newShowDates });
  };

  const handleShowTimeChange = (dateIndex, timeIndex, field, value) => {
    const newShowDates = [...currentCinema.showDates];
    newShowDates[dateIndex].showTimes[timeIndex] = { 
      ...newShowDates[dateIndex].showTimes[timeIndex], 
      [field]: value 
    };
    setCurrentCinema({ ...currentCinema, showDates: newShowDates });
  };

  const addShowDate = () => {
    setCurrentCinema({
      ...currentCinema,
      showDates: [...currentCinema.showDates, { date: "", showTimes: [{ time: "", price: "", availableSeats: "" }] }]
    });
  };

  const addShowTime = (dateIndex) => {
    const newShowDates = [...currentCinema.showDates];
    newShowDates[dateIndex].showTimes.push({ time: "", price: "", availableSeats: "" });
    setCurrentCinema({ ...currentCinema, showDates: newShowDates });
  };

  const removeShowTime = (dateIndex, timeIndex) => {
    const newShowDates = [...currentCinema.showDates];
    newShowDates[dateIndex].showTimes = newShowDates[dateIndex].showTimes.filter((_, i) => i !== timeIndex);
    setCurrentCinema({ ...currentCinema, showDates: newShowDates });
  };

  const addCinema = () => {
    if (!currentCinema.cinemaName || !currentCinema.location) {
      setMessage({ text: "Please fill cinema name and location", type: "error" });
      return;
    }
    
    // Validate show dates
    const hasInvalidDate = currentCinema.showDates.some(date => !date.date);
    if (hasInvalidDate) {
      setMessage({ text: "Please fill all show dates", type: "error" });
      return;
    }
    
    setMovieData({
      ...movieData,
      cinemaShows: [...movieData.cinemaShows, { ...currentCinema }]
    });
    setCurrentCinema({ 
      cinemaName: "", 
      location: "", 
      showDates: [{ date: "", showTimes: [{ time: "", price: "", availableSeats: "" }] }] 
    });
    setMessage({ text: "Cinema added successfully!", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 2000);
  };

  const removeCinema = (index) => {
    const newCinemas = movieData.cinemaShows.filter((_, i) => i !== index);
    setMovieData({ ...movieData, cinemaShows: newCinemas });
  };

  // Multi-day handlers
  const handleEventDateChange = (field, value) => {
    setCurrentEventDate({ ...currentEventDate, [field]: value });
  };

  const handleMultiDayShowTimeChange = (index, field, value) => {
    const newShowTimes = [...currentEventDate.showTimes];
    newShowTimes[index] = { ...newShowTimes[index], [field]: value };
    setCurrentEventDate({ ...currentEventDate, showTimes: newShowTimes });
  };

  const addMultiDayShowTime = () => {
    setCurrentEventDate({
      ...currentEventDate,
      showTimes: [...currentEventDate.showTimes, { time: "", availableSeats: "" }]
    });
  };

  const addEventDate = () => {
    if (!currentEventDate.date || !currentEventDate.venue || !currentEventDate.totalSeats || !currentEventDate.price) {
      setMessage({ text: "Please fill all event date fields", type: "error" });
      return;
    }
    
    setMultiDayData({
      ...multiDayData,
      eventDates: [...multiDayData.eventDates, { ...currentEventDate }]
    });
    setCurrentEventDate({ 
      date: "", 
      venue: "", 
      totalSeats: "", 
      price: "", 
      showTimes: [{ time: "", availableSeats: "" }] 
    });
    setMessage({ text: "Event date added successfully!", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 2000);
  };

  const removeEventDate = (index) => {
    const newDates = multiDayData.eventDates.filter((_, i) => i !== index);
    setMultiDayData({ ...multiDayData, eventDates: newDates });
  };

  // Validation function
  const validateForm = () => {
    if (!formData.title.trim()) {
      setMessage({ text: "Event title is required", type: "error" });
      return false;
    }
    
    if (!category) {
      setMessage({ text: "Category is required", type: "error" });
      return false;
    }
    
    if (eventType === "single") {
      if (!singleData.singleDate) {
        setMessage({ text: "Event date is required", type: "error" });
        return false;
      }
      if (!singleData.singleVenue.trim()) {
        setMessage({ text: "Venue is required", type: "error" });
        return false;
      }
      if (!singleData.singleTotalSeats || parseInt(singleData.singleTotalSeats) <= 0) {
        setMessage({ text: "Valid total seats is required", type: "error" });
        return false;
      }
      if (!singleData.singlePrice || parseFloat(singleData.singlePrice) < 0) {
        setMessage({ text: "Valid price is required", type: "error" });
        return false;
      }
    } else if (eventType === "movie") {
      if (!movieData.movieStartDate) {
        setMessage({ text: "Movie start date is required", type: "error" });
        return false;
      }
      if (!movieData.movieEndDate) {
        setMessage({ text: "Movie end date is required", type: "error" });
        return false;
      }
      if (movieData.cinemaShows.length === 0) {
        setMessage({ text: "At least one cinema is required", type: "error" });
        return false;
      }
    } else if (eventType === "multi-day") {
      if (multiDayData.eventDates.length === 0) {
        setMessage({ text: "At least one event date is required", type: "error" });
        return false;
      }
    }
    
    return true;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ text: "Please login first", type: "error" });
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      
      // Basic fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', category);
      formDataToSend.append('eventType', eventType);
      
      // Location fields
      formDataToSend.append('location[city]', formData.location.city);
      formDataToSend.append('location[state]', formData.location.state);
      formDataToSend.append('location[country]', formData.location.country);
      formDataToSend.append('location[fullAddress]', formData.location.fullAddress);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Handle different event types
      if (eventType === "single") {
        formDataToSend.append('singleDate', singleData.singleDate);
        formDataToSend.append('singleVenue', singleData.singleVenue);
        formDataToSend.append('singleTotalSeats', singleData.singleTotalSeats);
        formDataToSend.append('singlePrice', singleData.singlePrice);
        formDataToSend.append('singleShowTimes', singleData.singleShowTimes);
      } else if (eventType === "movie") {
        formDataToSend.append('movieStartDate', movieData.movieStartDate);
        formDataToSend.append('movieEndDate', movieData.movieEndDate);
        formDataToSend.append('cinemaShows', JSON.stringify(movieData.cinemaShows));
      } else if (eventType === "multi-day") {
        formDataToSend.append('eventDates', JSON.stringify(multiDayData.eventDates));
      }

      const apiUrl = `${API_BASE_URL}/api/events`;
      
      const response = await axios.post(apiUrl, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ text: "Event created successfully! Redirecting...", type: "success" });
      setTimeout(() => navigate("/dashboard"), 2000);

    } catch (error) {
      console.error("Error:", error);
      setMessage({ 
        text: error.response?.data?.message || "Failed to create event", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-page">
      <div className="create-event-container">
        <div className="create-event-header">
          <h1>Create New Event</h1>
          <p>Fill in the details below to add a new event</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-event-form">
          {/* Event Type Selection (Single/Movie/Multi-day) */}
          <div className="form-group">
            <label>Event Type <span className="required-star">*</span></label>
            <div className="event-type-selector">
              {eventTypeOptions.map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`event-type-option ${eventType === type.id ? 'selected' : ''}`}
                  onClick={() => setEventType(type.id)}
                >
                  <span className="event-type-icon">{type.icon}</span>
                  <div className="event-type-info">
                    <span className="event-type-name">{type.name}</span>
                    <span className="event-type-desc">{type.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="form-group">
            <label>Event Category <span className="required-star">*</span></label>
            <div className="category-selector">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-option ${category === cat.id ? 'selected' : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="form-group">
            <label>Event Title <span className="required-star">*</span></label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              placeholder="e.g., Summer Music Festival" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              placeholder="Describe your event..." 
              rows="4" 
            />
          </div>

          {/* Location Fields - NEW */}
          <div className="location-section">
            <h3>📍 Event Location</h3>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        city: e.target.value
                      }
                    })
                  }
                  placeholder="e.g., Mumbai"
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.location.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        state: e.target.value
                      }
                    })
                  }
                  placeholder="e.g., Maharashtra"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                value={formData.location.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      country: e.target.value
                    }
                  })
                }
                placeholder="e.g., India"
              />
            </div>

            <div className="form-group">
              <label>Full Address</label>
              <textarea
                value={formData.location.fullAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      fullAddress: e.target.value
                    }
                  })
                }
                placeholder="Complete address including building name, street, landmark, etc."
                rows="3"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="image-upload-section">
            <label>Event Image</label>
            <input 
              type="file" 
              id="image-upload" 
              className="file-input" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
            {!formData.imagePreview ? (
              <label htmlFor="image-upload" className="image-upload-label">
                <span className="upload-icon">📸</span>
                <span className="upload-text">Click to upload event image</span>
                <span className="upload-hint">PNG, JPG, GIF up to 5MB</span>
              </label>
            ) : (
              <div className="image-preview">
                <img src={formData.imagePreview} alt="Preview" />
                <button 
                  type="button" 
                  className="remove-image-btn" 
                  onClick={() => {
                    setFormData({ ...formData, image: null, imagePreview: "" });
                    document.getElementById('image-upload').value = '';
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* SINGLE EVENT FIELDS */}
          {eventType === "single" && (
            <>
              <div className="form-group">
                <label>Event Date <span className="required-star">*</span></label>
                <input 
                  type="date" 
                  name="singleDate"
                  value={singleData.singleDate} 
                  onChange={handleSingleChange}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Venue Name <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  name="singleVenue"
                  value={singleData.singleVenue} 
                  onChange={handleSingleChange}
                  placeholder="e.g., City Hall, Stadium" 
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Seats <span className="required-star">*</span></label>
                  <input 
                    type="number" 
                    name="singleTotalSeats"
                    value={singleData.singleTotalSeats} 
                    onChange={handleSingleChange}
                    placeholder="e.g., 500" 
                    min="1" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹) <span className="required-star">*</span></label>
                  <input 
                    type="number" 
                    name="singlePrice"
                    value={singleData.singlePrice} 
                    onChange={handleSingleChange}
                    placeholder="e.g., 999" 
                    min="0" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Show Times (comma separated)</label>
                <input 
                  type="text" 
                  name="singleShowTimes"
                  value={singleData.singleShowTimes} 
                  onChange={handleSingleChange}
                  placeholder="e.g., 07:00 PM, 09:30 PM" 
                />
              </div>
            </>
          )}

          {/* MOVIE EVENT FIELDS */}
          {eventType === "movie" && (
            <div className="movie-section">
              <h3>Movie Event Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date <span className="required-star">*</span></label>
                  <input 
                    type="date" 
                    value={movieData.movieStartDate} 
                    onChange={(e) => setMovieData({...movieData, movieStartDate: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>End Date <span className="required-star">*</span></label>
                  <input 
                    type="date" 
                    value={movieData.movieEndDate} 
                    onChange={(e) => setMovieData({...movieData, movieEndDate: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <h4>Add Cinemas & Shows</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Cinema Name</label>
                  <input 
                    type="text" 
                    value={currentCinema.cinemaName} 
                    onChange={(e) => handleCinemaChange('cinemaName', e.target.value)} 
                    placeholder="e.g., PVR Cinemas" 
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input 
                    type="text" 
                    value={currentCinema.location} 
                    onChange={(e) => handleCinemaChange('location', e.target.value)} 
                    placeholder="e.g., Phoenix Mall, Mumbai" 
                  />
                </div>
              </div>

              <label>Show Dates & Times</label>
              {currentCinema.showDates.map((date, dateIdx) => (
                <div key={dateIdx} className="show-date-card">
                  <div className="form-group">
                    <label>Date</label>
                    <input 
                      type="date" 
                      value={date.date} 
                      onChange={(e) => handleShowDateChange(dateIdx, 'date', e.target.value)} 
                    />
                  </div>
                  
                  <label>Show Times</label>
                  {date.showTimes.map((time, timeIdx) => (
                    <div key={timeIdx} className="show-time-row">
                      <input 
                        type="text" 
                        placeholder="Time (e.g., 03:30 PM)" 
                        value={time.time} 
                        onChange={(e) => handleShowTimeChange(dateIdx, timeIdx, 'time', e.target.value)} 
                      />
                      <input 
                        type="number" 
                        placeholder="Price (₹)" 
                        value={time.price} 
                        onChange={(e) => handleShowTimeChange(dateIdx, timeIdx, 'price', e.target.value)} 
                      />
                      <input 
                        type="number" 
                        placeholder="Available Seats" 
                        value={time.availableSeats} 
                        onChange={(e) => handleShowTimeChange(dateIdx, timeIdx, 'availableSeats', e.target.value)} 
                      />
                      {date.showTimes.length > 1 && (
                        <button 
                          type="button" 
                          className="remove-btn-small" 
                          onClick={() => removeShowTime(dateIdx, timeIdx)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-btn-small" onClick={() => addShowTime(dateIdx)}>
                    + Add Show Time
                  </button>
                  <button type="button" className="remove-date-btn" onClick={() => {
                    const newDates = currentCinema.showDates.filter((_, i) => i !== dateIdx);
                    setCurrentCinema({ ...currentCinema, showDates: newDates });
                  }}>
                    Remove Date
                  </button>
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addShowDate}>
                + Add Show Date
              </button>
              <button type="button" className="add-btn" onClick={addCinema}>
                + Add Cinema
              </button>

              {movieData.cinemaShows.length > 0 && (
                <div className="cinemas-list">
                  <h4>Added Cinemas:</h4>
                  {movieData.cinemaShows.map((cinema, idx) => (
                    <div key={idx} className="cinema-item">
                      <div>
                        <strong>{cinema.cinemaName}</strong> - {cinema.location}
                        <div>{cinema.showDates.length} show dates</div>
                      </div>
                      <button type="button" className="remove-btn" onClick={() => removeCinema(idx)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MULTI-DAY EVENT FIELDS */}
          {eventType === "multi-day" && (
            <div className="multi-day-section">
              <h3>Multi-Day Event Details</h3>
              
              <h4>Add Event Dates</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={currentEventDate.date} 
                    onChange={(e) => handleEventDateChange('date', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Venue</label>
                  <input 
                    type="text" 
                    value={currentEventDate.venue} 
                    onChange={(e) => handleEventDateChange('venue', e.target.value)} 
                    placeholder="Venue name" 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Total Seats</label>
                  <input 
                    type="number" 
                    value={currentEventDate.totalSeats} 
                    onChange={(e) => handleEventDateChange('totalSeats', e.target.value)} 
                    placeholder="Total seats" 
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input 
                    type="number" 
                    value={currentEventDate.price} 
                    onChange={(e) => handleEventDateChange('price', e.target.value)} 
                    placeholder="Price" 
                  />
                </div>
              </div>

              <label>Show Times</label>
              {currentEventDate.showTimes.map((show, idx) => (
                <div key={idx} className="show-time-row">
                  <input 
                    type="text" 
                    placeholder="Time (e.g., 07:00 PM)" 
                    value={show.time} 
                    onChange={(e) => handleMultiDayShowTimeChange(idx, 'time', e.target.value)} 
                  />
                  <input 
                    type="number" 
                    placeholder="Available Seats" 
                    value={show.availableSeats} 
                    onChange={(e) => handleMultiDayShowTimeChange(idx, 'availableSeats', e.target.value)} 
                  />
                  {currentEventDate.showTimes.length > 1 && (
                    <button 
                      type="button" 
                      className="remove-btn-small" 
                      onClick={() => {
                        const newTimes = currentEventDate.showTimes.filter((_, i) => i !== idx);
                        setCurrentEventDate({ ...currentEventDate, showTimes: newTimes });
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addMultiDayShowTime}>
                + Add Show Time
              </button>
              <button type="button" className="add-btn" onClick={addEventDate}>
                + Add Event Date
              </button>

              {multiDayData.eventDates.length > 0 && (
                <div className="dates-list">
                  <h4>Added Dates:</h4>
                  {multiDayData.eventDates.map((date, idx) => (
                    <div key={idx} className="date-item">
                      <div>
                        <strong>{date.date}</strong> - {date.venue}
                        <div>{date.showTimes.length} show times</div>
                      </div>
                      <button type="button" className="remove-btn" onClick={() => removeEventDate(idx)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </button>
            <button type="button" className="btn-cancel" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;