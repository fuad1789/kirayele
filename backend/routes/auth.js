const express = require("express");
const router = express.Router();
const admin = require("../config/firebase");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // For phone auth, we don't need to do anything on the backend for sending OTP
    // Firebase client SDK handles this
    res.json({ success: true });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

// Verify OTP and Register/Login User
router.post("/verify-otp", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        return res
          .status(400)
          .json({ message: "Phone number not found in token" });
      }

      // Check if user exists and has completed registration
      const user = await User.findOne({ phoneNumber });

      if (!user) {
        // Create a new user with just the phone number
        const newUser = new User({ phoneNumber });
        await newUser.save();
        return res.json({
          user: newUser,
          isRegistrationComplete: false,
        });
      }

      // Check if user has completed registration
      const isRegistrationComplete = !!(user.firstName && user.lastName);

      res.json({
        user,
        isRegistrationComplete,
      });
    } catch (verifyError) {
      console.error("Firebase verification error:", verifyError);
      return res.status(401).json({
        message: "Invalid ID token",
        details: verifyError.message,
      });
    }
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      message: "Error verifying OTP",
      details: error.message,
    });
  }
});

// Register user details
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const phoneNumber = req.user.phone_number;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "First name and last name are required" });
    }

    let user = await User.findOne({ phoneNumber });

    if (!user) {
      user = new User({
        phoneNumber,
        firstName,
        lastName,
      });
    } else {
      user.firstName = firstName;
      user.lastName = lastName;
    }

    await user.save();
    res.json({ user });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Get user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ phoneNumber: req.user.phone_number });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

module.exports = router;
