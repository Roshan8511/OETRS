const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Event   = require("../models/Event");
const { protect } = require("../middleware/authMiddleware");

const POPULATE_FIELDS =
  "title image posterImage imagePublicId eventType category " +
  "singleDate singleVenue singlePrice singleShowTimes singleTotalSeats " +
  "movieStartDate movieEndDate cinemaShows " +
  "eventDates venue startDate endDate price totalSeats availableSeats description";

// ── GET my bookings ──────────────────────────────────────────
router.get("/my", protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const bookings = await Booking.find({ userId })
      .populate("eventId", POPULATE_FIELDS)
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST create booking ──────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { eventId, quantity, totalAmount, selectedSeats, cinema, showDate, showTime, transactionId, paymentMethod } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const qty = quantity || 1;

    // ── Deduct seats from the right place ──
    if (event.eventType === "movie" && cinema && showDate && showTime && selectedSeats?.length) {
      // Mark specific seats as sold inside the cinemaShows nested array
      let updated = false;
      for (const cs of event.cinemaShows) {
        if (cs.cinemaName === cinema.cinemaName) {
          for (const sd of cs.showDates) {
            if (new Date(sd.date).toDateString() === new Date(showDate.date).toDateString()) {
              for (const st of sd.showTimes) {
                if (st.time === showTime.time) {
                  // Deduct available seats
                  st.availableSeats = Math.max(0, (st.availableSeats || 100) - selectedSeats.length);
                  // Store booked seat IDs so other users see them as taken
                  if (!st.bookedSeats) st.bookedSeats = [];
                  selectedSeats.forEach(s => {
                    if (!st.bookedSeats.includes(s.displayName)) {
                      st.bookedSeats.push(s.displayName);
                    }
                  });
                  updated = true;
                }
              }
            }
          }
        }
      }
      if (updated) {
        event.markModified("cinemaShows");
        event.availableSeats = Math.max(0, (event.availableSeats || 0) - selectedSeats.length);
        await event.save();
      }
    } else if (event.eventType === "single") {
      event.availableSeats = Math.max(0, (event.availableSeats || event.singleTotalSeats || 0) - qty);
      await event.save();
    } else if (event.eventType === "multi-day") {
      event.availableSeats = Math.max(0, (event.availableSeats || 0) - qty);
      await event.save();
    }

    const booking = await Booking.create({
      userId, eventId, quantity: qty, totalAmount,
      selectedSeats: selectedSeats || [],
      cinema: cinema || null,
      showDate: showDate || null,
      showTime: showTime || null,
      transactionId: transactionId || null,
      paymentMethod: paymentMethod || null,
      status: "confirmed"
    });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST cancel booking ──────────────────────────────────────
router.post("/cancel/:id", protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.userId.toString() !== userId.toString()) return res.status(403).json({ message: "Unauthorized" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

    // ── Cancellation policy: cannot cancel within 2 hours of event ──
    const event = await Event.findById(booking.eventId);
    if (event) {
      let eventDateTime = null;
      if (event.eventType === "movie" && booking.showDate && booking.showTime) {
        const d = new Date(booking.showDate.date);
        const timeParts = (booking.showTime.time || "").match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeParts) {
          let h = parseInt(timeParts[1]), m = parseInt(timeParts[2]);
          if (timeParts[3]?.toUpperCase() === "PM" && h < 12) h += 12;
          if (timeParts[3]?.toUpperCase() === "AM" && h === 12) h = 0;
          d.setHours(h, m, 0, 0);
        }
        eventDateTime = d;
      } else if (event.eventType === "single" && event.singleDate) {
        eventDateTime = new Date(event.singleDate);
      } else if (event.eventType === "multi-day" && event.eventDates?.[0]?.date) {
        eventDateTime = new Date(event.eventDates[0].date);
      }
      if (eventDateTime) {
        const hoursUntilEvent = (eventDateTime - new Date()) / (1000 * 60 * 60);
        if (hoursUntilEvent < 2) {
          return res.status(400).json({ message: "Cancellation not allowed within 2 hours of the event." });
        }
        if (hoursUntilEvent < 0) {
          return res.status(400).json({ message: "Cannot cancel a past event." });
        }
      }

      // ── Restore seats ──
      if (event.eventType === "movie" && booking.cinema && booking.showDate && booking.showTime && booking.selectedSeats?.length) {
        for (const cs of event.cinemaShows) {
          if (cs.cinemaName === booking.cinema.cinemaName) {
            for (const sd of cs.showDates) {
              if (new Date(sd.date).toDateString() === new Date(booking.showDate.date).toDateString()) {
                for (const st of sd.showTimes) {
                  if (st.time === booking.showTime.time) {
                    st.availableSeats = (st.availableSeats || 0) + booking.selectedSeats.length;
                    if (st.bookedSeats) {
                      const seatNames = booking.selectedSeats.map(s => s.displayName);
                      st.bookedSeats = st.bookedSeats.filter(s => !seatNames.includes(s));
                    }
                  }
                }
              }
            }
          }
        }
        event.markModified("cinemaShows");
        event.availableSeats = (event.availableSeats || 0) + booking.selectedSeats.length;
      } else {
        event.availableSeats = (event.availableSeats || 0) + (booking.quantity || 1);
      }
      await event.save();
    }

    booking.status = "cancelled";
    await booking.save();
    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE remove cancelled booking ─────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.userId.toString() !== userId.toString()) return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "cancelled") return res.status(400).json({ message: "Only cancelled bookings can be deleted" });
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;