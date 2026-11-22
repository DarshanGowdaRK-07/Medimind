
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '../data');
const dbFile = path.join(dataDir, 'db.json');
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({ users: [], reports: [], conversations: [] }, null, 2));
export function readDb() {
  try { const db = JSON.parse(fs.readFileSync(dbFile, 'utf8')); db.users ||= []; db.reports ||= []; db.conversations ||= []; return db; }
  catch { return { users: [], reports: [], conversations: [] }; }
}
export function writeDb(db) {
  const temp = `${dbFile}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db, null, 2));
  fs.renameSync(temp, dbFile);
}
