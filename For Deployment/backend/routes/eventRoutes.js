const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Event = require("../models/Event");
const { upload } = require("../config/cloudinary");

// Safe upload wrapper — if Cloudinary fails, continue without image instead of crashing
const safeUpload = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("⚠️ Image upload failed:", err.message, "| code:", err.code || "none");
      req.file = null;
      req._imageUploadError = err.message; // pass error message to route handler
      next();
    } else {
      next();
    }
  });
};

// ============ PUBLIC ROUTES ============

// Get all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    console.log(`📊 Found ${events.length} events`);
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get single event
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(400).json({ message: "Invalid event ID" });
  }
});

// ============ ADMIN CREATE EVENT ============
router.post("/", protect, adminOnly, safeUpload, async (req, res) => {
  try {
    console.log("\n🎬 ========== CREATE EVENT ==========");
    console.log("📁 File received:", req.file ? req.file.path : "No file");
    console.log("📝 Body keys:", Object.keys(req.body));

    const { title, description, category, eventType } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!category) return res.status(400).json({ message: "Category is required" });
    if (!eventType) return res.status(400).json({ message: "Event type is required" });

    const eventData = {
      title: title.trim(),
      description: description ? description.trim() : "",
      category,
      eventType,
      organizer: req.user.id,
      status: "published"
    };

    // Save image if upload succeeded
    // multer-storage-cloudinary v3 uses req.file.path; v4 may use req.file.secure_url
    if (req.file) {
      const imageUrl = req.file.path || req.file.secure_url || "";
      eventData.image = imageUrl;
      eventData.posterImage = imageUrl;
      eventData.imagePublicId = req.file.filename || req.file.public_id || "";
      console.log("✅ Image saved:", imageUrl);
    }

    // Handle location — express extended:true parses location[city] as location.city
    if (req.body.location && typeof req.body.location === "object") {
      eventData.location = {
        city: req.body.location.city || "",
        state: req.body.location.state || "",
        country: req.body.location.country || "India",
        fullAddress: req.body.location.fullAddress || ""
      };
    } else {
      eventData.location = { city: "", state: "", country: "India", fullAddress: "" };
    }

    // ── SINGLE EVENT ──
    if (eventType === "single") {
      const { singleDate, singleVenue, singleTotalSeats, singlePrice, singleShowTimes } = req.body;

      if (!singleDate || !singleVenue || !singleTotalSeats || !singlePrice) {
        return res.status(400).json({ message: "All single event fields are required" });
      }

      const totalSeats = parseInt(singleTotalSeats) || 100;
      const price = parseFloat(singlePrice) || 0;
      const venueName = typeof singleVenue === "string" ? singleVenue.trim() : singleVenue;

      eventData.singleDate = new Date(singleDate);
      // singleVenue schema is { name, location } — store name string in name field
      eventData.singleVenue = { name: venueName, location: {} };
      eventData.singleTotalSeats = totalSeats;
      eventData.singlePrice = price;

      // FIX: singleShowTimes must be objects with required fields, not plain strings
      if (singleShowTimes && singleShowTimes.trim()) {
        eventData.singleShowTimes = singleShowTimes.split(",").map((t) => ({
          time: t.trim(),
          price: price,
          totalSeats: totalSeats,
          availableSeats: totalSeats,
          bookedSeats: []
        }));
      } else {
        eventData.singleShowTimes = [{
          time: "TBA",
          price: price,
          totalSeats: totalSeats,
          availableSeats: totalSeats,
          bookedSeats: []
        }];
      }

      // Legacy fields
      eventData.startDate = new Date(singleDate);
      eventData.endDate = new Date(singleDate);
      eventData.venue = { name: venueName, address: venueName, city: eventData.location.city || venueName, country: "India" };
      eventData.totalSeats = totalSeats;
      eventData.availableSeats = totalSeats;
      eventData.price = price;
      eventData.timing = singleShowTimes || "TBA";
    }

    // ── MOVIE EVENT ──
    else if (eventType === "movie") {
      const { movieStartDate, movieEndDate, cinemaShows } = req.body;

      if (!movieStartDate || !movieEndDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      eventData.movieStartDate = new Date(movieStartDate);
      eventData.movieEndDate = new Date(movieEndDate);

      let parsedCinemas = [];
      if (cinemaShows && cinemaShows !== "undefined" && cinemaShows !== "null") {
        try {
          parsedCinemas = JSON.parse(cinemaShows);
          console.log("✅ Cinema shows parsed:", parsedCinemas.length);
        } catch (e) {
          console.log("⚠️ Failed to parse cinemaShows:", e.message);
          parsedCinemas = [];
        }
      }

      eventData.cinemaShows = parsedCinemas.map((cinema) => ({
        cinemaName: cinema.cinemaName || "",
        location: cinema.location
          ? (typeof cinema.location === "string"
              ? { city: cinema.location, state: "", country: "India", fullAddress: cinema.location }
              : cinema.location)
          : { city: "", state: "", country: "India", fullAddress: "" },
        showDates: (cinema.showDates || []).map((sd) => ({
          date: new Date(sd.date),
          cancellationPolicy: sd.cancellationPolicy || "non-cancellable",
          showTimes: (sd.showTimes || []).map((st) => ({
            time: st.time || "TBA",
            price: Number(st.price) || 0,
            totalSeats: Number(st.availableSeats || st.totalSeats) || 100,
            availableSeats: Number(st.availableSeats || st.totalSeats) || 100,
            bookedSeats: []
          }))
        }))
      }));

      let totalSeats = 0;
      eventData.cinemaShows.forEach((c) =>
        c.showDates.forEach((sd) =>
          sd.showTimes.forEach((st) => { totalSeats += st.totalSeats; })
        )
      );

      eventData.startDate = new Date(movieStartDate);
      eventData.endDate = new Date(movieEndDate);
      eventData.totalSeats = totalSeats || 500;
      eventData.availableSeats = totalSeats || 500;
      eventData.price = parsedCinemas[0]?.showDates?.[0]?.showTimes?.[0]?.price || 200;
    }

    // ── MULTI-DAY EVENT ──
    else if (eventType === "multi-day") {
      const { eventDates } = req.body;

      let parsedDates = [];
      if (eventDates && eventDates !== "undefined" && eventDates !== "null") {
        try {
          parsedDates = JSON.parse(eventDates);
          console.log("✅ Event dates parsed:", parsedDates.length);
        } catch (e) {
          console.log("⚠️ Failed to parse eventDates:", e.message);
          parsedDates = [];
        }
      }

      let totalSeats = 0;
      let minPrice = Infinity;

      eventData.eventDates = parsedDates.map((ed) => {
        const dateSeats = parseInt(ed.totalSeats) || 0;
        const datePrice = parseFloat(ed.price) || 0;
        totalSeats += dateSeats;
        if (datePrice > 0) minPrice = Math.min(minPrice, datePrice);

        return {
          date: new Date(ed.date),
          venue: ed.venue
            ? { name: typeof ed.venue === "string" ? ed.venue : ed.venue.name || "", location: {} }
            : { name: "", location: {} },
          totalSeats: dateSeats,
          price: datePrice,
          showTimes: (ed.showTimes || []).map((st) => ({
            time: st.time || "TBA",
            price: datePrice,
            totalSeats: dateSeats,
            availableSeats: dateSeats,
            bookedSeats: []
          }))
        };
      });

      if (parsedDates.length > 0) {
        eventData.startDate = new Date(parsedDates[0].date);
        eventData.endDate = new Date(parsedDates[parsedDates.length - 1].date);
        const firstVenue = typeof parsedDates[0].venue === "string" ? parsedDates[0].venue : parsedDates[0].venue?.name || "";
        eventData.venue = { name: firstVenue, address: firstVenue, city: eventData.location.city || firstVenue, country: "India" };
      }

      eventData.totalSeats = totalSeats;
      eventData.availableSeats = totalSeats;
      eventData.price = minPrice !== Infinity ? minPrice : 0;
    }

    console.log("\n💾 Saving event to database...");
    const event = await Event.create(eventData);

    console.log("✅ Event created successfully!");
    console.log("   ID:", event._id, "| Title:", event.title, "| Type:", event.eventType);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
      imageUploaded: !!req.file,
      imageUploadError: req._imageUploadError || null
    });

  } catch (error) {
    console.error("\n❌ CREATE EVENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create event"
    });
  }
});

// ============ ADMIN UPDATE EVENT ============
router.put("/:id", protect, adminOnly, safeUpload, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const {
      title, description, category,
      singleDate, singleVenue, singleTotalSeats, singlePrice, singleShowTimes,
      movieStartDate, movieEndDate, cinemaShows,
      eventDates
    } = req.body;

    const updateData = {};

    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category) updateData.category = category;

    // Image
    if (req.file) {
      const imageUrl = req.file.path || req.file.secure_url || "";
      updateData.image = imageUrl;
      updateData.posterImage = imageUrl;
      updateData.imagePublicId = req.file.filename || req.file.public_id || "";
    }

    // Location update
    if (req.body.location && typeof req.body.location === "object") {
      updateData.location = {
        city: req.body.location.city || event.location?.city || "",
        state: req.body.location.state || event.location?.state || "",
        country: req.body.location.country || event.location?.country || "India",
        fullAddress: req.body.location.fullAddress || event.location?.fullAddress || ""
      };
    }

    const type = event.eventType;

    // ── Single event updates ──
    if (type === "single") {
      if (singleDate) {
        updateData.singleDate = new Date(singleDate);
        updateData.startDate = new Date(singleDate);
        updateData.endDate = new Date(singleDate);
      }
      if (singleVenue) {
        const venueName = typeof singleVenue === "string" ? singleVenue.trim() : singleVenue;
        updateData.singleVenue = { name: venueName, location: {} };
        updateData.venue = { name: venueName, address: venueName, city: venueName, country: "India" };
      }

      if (singleTotalSeats) {
        const seats = parseInt(singleTotalSeats);
        updateData.singleTotalSeats = seats;
        updateData.totalSeats = seats;
        // FIX: also update availableSeats so admin dashboard reflects the change
        updateData.availableSeats = seats;

        const price = parseFloat(singlePrice) || event.singlePrice || 0;
        if (singleShowTimes && singleShowTimes.trim()) {
          updateData.singleShowTimes = singleShowTimes.split(",").map((t) => ({
            time: t.trim(),
            price: price,
            totalSeats: seats,
            availableSeats: seats,
            bookedSeats: []
          }));
        } else if (event.singleShowTimes && event.singleShowTimes.length > 0) {
          updateData.singleShowTimes = event.singleShowTimes.map((st) => ({
            time: typeof st === "object" ? st.time : st,
            price: price,
            totalSeats: seats,
            availableSeats: seats,
            bookedSeats: st.bookedSeats || []
          }));
        }
      }

      if (singlePrice) {
        updateData.singlePrice = parseFloat(singlePrice);
        updateData.price = parseFloat(singlePrice);
      }

      if (singleShowTimes && !singleTotalSeats) {
        const seats = event.singleTotalSeats || event.totalSeats || 100;
        const price = parseFloat(singlePrice) || event.singlePrice || 0;
        updateData.singleShowTimes = singleShowTimes.split(",").map((t) => ({
          time: t.trim(),
          price: price,
          totalSeats: seats,
          availableSeats: seats,
          bookedSeats: []
        }));
      }
    }

    // ── Movie event updates ──
    else if (type === "movie") {
      if (movieStartDate) { updateData.movieStartDate = new Date(movieStartDate); updateData.startDate = new Date(movieStartDate); }
      if (movieEndDate) { updateData.movieEndDate = new Date(movieEndDate); updateData.endDate = new Date(movieEndDate); }
      if (cinemaShows && cinemaShows !== "undefined") {
        try {
          const parsed = JSON.parse(cinemaShows);
          updateData.cinemaShows = parsed.map((cinema) => ({
            cinemaName: cinema.cinemaName || "",
            location: cinema.location
              ? (typeof cinema.location === "string"
                  ? { city: cinema.location, state: "", country: "India", fullAddress: cinema.location }
                  : cinema.location)
              : { city: "", state: "", country: "India", fullAddress: "" },
            showDates: (cinema.showDates || []).map((sd) => ({
              date: new Date(sd.date),
              cancellationPolicy: sd.cancellationPolicy || "non-cancellable",
              showTimes: (sd.showTimes || []).map((st) => ({
                time: st.time || "TBA",
                price: Number(st.price) || 0,
                totalSeats: Number(st.availableSeats || st.totalSeats) || 100,
                availableSeats: Number(st.availableSeats || st.totalSeats) || 100,
                bookedSeats: st.bookedSeats || []
              }))
            }))
          }));

          let totalSeats = 0;
          updateData.cinemaShows.forEach((c) =>
            c.showDates.forEach((sd) =>
              sd.showTimes.forEach((st) => { totalSeats += st.totalSeats; })
            )
          );
          updateData.totalSeats = totalSeats;
          updateData.availableSeats = totalSeats;
        } catch (e) {
          console.log("⚠️ Failed to parse cinemaShows for update:", e.message);
        }
      }
    }

    // ── Multi-day event updates ──
    else if (type === "multi-day") {
      if (eventDates && eventDates !== "undefined") {
        try {
          const parsed = JSON.parse(eventDates);
          let totalSeats = 0;
          let minPrice = Infinity;

          updateData.eventDates = parsed.map((ed) => {
            const dateSeats = parseInt(ed.totalSeats) || 0;
            const datePrice = parseFloat(ed.price) || 0;
            totalSeats += dateSeats;
            if (datePrice > 0) minPrice = Math.min(minPrice, datePrice);

            return {
              date: new Date(ed.date),
              venue: ed.venue
                ? { name: typeof ed.venue === "string" ? ed.venue : ed.venue.name || "", location: {} }
                : { name: "", location: {} },
              totalSeats: dateSeats,
              price: datePrice,
              showTimes: (ed.showTimes || []).map((st) => ({
                time: st.time || "TBA",
                price: datePrice,
                totalSeats: dateSeats,
                availableSeats: dateSeats,
                bookedSeats: st.bookedSeats || []
              }))
            };
          });

          updateData.totalSeats = totalSeats;
          // FIX: update availableSeats so admin dashboard shows the correct number
          updateData.availableSeats = totalSeats;
          updateData.price = minPrice !== Infinity ? minPrice : 0;

          if (parsed.length > 0) {
            updateData.startDate = new Date(parsed[0].date);
            updateData.endDate = new Date(parsed[parsed.length - 1].date);
          }
        } catch (e) {
          console.log("⚠️ Failed to parse eventDates for update:", e.message);
        }
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    );

    console.log("✅ Event updated:", updatedEvent._id, "| availableSeats:", updatedEvent.availableSeats);
    res.json({ success: true, message: "Event updated", event: updatedEvent });

  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: error.message });
  }
});

// ============ ADMIN DELETE EVENT ============
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
