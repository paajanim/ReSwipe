import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/reswipe.db';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
// On the server JWT_SECRET comes from deploy/.env. The fallback is only for local testing.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- Database ----------
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Tables are created on the first start, after that nothing happens.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price TEXT NOT NULL,
    location TEXT,
    image TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    from_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Testdata for chats, only if the table is still empty.
if (db.prepare('SELECT COUNT(*) AS n FROM chats').get().n === 0) {
  const { lastInsertRowid } = db.prepare('INSERT INTO chats (name) VALUES (?)').run('Fyn');
  db.prepare('INSERT INTO messages (chat_id, from_name, text) VALUES (?, ?, ?)')
    .run(lastInsertRowid, 'Fyn', 'Hi! This is a test.');
}

// ---------- Express ----------
const app = express();

// This is used so that Express the API could read JSON data.
app.use(express.json());

// Uploaded images are reachable under /uploads/<filename>
app.use('/uploads', express.static(UPLOAD_DIR));

// Images are saved with a random name, so two uploads never overwrite each other.
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

const createToken = (user) =>
  jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

// Never send password_hash back to the app.
const publicUser = (user) => ({ id: user.id, username: user.username, email: user.email });

// Checks the header "Authorization: Bearer <token>". Afterwards req.user is the logged in user.
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Please log in first.' });
  }
}

const POST_SELECT = `
  SELECT posts.*, users.username FROM posts
  JOIN users ON users.id = posts.user_id
`;

const toPost = (row) => ({
  id: String(row.id),
  title: row.title,
  price: row.price,
  location: row.location,
  image: `/uploads/${row.image}`,
  username: row.username,
});

// POST /register  – Body: { username, email, password }
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body ?? {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, Mail and Password are required.' });
  }

  if (db.prepare('SELECT 1 FROM users WHERE email = ? OR username = ?').get(email, username)) {
    return res.status(409).json({ error: 'Mail or username is already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email, passwordHash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
  res.status(201).json({ token: createToken(user), user: publicUser(user) });
});

// POST /login  – Body: { email, password }  (email can also be the username)
app.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Mail and Password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Wrong Mail or Password.' });
  }

  res.json({ token: createToken(user), user: publicUser(user) });
});

// GET /posts  – all posts for the swipe screen, newest first
app.get('/posts', (req, res) => {
  const rows = db.prepare(`${POST_SELECT} ORDER BY posts.created_at DESC`).all();
  res.json(rows.map(toPost));
});

// GET /my-posts  – only the posts of the logged in user (for the profile)
app.get('/my-posts', auth, (req, res) => {
  const rows = db
    .prepare(`${POST_SELECT} WHERE posts.user_id = ? ORDER BY posts.created_at DESC`)
    .all(req.user.id);
  res.json(rows.map(toPost));
});

// POST /posts  – multipart form: title, price, location (optional), image (file)
app.post('/posts', auth, upload.single('image'), (req, res) => {
  const { title, price, location } = req.body ?? {};

  if (!title || !price || !req.file) {
    return res.status(400).json({ error: 'Title, price and image are required.' });
  }

  const { lastInsertRowid } = db
    .prepare('INSERT INTO posts (user_id, title, price, location, image) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, title, price, location || null, req.file.filename);

  const row = db.prepare(`${POST_SELECT} WHERE posts.id = ?`).get(lastInsertRowid);
  res.status(201).json(toPost(row));
});

// GET /chats  – list of all chats with only the last message (for the chat list)
app.get('/chats', (req, res) => {
  const rows = db.prepare(`
    SELECT chats.id, chats.name,
      (SELECT text FROM messages WHERE chat_id = chats.id ORDER BY id DESC LIMIT 1) AS lastMessage
    FROM chats
  `).all();

  res.json(rows.map((c) => ({ id: String(c.id), name: c.name, lastMessage: c.lastMessage ?? '' })));
});

// GET /chats/:id  – one chat with all messages (for the chat screen)
app.get('/chats/:id', (req, res) => {
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(req.params.id);

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found.' });
  }

  const messages = db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY id').all(chat.id);

  res.json({
    id: String(chat.id),
    name: chat.name,
    messages: messages.map((m) => ({ id: String(m.id), from: m.from_name, text: m.text })),
  });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
