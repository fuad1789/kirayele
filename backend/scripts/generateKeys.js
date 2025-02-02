const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Create keys directory if it doesn't exist
const keysDir = path.join(__dirname, "../keys");
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir);
}

// Generate key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

// Write keys to files
fs.writeFileSync(path.join(keysDir, "private.key"), privateKey);
fs.writeFileSync(path.join(keysDir, "public.key"), publicKey);

console.log("RSA key pair generated successfully!");
console.log("Location:", keysDir);
