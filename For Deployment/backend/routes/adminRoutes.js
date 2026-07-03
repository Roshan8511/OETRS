const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const User    = require("../models/User");
const Event   = require("../models/Event");
const Booking = require("../models/Booking");

// Dashboard test
router.get("/dashboard", protect, adminOnly, (req, res) => {
  res.json({ message: "Welcome Admin" });
});

// All users
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// All bookings (for reference, kept lightweight)
router.get("/bookings", protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("eventId", "title eventType singleDate movieStartDate cinemaShows singleVenue")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Bookings for a specific event
router.get("/events/:id/bookings", protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({ eventId: req.params.id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// All bookings for a specific user
router.get("/users/:id/bookings", protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.id })
      .populate("eventId", "title eventType singleDate movieStartDate singleVenue cinemaShows image posterImage")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Summary stats
router.get("/summary", protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalBookings, revenueResult] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([{ $match: { status: "confirmed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }])
    ]);
    res.json({
      totalUsers, totalEvents, totalBookings,
      totalRevenue: revenueResult[0]?.total || 0
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// All events
router.get("/events", protect, adminOnly, async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete event
router.delete("/events/:id", protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;