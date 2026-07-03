const mongoose = require('mongoose');

// Helper schema for location
const locationSchema = new mongoose.Schema({
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'India'
  },
  fullAddress: {
    type: String,
    default: ''
  }
}, { _id: false });

// Helper schema for show times
const showTimeSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  bookedSeats: [{
    type: String,
    default: []
  }],
  bookedSeatsByDate: {
    type: Map,
    of: [String],
    default: {}
  }
}, { _id: false });

// Main Event Schema
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an event title'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'music',
      'movies',
      'sports',
      'education',
      'business',
      'technology',
      'food',
      'art',
      'comedy',
      'other'
    ]
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['single', 'movie', 'multi-day']
  },
  
  // ========== IMAGE FIELDS ==========
  image: {
    type: String,
    default: null
  },
  posterImage: {
    type: String,
    default: null
  },
  imagePublicId: {
    type: String,
    default: null
  },
  
  // ========== LOCATION FIELDS (New) ==========
  location: {
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: 'India'
    },
    fullAddress: {
      type: String,
      default: ''
    }
  },
  
  // ========== SINGLE EVENT FIELDS (Updated) ==========
  singleDate: Date,
  singleVenue: {
    name: String,
    location: locationSchema
  },
  singleTotalSeats: Number,
  singlePrice: Number,
  singleShowTimes: [showTimeSchema],
  
  // ========== MOVIE EVENT FIELDS (Updated) ==========
  movieStartDate: Date,
  movieEndDate: Date,
  cinemaShows: [{
    cinemaName: String,
    location: locationSchema,
    showDates: [{
      date: Date,
      cancellationPolicy: {
        type: String,
        enum: ['cancellable', 'non-cancellable'],
        default: 'non-cancellable'
      },
      showTimes: [showTimeSchema]
    }]
  }],
  
  // ========== MULTI-DAY EVENT FIELDS (Updated) ==========
  eventDates: [{
    date: Date,
    venue: {
      name: String,
      location: locationSchema
    },
    totalSeats: Number,
    price: Number,
    showTimes: [showTimeSchema]
  }],
  
  // ========== LEGACY FIELDS (for compatibility) ==========
  venue: {
    name: String,
    address: String,
    city: String,
    country: String
  },
  startDate: Date,
  endDate: Date,
  timing: String,
  totalSeats: Number,
  price: Number,
  availableSeats: {
    type: Number,
    default: 0
  },
  
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ category: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ 'location.state': 1 });
eventSchema.index({ startDate: 1, endDate: 1 });

// Virtual for total booked seats across all show times
eventSchema.virtual('totalBookedSeats').get(function() {
  let total = 0;
  
  if (this.eventType === 'movie') {
    this.cinemaShows?.forEach(cinema => {
      cinema.showDates?.forEach(showDate => {
        showDate.showTimes?.forEach(showTime => {
          total += showTime.totalSeats - showTime.availableSeats;
        });
      });
    });
  } else if (this.eventType === 'single') {
    this.singleShowTimes?.forEach(showTime => {
      total += showTime.totalSeats - showTime.availableSeats;
    });
  } else if (this.eventType === 'multi-day') {
    this.eventDates?.forEach(eventDate => {
      eventDate.showTimes?.forEach(showTime => {
        total += showTime.totalSeats - showTime.availableSeats;
      });
    });
  }
  
  return total;
});

// Virtual for total revenue
eventSchema.virtual('totalRevenue').get(function() {
  let revenue = 0;
  
  if (this.eventType === 'movie') {
    this.cinemaShows?.forEach(cinema => {
      cinema.showDates?.forEach(showDate => {
        showDate.showTimes?.forEach(showTime => {
          const bookedCount = showTime.totalSeats - showTime.availableSeats;
          revenue += bookedCount * showTime.price;
        });
      });
    });
  } else if (this.eventType === 'single') {
    this.singleShowTimes?.forEach(showTime => {
      const bookedCount = showTime.totalSeats - showTime.availableSeats;
      revenue += bookedCount * showTime.price;
    });
  } else if (this.eventType === 'multi-day') {
    this.eventDates?.forEach(eventDate => {
      eventDate.showTimes?.forEach(showTime => {
        const bookedCount = showTime.totalSeats - showTime.availableSeats;
        revenue += bookedCount * showTime.price;
      });
    });
  }
  
  return revenue;
});

// Helper method to check seat availability for a specific date and time
eventSchema.methods.checkSeatAvailability = function(date, time, seatNumber, cinemaName = null) {
  if (this.eventType === 'movie' && cinemaName) {
    const cinema = this.cinemaShows.find(c => c.cinemaName === cinemaName);
    if (!cinema) return false;
    
    const showDate = cinema.showDates.find(sd => 
      new Date(sd.date).toDateString() === new Date(date).toDateString()
    );
    if (!showDate) return false;
    
    const showTime = showDate.showTimes.find(st => st.time === time);
    if (!showTime) return false;
    
    return !showTime.bookedSeats.includes(seatNumber);
  }
  
  if (this.eventType === 'single') {
    const showTime = this.singleShowTimes.find(st => st.time === time);
    if (!showTime) return false;
    return !showTime.bookedSeats.includes(seatNumber);
  }
  
  if (this.eventType === 'multi-day') {
    const eventDate = this.eventDates.find(ed => 
      new Date(ed.date).toDateString() === new Date(date).toDateString()
    );
    if (!eventDate) return false;
    
    const showTime = eventDate.showTimes.find(st => st.time === time);
    if (!showTime) return false;
    
    return !showTime.bookedSeats.includes(seatNumber);
  }
  
  return false;
};

// Helper method to book seats
eventSchema.methods.bookSeats = async function(date, time, seats, cinemaName = null) {
  if (this.eventType === 'movie' && cinemaName) {
    const cinema = this.cinemaShows.find(c => c.cinemaName === cinemaName);
    if (!cinema) throw new Error('Cinema not found');
    
    const showDate = cinema.showDates.find(sd => 
      new Date(sd.date).toDateString() === new Date(date).toDateString()
    );
    if (!showDate) throw new Error('Show date not found');
    
    const showTime = showDate.showTimes.find(st => st.time === time);
    if (!showTime) throw new Error('Show time not found');
    
    // Check all seats are available
    for (const seat of seats) {
      if (showTime.bookedSeats.includes(seat)) {
        throw new Error(`Seat ${seat} is already booked`);
      }
    }
    
    // Book seats
    showTime.bookedSeats.push(...seats);
    showTime.availableSeats -= seats.length;
    
    // Update bookedSeatsByDate for the specific date
    const dateKey = new Date(date).toISOString().split('T')[0];
    const existingBooked = showTime.bookedSeatsByDate.get(dateKey) || [];
    showTime.bookedSeatsByDate.set(dateKey, [...existingBooked, ...seats]);
    
    await this.save();
    return true;
  }
  
  // Similar logic for single and multi-day events...
  return false;
};

module.exports = mongoose.model('Event', eventSchema);