const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Event = require("../models/Event");
const { upload } = require("../config/cloudinary");

// ============ CREATE MOVIE EVENT ============
router.post("/", protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    console.log("\n🎬 ========== CREATE MOVIE EVENT ==========");
    console.log("🎬 Request received at:", new Date().toISOString());
    console.log("📁 File received:", req.file ? req.file.path : "No file");

    const { title, description, category, movieStartDate, movieEndDate, cinemaShows } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!movieStartDate || !movieEndDate) return res.status(400).json({ message: "Start date and end date are required" });
    if (!cinemaShows) return res.status(400).json({ message: "Cinema shows data is required" });

    const eventData = {
      title: title.trim(),
      description: description ? description.trim() : "",
      category: "movies",
      eventType: "movie",
      movieStartDate: new Date(movieStartDate),
      movieEndDate: new Date(movieEndDate),
      organizer: req.user.id,
    };

    // ✅ FIX 1: Save BOTH image fields so all display pages can find the URL
    if (req.file) {
      eventData.image = req.file.path;           // Cloudinary HTTPS URL
      eventData.posterImage = req.file.path;     // ← was missing before
      eventData.imagePublicId = req.file.filename;
      console.log("✅ Image saved:", eventData.image);
    } else {
      console.log("⚠️ No image uploaded");
    }

    let parsedCinemas;
    try {
      parsedCinemas = typeof cinemaShows === 'string' ? JSON.parse(cinemaShows) : cinemaShows;
    } catch (e) {
      console.error("❌ Failed to parse cinemaShows:", e.message);
      return res.status(400).json({ message: "Invalid cinema shows data format" });
    }

    // ✅ FIX 2: Cast price to Number so Mongoose doesn't reject the payload
    const processedCinemas = parsedCinemas.map(cinema => ({
      cinemaName: cinema.cinemaName || "",
      location: cinema.location || "",
      showDates: (cinema.showDates || []).map(showDate => ({
        date: new Date(showDate.date),
        cancellationPolicy: showDate.cancellationPolicy || "non-cancellable",
        showTimes: (showDate.showTimes || []).map(showTime => ({
          time: showTime.time || "",
          price: Number(showTime.price) || 100,   // ← guaranteed Number
          availableSeats: 100
        }))
      }))
    }));

    eventData.cinemaShows = processedCinemas;

    let totalSeats = 0;
    eventData.cinemaShows.forEach(cinema => {
      cinema.showDates.forEach(showDate => {
        totalSeats += showDate.showTimes.length * 100;
      });
    });
    eventData.availableSeats = totalSeats;
    eventData.startDate = new Date(movieStartDate);
    eventData.endDate = new Date(movieEndDate);

    console.log("💾 Saving movie to database...");
    const event = await Event.create(eventData);
    console.log("✅ Movie created! ID:", event._id, "| Image:", event.image || "none");

    res.status(201).json({ success: true, message: "Movie event created successfully", event });

  } catch (error) {
    console.error("\n❌ CREATE MOVIE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message || "Failed to create movie event" });
  }
});

// Get all movies
router.get("/", async (req, res) => {
  try {
    const movies = await Event.find({ eventType: "movie" }).sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single movie
router.get("/:id", async (req, res) => {
  try {
    const movie = await Event.findOne({ _id: req.params.id, eventType: "movie" });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (error) {
    res.status(400).json({ message: "Invalid movie ID" });
  }
});

module.exports = router;