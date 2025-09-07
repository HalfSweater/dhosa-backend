// seed.js
import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.sqlite");

// Create users table and insert default admin
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      username TEXT,
      password TEXT,
      role TEXT
    )
  `);

  // Insert the default admin account
  db.run(
    `INSERT OR IGNORE INTO users (email, username, password, role)
     VALUES (?, ?, ?, ?)`,
    ["samarmaharjan25@gmail.com", "Admin", "p@ssword", "admin"],
    (err) => {
      if (err) {
        console.error("❌ Error inserting admin:", err.message);
      } else {
        console.log("✅ Admin account created or already exists!");
      }
    }
  );
});

db.close();

