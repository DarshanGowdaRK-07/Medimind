
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import chatRoutes from './routes/chat.js';

dotenv.config();
const app = express();
if (!process.env.JWT_SECRET) console.warn('WARNING: JWT_SECRET is not set. Using an insecure development secret. Set it in backend/.env.');
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 180 }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'MediMind API' }));
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong.' });
});
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`MediMind API running at http://localhost:${port}`));
