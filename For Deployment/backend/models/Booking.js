const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    quantity:    { type: Number, required: true, default: 1 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed"
    },
    // Seat info
    selectedSeats: [{
      id:           String,
      displayName:  String,
      category:     String,
      categoryName: String,
      row:          String,
      seatNumber:   Number,
      price:        Number
    }],
    // Movie show info
    cinema:   { type: Object, default: null },
    showDate: { type: Object, default: null },
    showTime: { type: Object, default: null },
    // Payment info
    transactionId: { type: String, default: null },
    paymentMethod: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);