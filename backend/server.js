const express = require("express");
const cors = require("cors");
const db = require("./firebase");

const app = express();
const PORT = process.env.PORT || 5000;

// Use modern cors and express to avoid _headers deprecation warnings
app.use(cors());
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("CodeTrace Backend is running...");
});

// Example route for fetching scans (if applicable)
app.get("/api/scans", async (req, res) => {
  try {
    const snapshot = await db.collection("scans").get();
    const scans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(scans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
