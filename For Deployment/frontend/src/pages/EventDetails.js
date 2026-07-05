import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EventDetails.css";
import { API_BASE_URL } from "../config/api";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedShowDate, setSelectedShowDate] = useState(null);
  const [selectedShowTime, setSelectedShowTime] = useState(null);
  const [selectedSingleDate, setSelectedSingleDate] = useState(null);
  const [selectedMultiDate, setSelectedMultiDate] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(''); // New state for movie date selector

  const offers = [
    { id: 1, title: "YES Private Debit Card Offer", description: "Tap to view details", icon: "💳" },
    { id: 2, title: "Buy 1 get 1 movie ticket free", description: "Tap to view details", icon: "🎟️" },
    { id: 3, title: "50% off on non-veg combo", description: "Tap to view details", icon: "🍿" }
  ];

  useEffect(() => { fetchEventDetails(); }, [id]);

  // Helper function to get all dates between start and end date
  const getAllMovieDates = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    
    const dates = [];
    const current = new Date(startDate);
    const last = new Date(endDate);
    
    // Reset time to avoid timezone issues
    current.setHours(0, 0, 0, 0);
    last.setHours(0, 0, 0, 0);

    while (current <= last) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events/${id}`);
      const evt = response.data;
      setEvent(evt);

      if (evt.eventType === "movie" && evt.cinemaShows?.length > 0) {
        const firstCinema = evt.cinemaShows[0];
        setSelectedCinema(firstCinema);
        if (firstCinema.showDates?.length > 0) {
          setSelectedShowDate(firstCinema.showDates[0]);
          if (firstCinema.showDates[0].showTimes?.length > 0) {
            setSelectedShowTime(firstCinema.showDates[0].showTimes[0]);
          }
        }
        // Set initial selected date to movie start date
        if (evt.movieStartDate) {
          setSelectedDate(new Date(evt.movieStartDate).toISOString());
        }
      } else if (evt.eventType === "multi-day" && evt.eventDates?.length > 0) {
        setSelectedMultiDate(evt.eventDates[0]);
      } else if (evt.eventType === "single" && evt.singleDate) {
        setSelectedSingleDate({ 
          id: 0, 
          fullDate: new Date(evt.singleDate), 
          date: new Date(evt.singleDate).getDate(), 
          day: new Date(evt.singleDate).toLocaleDateString("en-US", { weekday: "short" }), 
          month: new Date(evt.singleDate).toLocaleDateString("en-US", { month: "short" }) 
        });
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventImage = (evt) => {
    if (!evt) return null;
    if (evt.image && evt.image !== "default-event.jpg" && evt.image !== "null") return evt.image;
    if (evt.posterImage && evt.posterImage !== "default-event.jpg" && evt.posterImage !== "null") return evt.posterImage;
    return null;
  };

  const generateDates = () => {
    // For single events, show only the actual event date (not 7 random future dates)
    if (event?.eventType === "single" && event.singleDate) {
      const d = new Date(event.singleDate);
      return [{
        id: 0,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate(),
        month: d.toLocaleDateString("en-US", { month: "short" }),
        fullDate: d
      }];
    }
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        id: i,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate(),
        month: date.toLocaleDateString("en-US", { month: "short" }),
        fullDate: date
      };
    });
  };

  const getTicketPrice = () => {
    if (event?.eventType === "movie" && selectedShowTime) return selectedShowTime.price || 200;
    if (event?.eventType === "single" && event.singlePrice) return event.singlePrice;
    if (event?.eventType === "multi-day" && selectedMultiDate) return selectedMultiDate.price;
    return 199;
  };

  // singleVenue / venue fields are stored as OBJECTS ({ name, location }) in
  // the database, not plain strings. Rendering that object directly as JSX
  // (or passing it downstream to another page that renders it) crashes React.
  const getVenueName = (venueData) => {
    if (!venueData) return "Venue TBA";
    if (typeof venueData === "string") return venueData;
    if (typeof venueData === "object") {
      return (
        venueData.name ||
        venueData.cinemaName ||
        venueData.city ||
        venueData.fullAddress ||
        venueData.location?.city ||
        venueData.location?.fullAddress ||
        "Venue TBA"
      );
    }
    return "Venue TBA";
  };

  const getSelectedVenue = () => {
    if (event?.eventType === "movie" && selectedCinema) return selectedCinema.cinemaName || getVenueName(selectedCinema.location);
    if (event?.eventType === "single") return getVenueName(event.singleVenue);
    if (event?.eventType === "multi-day" && selectedMultiDate) return getVenueName(selectedMultiDate.venue);
    return "Venue TBA";
  };

  const getSelectedDateObj = () => {
    if (event?.eventType === "movie" && selectedShowDate) return new Date(selectedShowDate.date);
    if (event?.eventType === "single" && selectedSingleDate) return selectedSingleDate.fullDate || new Date(event.singleDate);
    if (event?.eventType === "multi-day" && selectedMultiDate) return new Date(selectedMultiDate.date);
    return new Date();
  };

  const getSelectedTime = () => {
    if (event?.eventType === "movie" && selectedShowTime) return selectedShowTime.time;
    if (event?.eventType === "single" && event.singleShowTimes?.length > 0) {
      // Handle both string array and object array formats
      const firstShow = event.singleShowTimes[0];
      return typeof firstShow === 'string' ? firstShow : firstShow.time;
    }
    if (event?.eventType === "multi-day" && selectedMultiDate?.showTimes?.length > 0) return selectedMultiDate.showTimes[0].time;
    return "TBA";
  };

  const handleDateSelect = (date) => setSelectedSingleDate(date);
  const handleCinemaSelect = (cinema) => { setSelectedCinema(cinema); setSelectedShowDate(null); setSelectedShowTime(null); };
  const handleShowDateSelect = (showDate) => { setSelectedShowDate(showDate); setSelectedShowTime(null); };
  const handleShowTimeSelect = (showTime) => setSelectedShowTime(showTime);
  const handleMultiDateSelect = (date) => setSelectedMultiDate(date);

  const handleProceedToBooking = () => {
    if (event.eventType === "movie") {
      if (!selectedCinema || !selectedShowDate || !selectedShowTime) {
        alert("Please select cinema, date and show time to continue");
        return;
      }
      // For movies, navigate to seat selection
      navigate("/seat-selection", {
        state: {
          event,
          cinema: selectedCinema,
          showDate: selectedShowDate,
          showTime: selectedShowTime,
          date: {
            day: new Date(selectedShowDate.date).toLocaleDateString("en-US", { weekday: "short" }),
            date: new Date(selectedShowDate.date).getDate(),
            month: new Date(selectedShowDate.date).toLocaleDateString("en-US", { month: "short" })
          },
          venue: { name: selectedCinema.cinemaName, location: selectedCinema.location }
        }
      });
    } else {
      // For non-movie events, show quantity modal
      if (event.eventType === "single" && !selectedSingleDate) {
        alert("Please select a date to continue");
        return;
      }
      if (event.eventType === "multi-day" && !selectedMultiDate) {
        alert("Please select a date to continue");
        return;
      }
      setShowQuantityModal(true);
    }
  };

  const handleConfirmBooking = () => {
    const ticketPrice = getTicketPrice();
    const totalAmount = ticketPrice * quantity;

    const bookingDetails = {
      eventId: event._id,
      eventTitle: event.title,
      eventCategory: event.category,
      eventType: event.eventType,
      eventVenue: getSelectedVenue(),
      eventDate: getSelectedDateObj().toLocaleDateString(),
      eventTime: getSelectedTime(),
      eventImage: getEventImage(event),
      ticketPrice,
      quantity,
      totalAmount,
      cinema: selectedCinema,
      showDate: selectedShowDate,
      showTime: selectedShowTime,
      singleDate: selectedSingleDate,
      multiDate: selectedMultiDate
    };

    localStorage.setItem("pendingBooking", JSON.stringify(bookingDetails));
    setShowQuantityModal(false);
    navigate("/payment", { state: { bookingDetails } });
  };

  const EventPoster = ({ event: evt }) => {
    const imageUrl = getEventImage(evt);
    const [imgError, setImgError] = useState(false);
    const getCategoryIcon = (cat) => {
      const icons = { music: "🎵", sports: "⚽", movies: "🎬", business: "💼", technology: "💻", food: "🍕", art: "🎨", education: "📚", comedy: "😂", other: "🎯" };
      return icons[cat] || "🎫";
    };
    return (
      <div className="movie-poster">
        {imageUrl && !imgError ? (
          <img src={imageUrl} alt={evt?.title} onError={() => setImgError(true)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", minHeight: "200px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "8px", gap: "12px" }}>
            <span style={{ fontSize: "48px" }}>{getCategoryIcon(evt?.category)}</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", textAlign: "center", padding: "0 10px" }}>No image uploaded</span>
          </div>
        )}
      </div>
    );
  };

  const renderMovieDetails = () => {
    if (!event.cinemaShows || event.cinemaShows.length === 0) {
      return (
        <div className="movie-hero">
          <div className="movie-hero-content">
            <EventPoster event={event} />
            <div className="movie-info">
              <h1>{event?.title}</h1>
              <div className="movie-meta">
                <span>🎬 {event?.category}</span>
                <span>📅 {event?.movieStartDate ? new Date(event.movieStartDate).toLocaleDateString() : "TBA"} – {event?.movieEndDate ? new Date(event.movieEndDate).toLocaleDateString() : "TBA"}</span>
              </div>
              <div className="movie-format">No cinema shows added yet</div>
            </div>
          </div>
        </div>
      );
    }

    // Get all available dates for this movie
    const movieDates = getAllMovieDates(event.movieStartDate, event.movieEndDate);

    return (
      <>
        <div className="movie-hero">
          <div className="movie-hero-content">
            <EventPoster event={event} />
            <div className="movie-info">
              <h1>{event?.title}</h1>
              <div className="movie-meta">
                <span>🎬 {event?.category}</span>
                <span>📅 {event?.movieStartDate ? new Date(event.movieStartDate).getFullYear() : "2026"}</span>
                {event?.cinemaShows?.length > 0 && <span>🎪 {event.cinemaShows.length} Cinema(s)</span>}
              </div>
              <div className="movie-tagline">{event?.title?.toUpperCase()}</div>
              {event?.description && <p style={{ color: "#ccc", fontSize: "14px", marginTop: "10px", lineHeight: 1.5 }}>{event.description}</p>}
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>About the Movie</h2>
          <p>{event?.description || `Experience the amazing ${event?.title}. Book your tickets now for an unforgettable experience!`}</p>
        </div>

        <div className="offers-section">
          <h2>🎁 Top offers for you</h2>
          <div className="offers-grid">
            {offers.map(offer => (
              <div key={offer.id} className="offer-card">
                <div className="offer-icon">{offer.icon}</div>
                <div className="offer-info"><h4>{offer.title}</h4><p>{offer.description}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* NEW: Movie Date Selector - Global date picker for the movie */}
        {event.eventType === 'movie' && movieDates.length > 0 && (
          <div className="movie-date-selector">
            <h3>📅 Select Date</h3>
            <div className="date-list">
              {movieDates.map((date, index) => (
                <button
                  key={index}
                  className={selectedDate === date.toISOString() ? 'active-date' : ''}
                  onClick={() => setSelectedDate(date.toISOString())}
                >
                  <span className="date-day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="date-number">{date.getDate()}</span>
                  <span className="date-month">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                </button>
              ))}
            </div>
            {selectedDate && (
              <p className="selected-date-info">
                ✅ Showing shows for: {new Date(selectedDate).toDateString()}
              </p>
            )}
          </div>
        )}

        <div className="venue-section">
          <h2>🎪 Select Cinema & Show Time</h2>
          <div className="venue-grid">
            {event.cinemaShows.map((cinema, idx) => {
              // Filter showDates based on selected date if available
              const filteredShowDates = selectedDate 
                ? cinema.showDates?.filter(sd => 
                    new Date(sd.date).toDateString() === new Date(selectedDate).toDateString()
                  )
                : cinema.showDates;

              if (filteredShowDates?.length === 0) return null;

              return (
                <div key={idx}>
                  <div className={`venue-card ${selectedCinema?.cinemaName === cinema.cinemaName ? "selected" : ""}`} onClick={() => handleCinemaSelect(cinema)}>
                    <div className="venue-info">
                      <h3>{cinema.cinemaName}</h3>
                      <p>📍 {typeof cinema.location === 'string' ? cinema.location : cinema.location?.fullAddress || cinema.location?.city || "Location TBA"}</p>
                    </div>
                    <div className="venue-cancel">
                      {cinema.showDates?.[0]?.cancellationPolicy === "cancellable" ? "✅ Cancellation available" : "❌ Non-cancellable"}
                    </div>
                  </div>

                  {selectedCinema?.cinemaName === cinema.cinemaName && (
                    <>
                      <div className="date-section">
                        <h2>📅 Select Date</h2>
                        <div className="date-grid">
                          {filteredShowDates.map((showDate, dateIdx) => (
                            <div 
                              key={dateIdx} 
                              className={`date-card ${selectedShowDate?.date === showDate.date ? "selected" : ""}`} 
                              onClick={() => handleShowDateSelect(showDate)}
                            >
                              <div className="day">{new Date(showDate.date).toLocaleDateString("en-US", { weekday: "short" })}</div>
                              <div className="date-num">{new Date(showDate.date).getDate()}</div>
                              <div className="month">{new Date(showDate.date).toLocaleDateString("en-US", { month: "short" })}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedShowDate && (
                        <div className="time-section">
                          <h2>⏰ Select Show Time</h2>
                          <div className="time-slots">
                            {selectedShowDate.showTimes?.map((showTime, timeIdx) => (
                              <div key={timeIdx} className={`time-slot ${selectedShowTime?.time === showTime.time ? "selected" : ""}`} onClick={() => handleShowTimeSelect(showTime)}>
                                {showTime.time}
                                <span className="slot-price">₹{showTime.price}</span>
                                {showTime.availableSeats > 0 && showTime.availableSeats < 20 && (
                                  <span className="slot-badge fast-filling">FAST FILLING</span>
                                )}
                                {showTime.availableSeats === 0 && (
                                  <span className="slot-badge sold-out">SOLD OUT</span>
                                )}
                              </div>
                            ))}
                          </div>
                          {selectedShowTime && (
                            <p style={{ marginTop: "12px", color: "#48bb78", fontSize: "14px" }}>
                              ✅ Selected: {selectedShowTime.time} at {selectedCinema.cinemaName} — Next step: choose your seats
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const renderSingleDetails = () => {
    const dates = generateDates();
    return (
      <>
        <div className="movie-hero">
          <div className="movie-hero-content">
            <EventPoster event={event} />
            <div className="movie-info">
              <h1>{event?.title}</h1>
              <div className="movie-meta">
                <span>🎯 {event?.category}</span>
                <span>📍 {getVenueName(event?.singleVenue)}</span>
                <span>📅 {event?.singleDate ? new Date(event.singleDate).toLocaleDateString() : "TBA"}</span>
              </div>
              <div className="movie-format">
                🎫 ₹{event?.singlePrice} / ticket &nbsp;·&nbsp; 💺 {event?.singleTotalSeats || event?.availableSeats || "?"} seats
              </div>
              {event?.description && <p style={{ color: "#ccc", fontSize: "14px", marginTop: "10px", lineHeight: 1.5 }}>{event.description}</p>}
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>About the Event</h2>
          <p>{event?.description || "Experience this amazing event!"}</p>
        </div>

        <div className="date-section">
          <h2>📅 Event Date</h2>
          <div className="date-grid">
            {dates.map(date => (
              <div key={date.id} className={`date-card ${selectedSingleDate?.id === date.id ? "selected" : ""}`} onClick={() => handleDateSelect(date)}>
                <div className="day">{date.day}</div>
                <div className="date-num">{date.date}</div>
                <div className="month">{date.month}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="venue-section">
          <h2>📍 Venue</h2>
          <div className="venue-grid">
            <div className="venue-card selected">
              <div className="venue-info"><h3>{getVenueName(event?.singleVenue)}</h3><p>Main Venue</p></div>
            </div>
          </div>
        </div>

        {event?.singleShowTimes?.length > 0 && (
          <div className="time-section">
            <h2>⏰ Show Times</h2>
            <div className="time-slots">
              {event.singleShowTimes.map((timeSlot, idx) => {
                const time = typeof timeSlot === 'string' ? timeSlot : timeSlot.time;
                const price = typeof timeSlot === 'object' ? timeSlot.price : event.singlePrice;
                return (
                  <div key={idx} className="time-slot">
                    {time}
                    <span className="slot-price">₹{price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderMultiDayDetails = () => {
    if (!event.eventDates || event.eventDates.length === 0) return null;
    return (
      <>
        <div className="movie-hero">
          <div className="movie-hero-content">
            <EventPoster event={event} />
            <div className="movie-info">
              <h1>{event?.title}</h1>
              <div className="movie-meta">
                <span>📅 {event.eventDates.length} Days Event</span>
                <span>🎯 {event?.category}</span>
              </div>
              <div className="movie-format">
                Multi-day event from {new Date(event.eventDates[0].date).toLocaleDateString()} to {new Date(event.eventDates[event.eventDates.length - 1].date).toLocaleDateString()}
              </div>
              {event?.description && <p style={{ color: "#ccc", fontSize: "14px", marginTop: "10px", lineHeight: 1.5 }}>{event.description}</p>}
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>About the Event</h2>
          <p>{event?.description || "Experience this multi-day event!"}</p>
        </div>

        <div className="date-section">
          <h2>📅 Select Date</h2>
          <div className="date-grid">
            {event.eventDates.map((dateItem, idx) => (
              <div key={idx} className={`date-card ${selectedMultiDate?.date === dateItem.date ? "selected" : ""}`} onClick={() => handleMultiDateSelect(dateItem)}>
                <div className="day">{new Date(dateItem.date).toLocaleDateString("en-US", { weekday: "short" })}</div>
                <div className="date-num">{new Date(dateItem.date).getDate()}</div>
                <div className="month">{new Date(dateItem.date).toLocaleDateString("en-US", { month: "short" })}</div>
              </div>
            ))}
          </div>
        </div>

        {selectedMultiDate && (
          <>
            <div className="venue-section">
              <h2>📍 Venue</h2>
              <div className="venue-grid">
                <div className="venue-card selected">
                  <div className="venue-info">
                    <h3>{getVenueName(selectedMultiDate.venue)}</h3>
                    <p>Total Seats: {selectedMultiDate.totalSeats} &nbsp;·&nbsp; ₹{selectedMultiDate.price} / ticket</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedMultiDate.showTimes?.length > 0 && (
              <div className="time-section">
                <h2>⏰ Show Times</h2>
                <div className="time-slots">
                  {selectedMultiDate.showTimes.map((showTime, idx) => (
                    <div key={idx} className="time-slot">
                      {showTime.time}
                      <span className="slot-price">₹{selectedMultiDate.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="event-details-page">
        <div className="event-details-container">
          <div className="loading-spinner"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-details-page">
        <div className="event-details-container"><p>Event not found</p></div>
      </div>
    );
  }

  const isValidSelection = () => {
    if (event.eventType === "movie") return selectedCinema && selectedShowDate && selectedShowTime;
    if (event.eventType === "single") return selectedSingleDate;
    if (event.eventType === "multi-day") return selectedMultiDate;
    return false;
  };

  const getButtonLabel = () => {
    if (event.eventType === "movie") return "Select Seats →";
    return "Continue to Booking";
  };

  return (
    <div className="event-details-page">
      <div className="event-details-container">
        {event.eventType === "movie" && renderMovieDetails()}
        {event.eventType === "single" && renderSingleDetails()}
        {event.eventType === "multi-day" && renderMultiDayDetails()}

        <button className="book-ticket-btn" onClick={handleProceedToBooking} disabled={!isValidSelection()}>
          {getButtonLabel()}
        </button>

        <div className="breadcrumb">
          <a href="/">Home</a> → <a href="/events">Events</a> → {event?.title}
        </div>
      </div>

      {/* Quantity Modal (for non-movie events) */}
      {showQuantityModal && (
        <div className="modal-overlay" onClick={() => setShowQuantityModal(false)}>
          <div className="modal-content quantity-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select Number of Tickets</h3>
            <div className="quantity-selector">
              <button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <span className="quantity-value">{quantity}</span>
              <button className="quantity-btn" onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
            </div>
            <div className="price-summary">
              <p>Ticket Price: ₹{getTicketPrice()}</p>
              <p>Total Amount: ₹{getTicketPrice() * quantity}</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowQuantityModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleConfirmBooking}>Proceed to Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetails;
