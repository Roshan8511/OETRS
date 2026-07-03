// @desc    Create new event
// @route   POST /api/events
exports.createEvent = async (req, res) => {
  try {
    // Add organizer to req.body
    req.body.organizer = req.user.id;
    
    // Handle both 'category' and 'eventType' field names
    if (req.body.category && !req.body.eventType) {
      req.body.eventType = req.body.category;
    }
    if (req.body.eventType && !req.body.category) {
      req.body.category = req.body.eventType;
    }
    
    // Validate required fields
    if (!req.body.eventType && !req.body.category) {
      return res.status(400).json({
        success: false,
        error: 'Event type/category is required'
      });
    }
    
    // Parse any JSON strings that might come as strings
    if (req.body.theaters && typeof req.body.theaters === 'string') {
      req.body.theaters = JSON.parse(req.body.theaters);
    }
    
    // ========== PROCESS MOVIE EVENT DATA ==========
    if (req.body.eventType === 'movie') {
      // Parse dates
      if (req.body.movieStartDate) {
        req.body.movieStartDate = new Date(req.body.movieStartDate);
      }
      if (req.body.movieEndDate) {
        req.body.movieEndDate = new Date(req.body.movieEndDate);
      }
      
      // Parse cinemaShows if it's a string
      if (req.body.cinemaShows && typeof req.body.cinemaShows === 'string') {
        try {
          req.body.cinemaShows = JSON.parse(req.body.cinemaShows);
        } catch (e) {
          console.error("Failed to parse cinemaShows:", e);
          req.body.cinemaShows = [];
        }
      }
      
      // Process each cinema's show dates and show times
      if (req.body.cinemaShows && Array.isArray(req.body.cinemaShows)) {
        req.body.cinemaShows = req.body.cinemaShows.map((cinema) => ({
          ...cinema,
          showDates: cinema.showDates?.map((showDate) => ({
            ...showDate,
            date: new Date(showDate.date),
            showTimes: showDate.showTimes?.map((timeSlot) => ({
              time: timeSlot.time,
              price: Number(timeSlot.price) || 0,
              totalSeats: Number(timeSlot.availableSeats) || 100,
              availableSeats: Number(timeSlot.availableSeats) || 100,
              bookedSeats: [],
              bookedSeatsByDate: {}
            })) || []
          })) || []
        }));
      }
    }
    
    // ========== PROCESS SINGLE EVENT DATA ==========
    if (req.body.eventType === 'single') {
      if (req.body.singleDate) {
        req.body.singleDate = new Date(req.body.singleDate);
      }
      
      // Process single show times
      if (req.body.singleShowTimes && typeof req.body.singleShowTimes === 'string') {
        const showTimesArray = req.body.singleShowTimes.split(',').map(t => t.trim());
        req.body.singleShowTimes = showTimesArray.map((time, index) => ({
          time: time,
          price: Number(req.body.singlePrice) || 0,
          totalSeats: Number(req.body.singleTotalSeats) || 100,
          availableSeats: Number(req.body.singleTotalSeats) || 100,
          bookedSeats: [],
          bookedSeatsByDate: {}
        }));
      } else if (Array.isArray(req.body.singleShowTimes)) {
        req.body.singleShowTimes = req.body.singleShowTimes.map((timeSlot) => ({
          time: timeSlot.time,
          price: Number(timeSlot.price) || Number(req.body.singlePrice) || 0,
          totalSeats: Number(req.body.singleTotalSeats) || 100,
          availableSeats: Number(req.body.singleTotalSeats) || 100,
          bookedSeats: [],
          bookedSeatsByDate: {}
        }));
      }
      
      // Set legacy fields
      req.body.availableSeats = Number(req.body.singleTotalSeats) || 0;
      req.body.totalSeats = Number(req.body.singleTotalSeats) || 0;
      req.body.price = Number(req.body.singlePrice) || 0;
      
      // Create venue object if singleVenue exists
      if (req.body.singleVenue) {
        req.body.venue = {
          name: req.body.singleVenue,
          address: req.body.singleVenue,
          city: req.body.singleVenue.split(',')[0] || req.body.singleVenue,
          country: 'India'
        };
      }
      
      // Set start/end dates
      if (req.body.singleDate) {
        req.body.startDate = req.body.singleDate;
        req.body.endDate = req.body.singleDate;
      }
    }
    
    // ========== PROCESS MULTI-DAY EVENT DATA ==========
    if (req.body.eventType === 'multi-day') {
      // Parse eventDates if it's a string
      if (req.body.eventDates && typeof req.body.eventDates === 'string') {
        try {
          req.body.eventDates = JSON.parse(req.body.eventDates);
        } catch (e) {
          console.error("Failed to parse eventDates:", e);
          req.body.eventDates = [];
        }
      }
      
      // Process each event date
      if (req.body.eventDates && Array.isArray(req.body.eventDates)) {
        let totalSeats = 0;
        let minPrice = Infinity;
        
        req.body.eventDates = req.body.eventDates.map((eventDate) => {
          const dateTotalSeats = Number(eventDate.totalSeats) || 0;
          const datePrice = Number(eventDate.price) || 0;
          totalSeats += dateTotalSeats;
          minPrice = Math.min(minPrice, datePrice);
          
          return {
            ...eventDate,
            date: new Date(eventDate.date),
            totalSeats: dateTotalSeats,
            price: datePrice,
            showTimes: eventDate.showTimes?.map((timeSlot) => ({
              time: timeSlot.time,
              availableSeats: Number(timeSlot.availableSeats) || dateTotalSeats,
              totalSeats: dateTotalSeats,
              price: datePrice,
              bookedSeats: [],
              bookedSeatsByDate: {}
            })) || []
          };
        });
        
        // Set legacy fields
        req.body.totalSeats = totalSeats;
        req.body.price = minPrice !== Infinity ? minPrice : 0;
        req.body.availableSeats = totalSeats;
        
        // Set start/end dates
        if (req.body.eventDates.length > 0) {
          req.body.startDate = req.body.eventDates[0].date;
          req.body.endDate = req.body.eventDates[req.body.eventDates.length - 1].date;
          
          // Create venue object from first event date
          if (req.body.eventDates[0].venue) {
            req.body.venue = {
              name: req.body.eventDates[0].venue,
              address: req.body.eventDates[0].venue,
              city: req.body.eventDates[0].venue.split(',')[0] || req.body.eventDates[0].venue,
              country: 'India'
            };
          }
        }
      }
    }
    
    // Create location object if not present
    if (!req.body.location || Object.keys(req.body.location).length === 0) {
      req.body.location = {
        city: req.body.venue?.city || '',
        state: '',
        country: 'India',
        fullAddress: req.body.venue?.address || ''
      };
    }
    
    // Set default status
    req.body.status = 'published';
    
    // Create the event
    const event = await Event.create(req.body);
    
    console.log("✅ Event created successfully:", {
      id: event._id,
      title: event.title,
      type: event.eventType,
      category: event.category
    });
    
    // Create default ticket category (if needed)
    let ticketCategory = null;
    if (req.body.price || req.body.singlePrice) {
      const TicketCategory = require('../models/TicketCategory');
      ticketCategory = await TicketCategory.create({
        eventId: event._id,
        name: 'General Admission',
        price: parseFloat(req.body.price || req.body.singlePrice) || 0,
        totalQuantity: parseInt(req.body.totalSeats || req.body.singleTotalSeats) || 100,
        availableQuantity: parseInt(req.body.totalSeats || req.body.singleTotalSeats) || 100,
        description: 'Standard ticket',
        isActive: true
      });
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
      ticketCategory
    });
    
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create event'
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Check if user is organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this event'
      });
    }
    
    // Handle seat update - if totalSeats is updated, update availableSeats
    if (req.body.totalSeats && !req.body.availableSeats) {
      req.body.availableSeats = req.body.totalSeats;
    }
    
    // Handle single event seat update
    if (req.body.singleTotalSeats) {
      req.body.availableSeats = req.body.singleTotalSeats;
    }
    
    // Handle multi-day seat update
    if (req.body.eventDates && Array.isArray(req.body.eventDates)) {
      let totalSeats = 0;
      req.body.eventDates.forEach(date => {
        totalSeats += Number(date.totalSeats) || 0;
      });
      req.body.totalSeats = totalSeats;
      req.body.availableSeats = totalSeats;
    }
    
    // Update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    console.log("✅ Event updated successfully:", {
      id: updatedEvent._id,
      title: updatedEvent.title
    });
    
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update event'
    });
  }
};

// @desc    Get all events
// @route   GET /api/events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    res.status(200).json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Check if user is organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this event'
      });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    
    console.log("✅ Event deleted successfully:", event.title);
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};