const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

const sessionMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies["access_token"];
    const refreshToken = req.cookies["refresh_token"];

    if (!accessToken) {
      return res.status(401).json({ message: "Access token not found" });
    }

    try {
      // Verify access token
      const decoded = verifyToken(accessToken);
      req.user = decoded;

      // Update last activity timestamp
      await User.findByIdAndUpdate(decoded.userId, {
        lastActivity: new Date(),
      });

      next();
    } catch (error) {
      // If access token is invalid/expired, try refresh token
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" });
      }

      try {
        const decoded = verifyToken(refreshToken);
        const user = await User.findById(decoded.userId);

        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        // Check if refresh token is in the user's valid tokens
        if (!user.refreshTokens.includes(refreshToken)) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }

        // Check session timeout
        const lastActivity = new Date(user.lastActivity).getTime();
        const currentTime = new Date().getTime();

        if (currentTime - lastActivity > SESSION_TIMEOUT) {
          // Remove the expired refresh token
          await User.findByIdAndUpdate(user._id, {
            $pull: { refreshTokens: refreshToken },
          });
          return res.status(401).json({ message: "Session expired" });
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        // Update refresh tokens in database
        await User.findByIdAndUpdate(user._id, {
          $pull: { refreshTokens: refreshToken },
          $push: { refreshTokens: newRefreshToken },
          lastActivity: new Date(),
        });

        // Set new cookies
        res.cookie("access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie("refresh_token", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        req.user = { userId: user._id };
        next();
      } catch (refreshError) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
    }
  } catch (error) {
    console.error("Session Middleware Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = sessionMiddleware;
