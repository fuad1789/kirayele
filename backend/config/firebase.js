const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require("./kirayele-7b052-firebase-adminsdk-fbsvc-4ed9ae3b5d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
