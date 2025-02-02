const admin = require("../config/firebase");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Get or create user
      let user = await User.findOne({ phoneNumber: decodedToken.phone_number });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Add user data to request
      req.user = { userId: user._id };
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = authMiddleware;
