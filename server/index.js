import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';
import { registerUser, authenticateUser, generateToken, getUsers } from './auth.js';
import uploadRoutes from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
const reactBuildPath = path.join(__dirname, '../build');
app.use(express.static(reactBuildPath));

// Serve uploaded files from the public/uploads directory
const uploadsPath = path.join(__dirname, 'public', 'uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/upload', uploadRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running!' });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(reactBuildPath, 'index.html'));
});

// Auth middleware to protect routes
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'your_super_secret_jwt_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current user
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send password hash back
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

// Get todos for current user
app.get('/api/todos', requireAuth, async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return empty array for now - we'll implement todo storage later
    res.json([]);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Error fetching todos' });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  const { username, password, profileImage } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const user = await registerUser(username, password, profileImage);
    const token = generateToken(user);
    res.json({ 
      token, 
      username: user.username, 
      profileImage: user.profileImage || '' 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const user = await authenticateUser(username, password);
    const token = generateToken(user);
    res.json({ 
      token, 
      username: user.username,
      profileImage: user.profileImage || ''
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get current user (me) - Protected by requireAuth middleware
app.get('/api/auth/me', requireAuth, (req, res) => {
  // requireAuth middleware should have attached user to req.user
  if (!req.user) {
    return res.status(404).json({ error: 'User not found after auth.' });
  }
  // Send back relevant user information (excluding password)
  res.json({
    id: req.user.id, // Assuming your user object has an id
    username: req.user.username,
    profileImage: req.user.profileImage || ''
  });
});

import { getTodosForUser, addTodoForUser, updateTodoForUser, deleteTodoForUser } from './todos.js';
import { v4 as uuidv4 } from 'uuid';

// Todos API (protected)
app.get('/api/todos', requireAuth, async (req, res) => {
  const username = req.user.username;
  const todos = await getTodosForUser(username);
  res.json(todos);
});

app.post('/api/todos', requireAuth, async (req, res) => {
  const username = req.user.username;
  const todo = req.body;
  if (!todo.text) return res.status(400).json({ error: 'Todo text required' });
  const newTodo = await addTodoForUser(username, { ...todo, id: uuidv4() });
  res.status(201).json(newTodo);
});

app.put('/api/todos/:id', requireAuth, async (req, res) => {
  const username = req.user.username;
  const { id } = req.params;
  const updates = req.body;
  try {
    const updated = await updateTodoForUser(username, id, updates);
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/todos/:id', requireAuth, async (req, res) => {
  const username = req.user.username;
  const { id } = req.params;
  try {
    await deleteTodoForUser(username, id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// All remaining requests return the React app, so it can handle routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
