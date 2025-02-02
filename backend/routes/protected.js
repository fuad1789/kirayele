const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Get user profile
router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

// Update user profile
router.put("/me", async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();
    res.json({ user });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Error updating user profile" });
  }
});

// Get user settings
router.get("/settings", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user settings
    res.json({
      settings: {
        role: user.role,
        devices: user.devices.filter((device) => device.isActive),
        lastActivity: user.lastActivity,
      },
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    res.status(500).json({ message: "Error fetching user settings" });
  }
});

module.exports = router;
