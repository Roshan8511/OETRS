import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

function About() {
  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: "Roshan Yadav",
      role: "Founder & CEO",
      bio: "Passionate about bringing people together through amazing events. 10+ years in event management.",
      avatar: "RY",
      image: "https://source.unsplash.com/400x400/?ceo,professional"
    },
    {
      id: 2,
      name: "Priya Sharma",
      role: "Head of Operations",
      bio: "Ensures every event runs smoothly. Loves creating memorable experiences for customers.",
      avatar: "PS",
      image: "https://source.unsplash.com/400x400/?woman,professional"
    },
    {
      id: 3,
      name: "Amit Kumar",
      role: "Technical Lead",
      bio: "Tech enthusiast building seamless booking experiences. Loves solving complex problems.",
      avatar: "AK",
      image: "https://source.unsplash.com/400x400/?developer,professional"
    },
    {
      id: 4,
      name: "Neha Patel",
      role: "Customer Success",
      bio: "Dedicated to making every customer happy. Always ready to help and support.",
      avatar: "NP",
      image: "https://source.unsplash.com/400x400/?customer,service"
    }
  ];

  // Company values
  const values = [
    {
      icon: "🎯",
      title: "Customer First",
      description: "We prioritize our customers' needs and strive to provide the best experience possible."
    },
    {
      icon: "✨",
      title: "Quality Events",
      description: "We partner with the best event organizers to bring you high-quality experiences."
    },
    {
      icon: "🔒",
      title: "Secure Booking",
      description: "Your security is our priority. All transactions are encrypted and safe."
    },
    {
      icon: "💡",
      title: "Innovation",
      description: "We continuously improve our platform to make event booking easier and faster."
    }
  ];

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About EventTicket</h1>
          <p>Your trusted partner for discovering and booking the best events in town</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-content">
          <h2>Our Mission</h2>
          <p>To make event discovery and booking seamless, enjoyable, and accessible to everyone. We believe that amazing experiences should be just a click away.</p>
          
          <div className="mission-stats">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Events Hosted</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Cities</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="story-grid">
          <div className="story-content">
            <h2>Our Story</h2>
            <p>Founded in 2024, EventTicket started with a simple idea: make event booking as easy as ordering food online. What began as a small project has grown into a trusted platform serving thousands of happy customers.</p>
            <p>We've partnered with the best venues, organizers, and artists to bring you an incredible selection of events. From intimate workshops to massive concerts, we've got something for everyone.</p>
            <p>Today, we're proud to be one of the fastest-growing event platforms in India, and we're just getting started!</p>
          </div>
          <div className="story-image">
            <img 
              src="https://source.unsplash.com/800x600/?office,team" 
              alt="Our team at work"
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <h2>Our Values</h2>
        <div className="values-grid">
          {values.map((value, index) => (
            <div key={index} className="value-card">
              <div className="value-icon">{value.icon}</div>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <h2>Meet Our Team</h2>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div key={member.id} className="team-card">
              <div 
                className="team-image" 
                style={{ backgroundImage: `url(${member.image})` }}
              >
                <div className="team-social">
                  <a href="#" target="_blank" rel="noopener noreferrer">📘</a>
                  <a href="#" target="_blank" rel="noopener noreferrer">🐦</a>
                  <a href="#" target="_blank" rel="noopener noreferrer">💼</a>
                </div>
              </div>
              <div className="team-info">
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                <p className="team-bio">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="about-testimonials">
        <h2>What People Say</h2>
        <div className="testimonials-slider">
          <div className="testimonial-slide">
            <p className="testimonial-quote">"EventTicket made booking tickets for our annual conference so easy! The platform is intuitive and the support team is amazing."</p>
            <div className="testimonial-author">
              <div className="author-avatar">RJ</div>
              <div className="author-info">
                <h4>Rahul Jain</h4>
                <p>Event Organizer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <h2>Ready to Start Your Journey?</h2>
        <p>Join thousands of happy customers and discover amazing events near you</p>
        <div className="cta-buttons">
          <Link to="/events" className="cta-button primary">Browse Events</Link>
          <Link to="/contact" className="cta-button secondary">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}

export default About;