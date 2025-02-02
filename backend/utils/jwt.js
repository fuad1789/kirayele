const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// Read private and public keys
const privateKey = fs.readFileSync(
  path.join(__dirname, "../keys/private.key"),
  "utf8"
);
const publicKey = fs.readFileSync(
  path.join(__dirname, "../keys/public.key"),
  "utf8"
);

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, privateKey, {
    algorithm: "RS256",
    expiresIn: "15m", // 15 minutes
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, privateKey, {
    algorithm: "RS256",
    expiresIn: "7d", // 7 days
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
  } catch (error) {
    throw new Error("Invalid token");
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
