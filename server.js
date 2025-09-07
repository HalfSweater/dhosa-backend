// server.js
import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "https://your-frontend.vercel.app"], // Add your frontend URL
  methods: ["GET","POST"],
  credentials: true
}));
app.use(bodyParser.json());

// Connect SQLite
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("Connected to SQLite DB");
});

// Initialize users table (if not exists)
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT,
    password TEXT,
    role TEXT
  )
`);

// ====== LOGIN ROUTE ======
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ success: false, message: "Missing fields" });

  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, row) => {
      if (err) return res.json({ success: false, message: err.message });
      if (!row) return res.json({ success: false, message: "Invalid credentials" });

      // Return a simple token (can be replaced with JWT later)
      res.json({ success: true, token: "loggedin", role: row.role, username: row.username });
    }
  );
});

// ====== PROFILE ROUTE ======
app.get("/profile", (req, res) => {
  // Normally you'd verify token, for now just return demo profile
  const token = req.headers["authorization"]?.split(" ")[1];
  if (token !== "loggedin") return res.json({ success: false, message: "Invalid token" });

  res.json({
    success: true,
    profile: {
      email: "samarmaharjan25@gmail.com",
      username: "admin",
      role: "admin"
    }
  });
});

// ====== ADMIN PAGE - CREATE ACCOUNT ======
app.post("/admin/create-user", (req, res) => {
  const { email, username, password, role } = req.body;
  if (!email || !username || !password || !role) {
    return res.json({ success: false, message: "Missing fields" });
  }

  db.run(
    "INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)",
    [email, username, password, role],
    function(err) {
      if (err) return res.json({ success: false, message: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ====== CATCH ALL ======
app.get("*", (req, res) => {
  res.send("Backend running. Use frontend to access routes.");
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
