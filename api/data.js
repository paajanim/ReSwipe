import express from 'express';

const app = express();
const PORT = 3000;

// This is used so that Express the API could read JSON data.
app.use(express.json());

// Testdata, later on Database.
const users = [
  { id: 1, username: 'test', email: 'test@test.de', password: 'test123' },
];

// Testdata for chats. Every chat has a list of messages, the last one is shown in the chat list.
const chats = [
  { id: '1', name: 'Fyn', messages: [{ id: '1', from: 'Fyn', text: 'Hi! This is a test.' }] },
];

// POST /login  – Body: { email, password }
app.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Mail and Password are required.' });
  }

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Wrong Mail or Password.' });
  }

  // it is possible to write res.json(user); but then you would send the password back. thats not ok.
  res.json({ id: user.id, username: user.username, email: user.email });
});

// POST /register  – Body: { username, email, password }
app.post('/register', (req, res) => {
  const { username, email, password } = req.body ?? {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, Mail und Password are required.'});
  }

  if (users.some((u) => u.email === email)) {
    return res.status(409).json({ error: 'E-Mail ist bereits registriert' });
  }

  const newUser = { id: users.length + 1, username, email, password };
  users.push(newUser);

  res.status(201).json({ id: newUser.id, username: newUser.username, email: newUser.email });
});

// GET /chats  – list of all chats with only the last message (for the chat list)
app.get('/chats', (req, res) => {
  const list = chats.map((chat) => ({
    id: chat.id,
    name: chat.name,
    lastMessage: chat.messages[chat.messages.length - 1]?.text ?? '',
  }));

  res.json(list);
});

// GET /chats/:id  – one chat with all messages (for the chat screen)
app.get('/chats/:id', (req, res) => {
  const chat = chats.find((c) => c.id === req.params.id);

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found.' });
  }

  res.json(chat);
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
