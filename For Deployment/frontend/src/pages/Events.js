import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Events.css";
import { API_BASE_URL } from "../config/api";

function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [hotEvents, setHotEvents] = useState([]);
  const [currentHotIndex, setCurrentHotIndex] = useState(0);
  const [fadeState, setFadeState] = useState("fade-in");
  const sliderInterval = useRef(null);

  const categories = [
    { id: "all", name: "All", icon: "🎯" },
    { id: "music", name: "Music", icon: "🎵" },
    { id: "sports", name: "Sports", icon: "⚽" },
    { id: "movies", name: "Movies", icon: "🎬" },
    { id: "technology", name: "Tech", icon: "💻" },
    { id: "business", name: "Business", icon: "💼" },
    { id: "food", name: "Food", icon: "🍕" },
    { id: "art", name: "Art", icon: "🎨" },
    { id: "education", name: "Education", icon: "📚" },
    { id: "comedy", name: "Comedy", icon: "😂" }
  ];

  const languages = ["Hindi", "English", "Kannada", "Malayalam", "Tamil", "Telugu"];

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { filterEvents(); }, [events, selectedCategory, selectedLanguage, searchTerm]);

  useEffect(() => {
    if (hotEvents.length > 1) {
      if (sliderInterval.current) clearInterval(sliderInterval.current);
      sliderInterval.current = setInterval(() => {
        setFadeState("fade-out");
        setTimeout(() => {
          setCurrentHotIndex(prev => prev + 1 >= hotEvents.length ? 0 : prev + 1);
          setFadeState("fade-in");
        }, 500);
      }, 5000);
    }
    return () => { if (sliderInterval.current) clearInterval(sliderInterval.current); };
  }, [hotEvents]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      setEvents(response.data);
      const sorted = [...response.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHotEvents(sorted.slice(0, 8));
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];
    
    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    // Search filter (includes location search)
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.singleVenue?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.cinemaShows?.some(c =>
          c.cinemaName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.location?.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Location search
        event.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.fullAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Language filter (if you have language field)
    if (selectedLanguage !== "all") {
      // filtered = filtered.filter(event => event.language === selectedLanguage);
    }
    
    setFilteredEvents(filtered);
  };

  const handleCategoryClick = (categoryId) => setSelectedCategory(categoryId);
  const handleLanguageClick = (language) => setSelectedLanguage(language === selectedLanguage ? "all" : language);
  const handleEventClick = (eventId) => navigate(`/events/${eventId}`);
  const handleBookNow = (e, eventId) => { e.stopPropagation(); navigate(`/events/${eventId}`); };

  const handlePrevSlide = () => {
    if (sliderInterval.current) clearInterval(sliderInterval.current);
    setFadeState("fade-out");
    setTimeout(() => {
      setCurrentHotIndex(prev => prev - 1 < 0 ? hotEvents.length - 1 : prev - 1);
      setFadeState("fade-in");
      sliderInterval.current = setInterval(() => {
        setFadeState("fade-out");
        setTimeout(() => {
          setCurrentHotIndex(prev => prev + 1 >= hotEvents.length ? 0 : prev + 1);
          setFadeState("fade-in");
        }, 500);
      }, 5000);
    }, 500);
  };

  const handleNextSlide = () => {
    if (sliderInterval.current) clearInterval(sliderInterval.current);
    setFadeState("fade-out");
    setTimeout(() => {
      setCurrentHotIndex(prev => prev + 1 >= hotEvents.length ? 0 : prev + 1);
      setFadeState("fade-in");
      sliderInterval.current = setInterval(() => {
        setFadeState("fade-out");
        setTimeout(() => {
          setCurrentHotIndex(prev => prev + 1 >= hotEvents.length ? 0 : prev + 1);
          setFadeState("fade-in");
        }, 500);
      }, 5000);
    }, 500);
  };

  const currentHotEvent = hotEvents[currentHotIndex];

  const getEventImage = (event) => {
    if (!event) return null;
    if (event.image && event.image !== 'default-event.jpg' && event.image !== 'null') return event.image;
    if (event.posterImage && event.posterImage !== 'default-event.jpg' && event.posterImage !== 'null') return event.posterImage;
    return null;
  };

  // singleVenue / eventDates[].venue / cinemaShows[].location are stored as
  // OBJECTS in the database (e.g. { name, location: {...} }), not plain strings.
  // Rendering that object directly inside JSX crashes React ("Objects are not
  // valid as a React child") and blanks the whole page. This helper always
  // returns a safe, renderable string.
  const getVenueName = (venueData) => {
    if (!venueData) return "TBD";
    if (typeof venueData === "string") return venueData;
    if (typeof venueData === "object") {
      return (
        venueData.name ||
        venueData.cinemaName ||
        venueData.city ||
        venueData.fullAddress ||
        venueData.location?.city ||
        venueData.location?.fullAddress ||
        "TBD"
      );
    }
    return "TBD";
  };

  const getEventDisplayInfo = (event) => {
    if (event.eventType === "movie") {
      const firstCinema = event.cinemaShows?.[0];
      const firstShowTime = firstCinema?.showDates?.[0]?.showTimes?.[0];
      return {
        venue: firstCinema?.cinemaName || getVenueName(firstCinema?.location),
        date: event.movieStartDate,
        price: firstShowTime?.price || 200,
        badge: "🎬 MOVIE",
        badgeColor: "#f6ad55"
      };
    } else if (event.eventType === "single") {
      return {
        venue: getVenueName(event.singleVenue),
        date: event.singleDate,
        price: event.singlePrice,
        badge: "🎟️ EVENT",
        badgeColor: "#667eea"
      };
    } else if (event.eventType === "multi-day") {
      const firstDate = event.eventDates?.[0];
      return {
        venue: getVenueName(firstDate?.venue),
        date: firstDate?.date,
        price: firstDate?.price,
        badge: "📅 MULTI-DAY",
        badgeColor: "#48bb78"
      };
    }
    return { venue: "TBD", date: event.date, price: event.price, badge: "📅 EVENT", badgeColor: "#667eea" };
  };

  const hotDisplayInfo = currentHotEvent ? getEventDisplayInfo(currentHotEvent) : null;

  const getCategoryIcon = (category) => {
    const icons = { music: "🎵", sports: "⚽", movies: "🎬", business: "💼", technology: "💻", food: "🍕", art: "🎨", education: "📚", comedy: "😂", other: "🎯" };
    return icons[category] || "🎯";
  };

  const getRandomLikes = () => Math.floor(Math.random() * 500) + 100;
  const getRandomRating = () => (Math.random() * 2 + 7).toFixed(1);

  const eventsByCategory = categories.filter(c => c.id !== "all").map(category => ({
    ...category,
    events: filteredEvents.filter(e => e.category === category.id).slice(0, 4)
  })).filter(c => c.events.length > 0);

  if (loading) {
    return (
      <div className="events-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading amazing events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="search-section-wrapper">
        <div className="search-section">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search for Movies, Events, Plays, Sports and Activities by title, venue, or location..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <button className="search-btn">Search</button>
        </div>
      </div>

      <div className="events-container">
        {hotEvents.length > 0 && currentHotEvent && (
          <div className="hot-events-section">
            <div className="section-header">
              <h2>🔥 Hot Event of the Moment</h2>
              <div className="slider-controls">
                <button className="slider-btn" onClick={handlePrevSlide}>←</button>
                <button className="slider-btn" onClick={handleNextSlide}>→</button>
              </div>
            </div>

            <div className={`hot-event-container ${fadeState}`}>
              <div className="hot-event-large" onClick={() => handleEventClick(currentHotEvent._id)}>
                {/* Left Side - Image */}
                <div className="hot-event-image-large">
                  {getEventImage(currentHotEvent) ? (
                    <img
                      src={getEventImage(currentHotEvent)}
                      alt={currentHotEvent.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="image-placeholder-large"
                    style={{ display: getEventImage(currentHotEvent) ? 'none' : 'flex' }}
                  >
                    {getCategoryIcon(currentHotEvent.category)}
                  </div>
                </div>

                {/* Right Side - Details */}
                <div className="hot-event-info-large">
                  {/* Category Badge */}
                  <div className="hot-event-category">
                    <span>{getCategoryIcon(currentHotEvent.category)}</span>
                    <span>{currentHotEvent.category?.toUpperCase()}</span>
                  </div>

                  {/* Title */}
                  <h3 className="hot-event-title-large">{currentHotEvent.title}</h3>

                  {/* Rating Section */}
                  <div className="hot-event-rating">
                    <div className="rating-badge">
                      <span className="rating-star">★</span>
                      <span className="rating-value">{getRandomRating()}</span>
                      <span className="rating-count">({getRandomLikes()}K)</span>
                    </div>
                    <div className="likes-count">
                      <span>❤️</span>
                      <span>{getRandomLikes()}K</span>
                    </div>
                  </div>

                  {/* Event Meta (Date, Venue, Language) */}
                  <div className="hot-event-meta-large">
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span>
                        {hotDisplayInfo?.date ? new Date(hotDisplayInfo.date).toLocaleDateString() : "TBA"}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span>{hotDisplayInfo?.venue || "TBD"}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">🎬</span>
                      <span>2D • {currentHotEvent.category}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="hot-event-description">
                    {currentHotEvent.description || `Experience the amazing ${currentHotEvent.title}. Book your tickets now for an unforgettable experience!`}
                  </p>

                  {/* Price Section */}
                  <div className="hot-event-price-section">
                    <span className="hot-event-price-large">
                      ₹{currentHotEvent.eventType === "movie" ?
                        currentHotEvent.cinemaShows?.[0]?.showDates?.[0]?.showTimes?.[0]?.price || 200 :
                        currentHotEvent.singlePrice || currentHotEvent.eventDates?.[0]?.price || 500}
                      <small>/ticket</small>
                    </span>
                    <span className="tax-text">inclusive of taxes</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="hot-event-actions">
                    <button 
                      className="book-now-btn-large" 
                      onClick={(e) => { e.stopPropagation(); handleEventClick(currentHotEvent._id); }}
                    >
                      Book Now
                    </button>
                    <button 
                      className="watch-trailer-btn" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      ▶ Watch Trailer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="category-section">
          <div className="category-title">Filters</div>
          <div className="category-grid">
            {categories.map(category => (
              <button 
                key={category.id} 
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`} 
                onClick={() => handleCategoryClick(category.id)}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
          <div className="language-filters">
            {languages.map(lang => (
              <button 
                key={lang} 
                className={`language-btn ${selectedLanguage === lang ? 'active' : ''}`} 
                onClick={() => handleLanguageClick(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {eventsByCategory.length > 0 ? (
          eventsByCategory.map(category => (
            <div key={category.id} className="category-events-section">
              <div className="category-header">
                <h3>{category.icon} {category.name}</h3>
                <a href={`/events?category=${category.id}`} className="view-all">Explore All {category.name} →</a>
              </div>
              <div className="events-grid">
                {category.events.map(event => {
                  const displayInfo = getEventDisplayInfo(event);
                  const imageUrl = getEventImage(event);
                  return (
                    <div key={event._id} className="event-card" onClick={() => handleEventClick(event._id)}>
                      <div className="event-image">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={event.title}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="image-placeholder"
                          style={{ display: imageUrl ? 'none' : 'flex' }}
                        >
                          {getCategoryIcon(event.category)}
                        </div>
                        <span className="event-badge" style={{ backgroundColor: displayInfo.badgeColor }}>
                          {displayInfo.badge}
                        </span>
                      </div>
                      <div className="event-info">
                        <h4 className="event-title">{event.title}</h4>
                        <div className="event-meta">
                          <span>📍 {typeof displayInfo.venue === 'object' ? displayInfo.venue?.name || "TBD" : displayInfo.venue || "TBD"}</span>
                        </div>
                        <div className="event-meta">
                          <span>📅 {displayInfo.date ? new Date(displayInfo.date).toLocaleDateString() : "TBA"}</span>
                        </div>
                        <div className="event-price">₹{displayInfo.price}</div>
                        <button className="book-btn-small" onClick={(e) => handleBookNow(e, event._id)}>Book Now</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="no-events">
            <div className="empty-icon">🎭</div>
            <h3>No events found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        )}

        <div className="coming-soon">
          <h2>Coming Soon</h2>
          <p>Exciting new events are on their way!</p>
          <a href="/upcoming" className="explore-btn">Explore Upcoming Events →</a>
        </div>
      </div>
    </div>
  );
}

export default Events;
