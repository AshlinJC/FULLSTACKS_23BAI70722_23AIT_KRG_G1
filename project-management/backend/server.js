// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/project_management';
const PORT = process.env.PORT || 4000;

/** Connect to MongoDB */
mongoose.connect(MONGO_URI)
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('MongoDB connection error:', err));

/** Schemas & Models */
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, enum: ['pending','ongoing','completed'], default: 'pending' },
  projectId: String,
  assigneeId: String,
  dueDate: Date,
  orderIndex: Number,
  timerSeconds: { type: Number, default: 0 },
  userId: String // owner of the task
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

/** Express setup */
const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

/** Socket auth middleware:
 *  Clients should send the JWT token in socket handshake auth: { token }
 */
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || (socket.handshake.headers && socket.handshake.headers.authorization && socket.handshake.headers.authorization.split(' ')[1]);
    if (!token) return next(new Error('Authentication error: no token'));
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    return next();
  } catch (err) {
    return next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', socket => {
  console.log('Socket connected', socket.id, 'userId=', socket.userId);
  // join a private room for this user so we can emit only to their sessions
  socket.join('user_' + socket.userId);

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

/** Auth middleware for HTTP routes */
function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header && header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/** Routes */

/* Register */
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Login */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Get current user (optional) */
app.get('/api/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json(user);
});

/* Tasks - protected by authMiddleware and scoped to userId */
app.get('/api/tasks', authMiddleware, async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: 1 });
  res.json(tasks);
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  const payload = { ...req.body, userId: req.user.id };
  const t = await Task.create(payload);
  // emit to all sockets belonging to this user
  io.to('user_' + req.user.id).emit('taskCreated', t);
  res.json(t);
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updated = await Task.findOneAndUpdate({ _id: id, userId: req.user.id }, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  io.to('user_' + req.user.id).emit('taskUpdated', updated);
  res.json(updated);
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const removed = await Task.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!removed) return res.status(404).json({ error: 'Task not found' });
  io.to('user_' + req.user.id).emit('taskDeleted', removed._id);
  res.json({ success: true });
});

/* Projects endpoints (optional) - scoped to user */
app.get('/api/projects', authMiddleware, async (req, res) => {
  // if you add a Project model later, ensure user scoping
  res.json([]);
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

