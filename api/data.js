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

// The first version had chats without users (only test data). Remove those tables,
// they are created again below in the new form (chat = buyer + seller + post).
const chatColumns = db.prepare('PRAGMA table_info(chats)').all().map((c) => c.name);
if (chatColumns.length > 0 && !chatColumns.includes('buyer_id')) {
  db.exec('DROP TABLE IF EXISTS messages; DROP TABLE IF EXISTS chats;');
}

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

  -- A chat is created when a user (buyer) likes a post. One chat per post and buyer.
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, buyer_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Columns added after the first version. ALTER TABLE fails if the column exists, so check first.
const userColumns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
if (!userColumns.includes('avatar')) {
  db.exec('ALTER TABLE users ADD COLUMN avatar TEXT');
}

// Deleted posts stay in the table (deleted = 1), so chats about them keep working.
const postColumns = db.prepare('PRAGMA table_info(posts)').all().map((c) => c.name);
if (!postColumns.includes('deleted')) {
  db.exec('ALTER TABLE posts ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0');
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
    filename: (_req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

const createToken = (user) =>
  jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

// Never send password_hash back to the app.
const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  avatar: user.avatar ? `/uploads/${user.avatar}` : null,
});

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

// GET /me  – the logged in user
app.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    return res.status(401).json({ error: 'Please log in first.' });
  }

  res.json(publicUser(user));
});

// PUT /me/avatar  – multipart form: image (file). Replaces the profile picture.
app.put('/me/avatar', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image is required.' });
  }

  const old = db.prepare('SELECT avatar FROM users WHERE id = ?').get(req.user.id);
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(req.file.filename, req.user.id);

  // Remove the old picture, it is not used anymore.
  if (old?.avatar) {
    fs.rm(path.join(UPLOAD_DIR, old.avatar), { force: true }, () => {});
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(publicUser(user));
});

// GET /posts  – all posts for the swipe screen, newest first
app.get('/posts', (_req, res) => {
  const rows = db.prepare(`${POST_SELECT} WHERE posts.deleted = 0 ORDER BY posts.created_at DESC`).all();
  res.json(rows.map(toPost));
});

// GET /my-posts  – only the posts of the logged in user (for the profile)
app.get('/my-posts', auth, (req, res) => {
  const rows = db
    .prepare(`${POST_SELECT} WHERE posts.user_id = ? AND posts.deleted = 0 ORDER BY posts.created_at DESC`)
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

// Returns the post only if it belongs to the user and is not deleted.
const findOwnPost = (postId, userId) =>
  db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ? AND deleted = 0').get(postId, userId);

// PUT /posts/:id  – multipart form: title, price, location (optional), image (optional file).
// Only the owner can edit. Without a new image the old one is kept.
app.put('/posts/:id', auth, upload.single('image'), (req, res) => {
  const post = findOwnPost(req.params.id, req.user.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const { title, price, location } = req.body ?? {};

  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required.' });
  }

  const image = req.file ? req.file.filename : post.image;
  db.prepare('UPDATE posts SET title = ?, price = ?, location = ?, image = ? WHERE id = ?')
    .run(title, price, location || null, image, post.id);

  // Remove the old picture, it is not used anymore.
  if (req.file) {
    fs.rm(path.join(UPLOAD_DIR, post.image), { force: true }, () => {});
  }

  const row = db.prepare(`${POST_SELECT} WHERE posts.id = ?`).get(post.id);
  res.json(toPost(row));
});

// DELETE /posts/:id  – e.g. when it is sold. Only the owner can delete.
// The post disappears from swiping and the profile, chats about it stay.
app.delete('/posts/:id', auth, (req, res) => {
  const post = findOwnPost(req.params.id, req.user.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  db.prepare('UPDATE posts SET deleted = 1 WHERE id = ?').run(post.id);
  res.json({ ok: true });
});

// POST /posts/:id/like  – liking a post opens a chat between the liker (buyer) and the seller.
// Liking the same post again returns the existing chat.
app.post('/posts/:id/like', auth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND deleted = 0').get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  // Own post: nothing to chat about.
  if (post.user_id === req.user.id) {
    return res.json({ chatId: null, created: false });
  }

  const existing = db
    .prepare('SELECT id FROM chats WHERE post_id = ? AND buyer_id = ?')
    .get(post.id, req.user.id);

  if (existing) {
    return res.json({ chatId: String(existing.id), created: false });
  }

  // Chat + first message together, so there is never a chat without a message.
  const createChat = db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO chats (post_id, buyer_id, seller_id) VALUES (?, ?, ?)')
      .run(post.id, req.user.id, post.user_id);
    db.prepare('INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)')
      .run(lastInsertRowid, req.user.id, `Hi! I'm interested in your "${post.title}".`);
    return lastInsertRowid;
  });

  res.status(201).json({ chatId: String(createChat()), created: true });
});

// Returns the chat only if the user is buyer or seller in it.
const findChat = (chatId, userId) =>
  db.prepare('SELECT * FROM chats WHERE id = ? AND (buyer_id = ? OR seller_id = ?)')
    .get(chatId, userId, userId);

// GET /chats  – chats of the logged in user, newest message first (for the chat list)
app.get('/chats', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT chats.id, posts.title AS postTitle, other.username AS name, other.avatar,
      (SELECT text FROM messages WHERE chat_id = chats.id ORDER BY id DESC LIMIT 1) AS lastMessage,
      (SELECT MAX(id) FROM messages WHERE chat_id = chats.id) AS lastMessageId
    FROM chats
    JOIN posts ON posts.id = chats.post_id
    JOIN users AS other
      ON other.id = CASE WHEN chats.buyer_id = :me THEN chats.seller_id ELSE chats.buyer_id END
    WHERE chats.buyer_id = :me OR chats.seller_id = :me
    ORDER BY lastMessageId DESC
  `).all({ me: req.user.id });

  res.json(rows.map((c) => ({
    id: String(c.id),
    name: c.name,
    avatar: c.avatar ? `/uploads/${c.avatar}` : null,
    postTitle: c.postTitle,
    lastMessage: c.lastMessage ?? '',
  })));
});

// GET /chats/:id  – one chat with all messages (for the chat screen)
app.get('/chats/:id', auth, (req, res) => {
  const chat = findChat(req.params.id, req.user.id);

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found.' });
  }

  const otherId = chat.buyer_id === req.user.id ? chat.seller_id : chat.buyer_id;
  const other = db.prepare('SELECT username, avatar FROM users WHERE id = ?').get(otherId);
  const post = db.prepare('SELECT title FROM posts WHERE id = ?').get(chat.post_id);
  const messages = db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY id').all(chat.id);

  res.json({
    id: String(chat.id),
    name: other.username,
    avatar: other.avatar ? `/uploads/${other.avatar}` : null,
    postTitle: post.title,
    messages: messages.map((m) => ({ id: String(m.id), text: m.text, mine: m.sender_id === req.user.id })),
  });
});

// DELETE /chats/:id  – deletes the chat with all messages, for both users.
app.delete('/chats/:id', auth, (req, res) => {
  const chat = findChat(req.params.id, req.user.id);

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found.' });
  }

  db.prepare('DELETE FROM chats WHERE id = ?').run(chat.id);
  res.json({ ok: true });
});

// POST /chats/:id/messages  – Body: { text }. Sender is the logged in user.
app.post('/chats/:id/messages', auth, (req, res) => {
  const text = req.body?.text?.trim();

  if (!text) {
    return res.status(400).json({ error: 'Message is empty.' });
  }

  const chat = findChat(req.params.id, req.user.id);

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found.' });
  }

  const { lastInsertRowid } = db
    .prepare('INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)')
    .run(chat.id, req.user.id, text);

  res.status(201).json({ id: String(lastInsertRowid), text, mine: true });
});

// Errors always go back as JSON, so the app can show the message. Never send the stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 10 MB).' : err.message;
    return res.status(400).json({ error: message });
  }

  // e.g. broken JSON in the request body (status 400)
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: 'Invalid request.' });
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
