import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Home.css";
import { API_BASE_URL } from "../config/api";

function Home() {
  const [latestEvents, setLatestEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      // Get latest 3 events sorted by creation date
      const sorted = [...response.data].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setLatestEvents(sorted.slice(0, 3));
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get event image
  const getEventImage = (event) => {
    if (event.image && event.image !== 'default-event.jpg') {
      return event.image;
    }
    if (event.posterImage && event.posterImage !== 'default-event.jpg') {
      return event.posterImage;
    }
    return null;
  };

  // Helper function to get event location city
  const getEventCity = (event) => {
    if (event.location?.city) return event.location.city;
    if (event.venue?.city) return event.venue.city;
    if (event.singleVenue) return event.singleVenue.split(',')[0];
    return "Location TBA";
  };

  // Sample testimonials
  const testimonials = [
    {
      id: 1,
      text: "Amazing platform! Booked tickets for a concert and the process was seamless. Will definitely use again!",
      author: "Priya Sharma",
      role: "Music Lover",
      avatar: "PS"
    },
    {
      id: 2,
      text: "Great selection of events and very easy to use. The seat selection feature is fantastic!",
      author: "Rahul Kumar",
      role: "Event Enthusiast",
      avatar: "RK"
    },
    {
      id: 3,
      text: "Best ticket booking platform I've used. Customer support is excellent and refunds are hassle-free.",
      author: "Neha Patel",
      role: "Regular Customer",
      avatar: "NP"
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Discover Amazing Events Near You</h1>
          <p>Book tickets for concerts, workshops, sports events, and more with just a few clicks</p>
          <div className="hero-buttons">
            <Link to="/events" className="btn-primary">Browse Events</Link>
            <Link to="/about" className="btn-secondary">Learn More</Link>
          </div>
        </div>
      </section>

      {/* Latest Events Section - Professional Layout */}
      <section className="latest-events-section">
        <h2 className="section-title">Latest Events</h2>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : latestEvents.length > 0 ? (
          <div className="events-grid">
            {latestEvents.map((event) => {
              const imageUrl = getEventImage(event);
              const eventCity = getEventCity(event);
              const categoryIcon = {
                music: "🎵", sports: "⚽", movies: "🎬", business: "💼",
                technology: "💻", food: "🍕", art: "🎨", education: "📚",
                comedy: "😂", other: "🎯"
              }[event.category] || "🎯";
              
              return (
                <div key={event._id} className="event-card">
                  <div className="event-card-image">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={event.title}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/800x600?text=Event";
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span>{categoryIcon}</span>
                      </div>
                    )}
                  </div>
                  <div className="event-card-content">
                    <span className="event-category-badge">
                      {categoryIcon} {event.category}
                    </span>
                    <h3>{event.title}</h3>
                    <p className="event-location">
                      📍 {eventCity}
                    </p>
                    <Link to={`/events/${event._id}`} className="book-now-btn">
                      Book Now →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-events">
            <div className="empty-icon">🎭</div>
            <h3>No Events Available</h3>
            <p>Please check again later for exciting events.</p>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Find Events</h3>
            <p>Browse through hundreds of events happening near you. Filter by date, category, or location.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Book Tickets</h3>
            <p>Select your seats, choose quantity, and proceed to checkout in just a few clicks.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Make Payment</h3>
            <p>Pay securely using our multiple payment options. Get instant confirmation.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Enjoy Event</h3>
            <p>Show your digital ticket at the venue and enjoy the event hassle-free!</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <h2 className="section-title">What Our Customers Say</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonial.avatar}</div>
                <div className="author-info">
                  <h4>{testimonial.author}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2>Ready to Experience Amazing Events?</h2>
        <p>Join thousands of happy customers who book with us</p>
        <Link to="/events" className="cta-button">Get Started Now</Link>
      </section>
    </div>
  );
}

export default Home;