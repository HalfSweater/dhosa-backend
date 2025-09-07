// backend/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const {
  getUserByEmail,
  getUserById,
  createUser,
  listUsers,
  createCommandBuilder,
  listCommandBuilders
} = require('./db/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const PORT = process.env.PORT || 5000;

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));

// Helpers
function signUserToken(user) {
  // minimal payload
  return jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '8h' });
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.id);
    if (!user) return res.status(401).json({ error: 'Invalid user' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// public: login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signUserToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, username: user.username, isAdmin: user.isAdmin }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// protected: create account (admin-only)
app.post('/api/admin/create-account', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  const { email, username, password, isAdmin } = req.body || {};
  if (!email || !username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await createUser({ email, username, passwordHash: hash, isAdmin: isAdmin ? 1 : 0 });
    res.json({ ok: true, id: result.id });
  } catch (err) {
    console.error(err);
    if (err && err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// protected: list users (admin only)
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  const users = await listUsers();
  res.json({ users });
});

// protected: create command builder (admin or admin-only? -> allow admin only as requested)
app.post('/api/admin/command-builder', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  const { name, command } = req.body || {};
  if (!name || !command) return res.status(400).json({ error: 'Missing fields' });
  try {
    const resdb = await createCommandBuilder({ name, command_template: command, created_by: req.user.id });
    res.json({ ok: true, id: resdb.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// public: list command templates (for frontend to choose)
app.get('/api/command-builders', authMiddleware, async (req, res) => {
  // allow any logged-in user to fetch list
  const list = await listCommandBuilders();
  res.json({ list });
});

// public: minecraft server check (proxies to api.mcsrvstat.us)
app.get('/api/mcserver/:address', authMiddleware, async (req, res) => {
  // require login to use checker
  const address = req.params.address;
  if (!address) return res.status(400).json({ error: 'No address' });
  try {
    const API = `https://api.mcsrvstat.us/3/${encodeURIComponent(address)}`;
    const r = await fetch(API);
    const json = await r.json();
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// profile endpoint
app.get('/api/profile', authMiddleware, async (req, res) => {
  const user = await getUserById(req.user.id);
  res.json({ user });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
