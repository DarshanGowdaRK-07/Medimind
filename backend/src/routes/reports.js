
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import auth from '../middleware/auth.js';
import { readDb, writeDb } from '../db.js';
import { extractText } from '../services/extract.js';
import { analyzeReport } from '../services/analyze.js';
const router = Router();
const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const allowed = new Set(['.pdf','.docx','.txt','.png','.jpg','.jpeg','.webp']);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage, limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => allowed.has(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(Object.assign(new Error('Unsupported file type. Upload PDF, DOCX, TXT, PNG, JPG or WEBP.'), { status: 400 }))
});
router.use(auth);
router.get('/', (req, res) => {
  const reports = readDb().reports.filter(r => r.userId === req.user.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ reports });
});
router.get('/:id', (req, res) => {
  const report = readDb().reports.find(r => r.id === req.params.id && r.userId === req.user.id);
  if (!report) return res.status(404).json({ message: 'Report not found.' });
  res.json({ report });
});
const uploadOne = (req, res, next) => upload.single('file')(req, res, err => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') err.message = 'File size must be 10 MB or less.';
  err.status = err.status || 400;
  next(err);
});
router.post('/analyze', uploadOne, async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a file to upload.' });
  try {
    const extractedText = await extractText(req.file);
    const analysis = await analyzeReport(extractedText);
    // Remove the uploaded original after extraction and analysis; only the report summary is retained.
    try { fs.unlinkSync(req.file.path); } catch {}
    const report = {
      id: uuid(), userId: req.user.id, fileName: req.file.originalname,
      createdAt: new Date().toISOString(), analysis, extractedPreview: extractedText.slice(0, 5000)
    };
    const db = readDb(); db.reports.push(report); writeDb(db);
    res.status(201).json({ report });
  } catch (error) {
    try { fs.unlinkSync(req.file.path); } catch {}
    next(error);
  }
});
router.delete('/:id', (req, res) => {
  const db = readDb();
  const before = db.reports.length;
  db.reports = db.reports.filter(r => !(r.id === req.params.id && r.userId === req.user.id));
  if (before === db.reports.length) return res.status(404).json({ message: 'Report not found.' });
  writeDb(db); res.json({ ok: true });
});
export default router;
