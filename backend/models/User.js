const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: String,
    lastName: String,
    refreshTokens: [String], // Array of valid refresh tokens
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  // Reset login attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1,
        lockUntil: null,
      },
    });
  }
  // Otherwise increment login attempts
  const updates = { $inc: { loginAttempts: 1 } };
  // Lock the account if we've reached max attempts and haven't locked it yet
  if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000, // Lock for 2 hours
    };
  }
  return this.updateOne(updates);
};

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

const User = mongoose.model("User", userSchema);

module.exports = User;
