const Booking = require("../models/Booking");
const Event = require("../models/Event");

// @desc    Create a new booking with date-wise seat tracking
// @route   POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { 
      eventId, 
      selectedSeats, 
      quantity, 
      totalAmount, 
      selectedDate, 
      showTime, 
      showDate,
      cinemaName,
      venue 
    } = req.body;
    
    const userId = req.user.id;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    let targetShowTime = null;
    let targetCinema = null;
    let targetShowDate = null;

    // Find the correct showTime based on event type
    if (event.eventType === "movie") {
      for (const cinema of event.cinemaShows) {
        if (cinema.cinemaName === cinemaName) {
          targetCinema = cinema;
          for (const date of cinema.showDates) {
            if (new Date(date.date).toDateString() === new Date(selectedDate || showDate).toDateString()) {
              targetShowDate = date;
              for (const time of date.showTimes) {
                if (time.time === showTime) {
                  targetShowTime = time;
                  break;
                }
              }
              break;
            }
          }
          break;
        }
      }
    } else if (event.eventType === "single") {
      targetShowTime = event.singleShowTimes?.find(t => t.time === showTime);
    } else if (event.eventType === "multi-day") {
      for (const date of event.eventDates) {
        if (new Date(date.date).toDateString() === new Date(selectedDate || showDate).toDateString()) {
          targetShowDate = date;
          targetShowTime = date.showTimes?.find(t => t.time === showTime);
          break;
        }
      }
    }

    if (!targetShowTime) {
      return res.status(404).json({ success: false, message: "Show time not found" });
    }

    // Date-wise seat validation - THIS IS THE KEY FIX for multi-day movies
    const dateKey = new Date(selectedDate || showDate).toISOString().split('T')[0];
    const existingBookedSeats = targetShowTime.bookedSeatsByDate?.get(dateKey) || [];

    // Check if any selected seat is already booked for this specific date
    const alreadyBooked = selectedSeats.some(seat => existingBookedSeats.includes(seat));
    if (alreadyBooked) {
      return res.status(400).json({
        success: false,
        message: 'Some seats are already booked for the selected date'
      });
    }

    // Check seat availability
    if (targetShowTime.availableSeats < selectedSeats.length) {
      return res.status(400).json({
        success: false,
        message: 'Not enough seats available'
      });
    }

    // Update booked seats for this specific date
    const updatedBookedSeats = [...existingBookedSeats, ...selectedSeats];
    targetShowTime.bookedSeatsByDate.set(dateKey, updatedBookedSeats);
    
    // Update total bookedSeats array (for backward compatibility)
    targetShowTime.bookedSeats.push(...selectedSeats);
    targetShowTime.availableSeats -= selectedSeats.length;

    await event.save();

    // Create booking record
    const booking = new Booking({
      userId,
      eventId,
      selectedSeats: selectedSeats.map(seat => ({ seatNumber: seat, displayName: seat })),
      quantity: selectedSeats.length,
      totalAmount,
      status: 'confirmed',
      bookingDate: new Date(),
      selectedDate: new Date(selectedDate || showDate),
      showTime,
      cinemaName: cinemaName || null,
      venue: venue || null
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await Booking.find({ userId })
      .populate('eventId', 'title image posterImage category eventType singleDate singleVenue singlePrice movieStartDate movieEndDate cinemaShows eventDates venue startDate endDate price totalSeats availableSeats description location')
      .sort({ createdAt: -1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title image posterImage category eventType singleDate singleVenue singlePrice movieStartDate movieEndDate cinemaShows eventDates venue startDate endDate price totalSeats availableSeats description location');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if user owns this booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    res.status(200).json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a booking
// @route   POST /api/bookings/cancel/:id
exports.cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if user owns this booking
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }
    
    // Check if already cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    // Restore seats in the event
    const event = await Event.findById(booking.eventId);
    if (event) {
      // Find and restore the specific showtime seats
      const selectedDateKey = booking.selectedDate ? new Date(booking.selectedDate).toISOString().split('T')[0] : null;
      
      if (event.eventType === "movie") {
        for (const cinema of event.cinemaShows) {
          if (cinema.cinemaName === booking.cinemaName) {
            for (const date of cinema.showDates) {
              const dateKey = new Date(date.date).toISOString().split('T')[0];
              if (selectedDateKey && dateKey === selectedDateKey) {
                for (const time of date.showTimes) {
                  if (time.time === booking.showTime) {
                    // Remove seats from bookedSeatsByDate for this date
                    const bookedForDate = time.bookedSeatsByDate.get(selectedDateKey) || [];
                    const updatedBookedForDate = bookedForDate.filter(seat => 
                      !booking.selectedSeats?.some(s => s.seatNumber === seat)
                    );
                    time.bookedSeatsByDate.set(selectedDateKey, updatedBookedForDate);
                    
                    // Remove from main bookedSeats array
                    time.bookedSeats = time.bookedSeats.filter(seat => 
                      !booking.selectedSeats?.some(s => s.seatNumber === seat)
                    );
                    time.availableSeats += booking.quantity;
                    break;
                  }
                }
                break;
              }
            }
            break;
          }
        }
      } else if (event.eventType === "single" && event.singleShowTimes) {
        const showTime = event.singleShowTimes.find(t => t.time === booking.showTime);
        if (showTime) {
          if (selectedDateKey) {
            const bookedForDate = showTime.bookedSeatsByDate.get(selectedDateKey) || [];
            const updatedBookedForDate = bookedForDate.filter(seat => 
              !booking.selectedSeats?.some(s => s.seatNumber === seat)
            );
            showTime.bookedSeatsByDate.set(selectedDateKey, updatedBookedForDate);
          }
          showTime.bookedSeats = showTime.bookedSeats.filter(seat => 
            !booking.selectedSeats?.some(s => s.seatNumber === seat)
          );
          showTime.availableSeats += booking.quantity;
        }
      } else if (event.eventType === "multi-day" && event.eventDates) {
        for (const date of event.eventDates) {
          const dateKey = new Date(date.date).toISOString().split('T')[0];
          if (selectedDateKey && dateKey === selectedDateKey) {
            const showTime = date.showTimes?.find(t => t.time === booking.showTime);
            if (showTime) {
              const bookedForDate = showTime.bookedSeatsByDate.get(selectedDateKey) || [];
              const updatedBookedForDate = bookedForDate.filter(seat => 
                !booking.selectedSeats?.some(s => s.seatNumber === seat)
              );
              showTime.bookedSeatsByDate.set(selectedDateKey, updatedBookedForDate);
              showTime.bookedSeats = showTime.bookedSeats.filter(seat => 
                !booking.selectedSeats?.some(s => s.seatNumber === seat)
              );
              showTime.availableSeats += booking.quantity;
            }
            break;
          }
        }
      }
      
      await event.save();
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a booking (for cancelled bookings only)
// @route   DELETE /api/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if user owns this booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this booking" });
    }
    
    // Only allow deletion of cancelled bookings
    if (booking.status !== "cancelled") {
      return res.status(400).json({ message: "Only cancelled bookings can be deleted" });
    }
    
    await Booking.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: "Booking deleted successfully" 
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking payment status
// @route   PUT /api/bookings/:id/payment
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { transactionId, paymentMethod, paymentStatus, amount } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        transactionId, 
        paymentMethod, 
        paymentStatus, 
        amount,
        status: paymentStatus === "completed" ? "confirmed" : "pending"
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json({ success: true, booking });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ message: error.message });
  }
};