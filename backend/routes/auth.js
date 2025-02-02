const express = require("express");
const router = express.Router();
const admin = require("../config/firebase");
const User = require("../models/User");
const { authLimiter } = require("../middleware/rateLimiter");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const axios = require("axios");

// reCAPTCHA verification function
const verifyRecaptcha = async (token) => {
  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );
    return response.data.success;
  } catch (error) {
    console.error("reCAPTCHA Error:", error);
    return false;
  }
};

// Apply rate limiter to all auth routes
router.use(authLimiter);

// Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { phoneNumber, recaptchaToken } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return res.status(400).json({ message: "Invalid reCAPTCHA" });
    }

    // Check if user exists and is not blocked
    const user = await User.findOne({ phoneNumber });
    if (user && user.isBlocked) {
      return res.status(403).json({ message: "Account is blocked" });
    }

    // Check if account is locked due to too many attempts
    if (user && user.isLocked()) {
      return res.status(403).json({ message: "Account is temporarily locked" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

// Verify OTP and Register/Login User
router.post("/verify-otp", async (req, res) => {
  try {
    const { idToken, recaptchaToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return res.status(400).json({ message: "Invalid reCAPTCHA" });
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        return res
          .status(400)
          .json({ message: "Phone number not found in token" });
      }

      // Find or create user
      let user = await User.findOne({ phoneNumber });

      if (!user) {
        // Create new user
        user = new User({ phoneNumber });
        await user.save();
      } else {
        // Reset login attempts on successful verification
        if (user.loginAttempts > 0) {
          await User.findByIdAndUpdate(user._id, {
            $set: { loginAttempts: 0, lockUntil: null },
          });
        }
      }

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      await User.findByIdAndUpdate(user._id, {
        $push: {
          refreshTokens: refreshToken,
        },
      });

      // Set secure cookies
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      const isRegistrationComplete = !!(user.firstName && user.lastName);
      res.json({
        user: {
          _id: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
        },
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
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

// Register user details
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, recaptchaToken } = req.body;
    const accessToken = req.cookies["access_token"];

    if (!accessToken) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return res.status(400).json({ message: "Invalid reCAPTCHA" });
    }

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "First name and last name are required" });
    }

    const decoded = verifyToken(accessToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    await user.save();

    res.json({ user });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user
    const user = await User.findOne({ phoneNumber: decodedToken.phone_number });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Error logging out" });
  }
});

// Get user's active devices
router.get("/devices", async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user
    const user = await User.findOne({ phoneNumber: decodedToken.phone_number });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ devices: user.devices.filter((device) => device.isActive) });
  } catch (error) {
    console.error("Get Devices Error:", error);
    res.status(500).json({ message: "Error fetching devices" });
  }
});

// Logout from other devices
router.post("/logout-others", async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    const currentDeviceId = req.body.deviceId;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user
    const user = await User.findOne({ phoneNumber: decodedToken.phone_number });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update all other devices to inactive
    await User.findOneAndUpdate(
      { phoneNumber: decodedToken.phone_number },
      {
        $set: {
          "devices.$[other].isActive": false,
        },
      },
      {
        arrayFilters: [{ "other.deviceId": { $ne: currentDeviceId } }],
      }
    );

    res.json({ message: "Logged out from other devices" });
  } catch (error) {
    console.error("Logout Others Error:", error);
    res.status(500).json({ message: "Error logging out from other devices" });
  }
});

module.exports = router;
