const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Event = require("../models/Event");
const { upload } = require("../config/cloudinary");

router.post("/", protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    console.log("\n🍕 ========== CREATE FOOD EVENT ==========");
    
    const { title, description, eventType, chefName, startDate, endDate, location, timing, totalSeats, price } = req.body;

    if (!title || !eventType || !chefName || !startDate || !endDate || !location || !timing || !totalSeats) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const eventData = {
      title: title.trim(),
      description: description ? description.trim() : "",
      category: "food",
      eventType: "single",
      singleDate: new Date(startDate),
      singleVenue: location,
      singleTotalSeats: parseInt(totalSeats),
      singlePrice: parseFloat(price || 0),
      singleShowTimes: [timing],
      availableSeats: parseInt(totalSeats),
      metadata: {
        foodType: eventType,
        chefName,
        endDate: new Date(endDate),
        timing
      }
    };

    if (req.file) {
      eventData.image = req.file.path;
      eventData.imagePublicId = req.file.filename;
    }

    const event = await Event.create(eventData);
    res.status(201).json({ success: true, message: "Food event created", event });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;