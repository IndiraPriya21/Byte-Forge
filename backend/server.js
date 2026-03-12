const express = require("express");
const cors = require("cors");
const db = require("./firebase");

const app = express();
const PORT = process.env.PORT || 5000;

// Use modern cors and express to avoid _headers deprecation warnings
app.use(cors());
app.use(express.json());

const usersCollection = db.collection("users");
const scansCollection = db.collection("scans");
const libraryCollection = db.collection("library");

function sanitizeUser(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    createdAt: data.createdAt,
  };
}

app.get("/", (req, res) => {
  res.send("CodeTrace Backend is running...");
});

// User APIs
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, username, role, password } = req.body;

    if (!name || !email || !username || !role || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emailLower = email.trim().toLowerCase();
    const usernameLower = username.trim().toLowerCase();

    const existing = await usersCollection
      .where("email", "==", emailLower)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const existingUsername = await usersCollection
      .where("username", "==", usernameLower)
      .get();

    if (!existingUsername.empty) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const newUser = {
      name: name.trim(),
      email: emailLower,
      username: usernameLower,
      role: role.trim(),
      password: password.trim(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await usersCollection.add(newUser);
    const newUserDoc = await docRef.get();

    res.status(201).json({ user: sanitizeUser(newUserDoc) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { identifier, role, password } = req.body;

    if (!identifier || !role || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const identifierLower = identifier.trim().toLowerCase();
    const roleLower = role.trim().toLowerCase();

    const snapshot = await usersCollection
      .where("role", "==", roleLower)
      .get();

    const userDoc = snapshot.docs.find((doc) => {
      const data = doc.data();
      const email = (data.email || "").toLowerCase();
      const username = (data.username || "").toLowerCase();
      return (identifierLower === email || identifierLower === username) && data.password === password;
    });

    if (!userDoc) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ user: sanitizeUser(userDoc) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Scans API
app.get("/api/scans", async (req, res) => {
  try {
    const { userId } = req.query;
    let query = scansCollection.orderBy("createdAt", "desc");

    if (userId) {
      query = query.where("userId", "==", userId);
    }

    const snapshot = await query.get();
    const scans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(scans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/scans", async (req, res) => {
  try {
    const { userId, text, similarity, topSources } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newScan = {
      userId,
      text,
      similarity: similarity || 0,
      topSources: topSources || [],
      createdAt: new Date().toISOString(),
    };

    const docRef = await scansCollection.add(newScan);
    const doc = await docRef.get();

    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Library / submissions
app.get("/api/library", async (req, res) => {
  try {
    const { userId } = req.query;
    let query = libraryCollection.orderBy("createdAt", "desc");

    if (userId) {
      query = query.where("userId", "==", userId);
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/library", async (req, res) => {
  try {
    const { userId, title, text } = req.body;
    if (!userId || !title || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newItem = {
      userId,
      title,
      text,
      createdAt: new Date().toISOString(),
    };

    const docRef = await libraryCollection.add(newItem);
    const doc = await docRef.get();

    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
