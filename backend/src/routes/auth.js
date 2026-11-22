
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { readDb, writeDb } from '../db.js';
import auth from '../middleware/auth.js';
const router = Router();
const tokenFor = user => jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'development-only-secret', { expiresIn: '7d' });
router.post('/signup', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8)
    return res.status(400).json({ message: 'Enter a name, valid email and password of at least 8 characters.' });
  const db = readDb();
  if (db.users.some(u => u.email === email)) return res.status(409).json({ message: 'An account with this email already exists.' });
  const user = { id: uuid(), name, email, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date().toISOString() };
  db.users.push(user); writeDb(db);
  res.status(201).json({ token: tokenFor(user), user: { id: user.id, name, email } });
});
router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = readDb().users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: 'Incorrect email or password.' });
  res.json({ token: tokenFor(user), user: { id: user.id, name: user.name, email: user.email } });
});
router.get('/me', auth, (req, res) => {
  const user = readDb().users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});
export default router;
