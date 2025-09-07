// backend/db/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'app.db'); // file: backend/db/app.db

const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      username TEXT,
      password TEXT,
      isAdmin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS command_builders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      command_template TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );
  `);
});

// Helper functions
function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id,email,username,isAdmin,created_at FROM users WHERE id = ?`, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function createUser({ email, username, passwordHash, isAdmin = 0 }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (email, username, password, isAdmin) VALUES (?, ?, ?, ?)`,
      [email, username, passwordHash, isAdmin],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

function listUsers() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id,email,username,isAdmin,created_at FROM users ORDER BY id DESC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function createCommandBuilder({ name, command_template, created_by }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO command_builders (name, command_template, created_by) VALUES (?, ?, ?)`,
      [name, command_template, created_by],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

function listCommandBuilders() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT cb.id, cb.name, cb.command_template, u.username as created_by_name, cb.created_at
            FROM command_builders cb
            LEFT JOIN users u ON cb.created_by = u.id
            ORDER BY cb.id DESC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  db,
  getUserByEmail,
  getUserById,
  createUser,
  listUsers,
  createCommandBuilder,
  listCommandBuilders,
  dbPath
};
