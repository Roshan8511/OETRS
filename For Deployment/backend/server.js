const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");
const movieRoutes = require("./routes/movieRoutes");
const musicRoutes = require("./routes/musicRoutes");
const sportsRoutes = require("./routes/sportsRoutes");
const educationRoutes = require("./routes/educationRoutes");
const businessRoutes = require("./routes/businessRoutes");
const techRoutes = require("./routes/techRoutes");
const foodRoutes = require("./routes/foodRoutes");
const artRoutes = require("./routes/artRoutes");
const otherRoutes = require("./routes/otherRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/sports", sportsRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/technology", techRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/art", artRoutes);
app.use("/api/other", otherRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Event Ticket API running" });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("📡 Category Routes:");
  console.log("   - POST /api/music");
  console.log("   - POST /api/movies");
  console.log("   - POST /api/sports");
  console.log("   - POST /api/education");
  console.log("   - POST /api/business");
  console.log("   - POST /api/technology");
  console.log("   - POST /api/food");
  console.log("   - POST /api/art");
  console.log("   - POST /api/other");
});