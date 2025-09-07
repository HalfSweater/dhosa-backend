// backend/db/seed-admin.js
// Usage: node db/seed-admin.js
const bcrypt = require('bcrypt');
const { createUser, getUserByEmail } = require('./db');

const ADMIN_EMAIL = 'samarmaharjan25@gmail.com';
const ADMIN_PASSWORD = 'p@ssword';
const ADMIN_USERNAME = 'admin';

(async () => {
  try {
    const existing = await getUserByEmail(ADMIN_EMAIL);
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const res = await createUser({ email: ADMIN_EMAIL, username: ADMIN_USERNAME, passwordHash: hash, isAdmin: 1 });
    console.log('Created admin with id', res.id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
