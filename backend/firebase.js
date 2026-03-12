const admin = require("firebase-admin");

const serviceAccount = require("./hackathon-27969-firebase-adminsdk-fbsvc-26f89cf605.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;