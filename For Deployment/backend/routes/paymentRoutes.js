const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Event = require("../models/Event");

// Initialize mock payment
router.post("/initiate", protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id || req.user._id;

    console.log("Initiating payment for:", { bookingId, userId });

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate("eventId");

    if (!booking) {
      console.log("Booking not found:", bookingId);
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if booking belongs to user
    if (booking.userId.toString() !== userId.toString()) {
      console.log("Unauthorized: User mismatch");
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if already paid
    const existingPayment = await Payment.findOne({ 
      bookingId, 
      paymentStatus: "success" 
    });
    
    if (existingPayment) {
      console.log("Payment already completed for booking:", bookingId);
      return res.status(400).json({ message: "Payment already completed" });
    }

    // Create payment record
    const payment = await Payment.create({
      bookingId,
      userId,
      amount: booking.totalAmount,
      paymentMethod: "mock",
      paymentStatus: "pending",
      mockPayment: true
    });

    console.log("Payment initiated successfully:", payment._id);

    res.json({
      success: true,
      message: "Payment initiated",
      payment: {
        id: payment._id,
        amount: payment.amount,
        bookingId: booking._id,
        eventName: booking.eventId.title,
        quantity: booking.quantity
      }
    });

  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Process mock payment (simulate success/failure)
router.post("/process/:paymentId", protect, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { simulateSuccess } = req.body;
    const userId = req.user.id || req.user._id;

    console.log("Processing payment:", { 
      paymentId, 
      simulateSuccess, 
      userId 
    });

    const payment = await Payment.findById(paymentId)
      .populate("bookingId");

    if (!payment) {
      console.log("Payment not found:", paymentId);
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== userId.toString()) {
      console.log("Unauthorized payment access");
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (payment.paymentStatus !== "pending") {
      console.log("Payment already processed. Status:", payment.paymentStatus);
      return res.status(400).json({ 
        message: `Payment already ${payment.paymentStatus}` 
      });
    }

    if (simulateSuccess) {
      // Simulate successful payment
      payment.paymentStatus = "success";
      payment.transactionId = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      payment.paymentDate = new Date();
      
      await payment.save();

      console.log("Payment successful:", payment.transactionId);

      res.json({
        success: true,
        message: "Payment successful!",
        payment: {
          id: payment._id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          status: payment.paymentStatus
        }
      });
    } else {
      // Simulate failed payment
      payment.paymentStatus = "failed";
      await payment.save();

      console.log("Payment failed");

      res.status(400).json({
        success: false,
        message: "Payment failed. Please try again.",
        payment: {
          id: payment._id,
          status: payment.paymentStatus
        }
      });
    }

  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get payment status
router.get("/status/:bookingId", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id || req.user._id;
    
    const payment = await Payment.findOne({ bookingId })
      .sort({ createdAt: -1 });

    if (!payment) {
      return res.json({ 
        paymentStatus: "none",
        message: "No payment found for this booking" 
      });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({
      paymentStatus: payment.paymentStatus,
      amount: payment.amount,
      transactionId: payment.transactionId,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod
    });

  } catch (error) {
    console.error("Payment status error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;