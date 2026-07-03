const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Event = require("../models/Event");
const { upload } = require("../config/cloudinary");

router.post("/", protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    console.log("🎵 Creating Music Event:", req.body);
    
    const { title, description, startDate, endDate, location, timing, totalSeats, price, singerName } = req.body;

    const eventData = {
      title,
      description,
      category: "music",
      eventType: "single",
      singleDate: new Date(startDate),
      singleVenue: location,
      singleTotalSeats: parseInt(totalSeats),
      singlePrice: parseFloat(price),
      singleShowTimes: [timing],
      availableSeats: parseInt(totalSeats),
      metadata: { singerName, endDate: new Date(endDate), timing }
    };

    if (req.file) eventData.image = req.file.path;

    const event = await Event.create(eventData);
    res.status(201).json({ success: true, event });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;