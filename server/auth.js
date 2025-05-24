import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const USERS_FILE = './users.json';
const JWT_SECRET = 'your_super_secret_jwt_key'; // Change for production

export async function getUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function registerUser(username, password, profileImage = '') {
  const users = await getUsers();
  if (users.find(u => u.username === username)) {
    throw new Error('User already exists');
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = { 
    id: Date.now().toString(),
    username, 
    password: hashed,
    profileImage,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await saveUsers(users);
  return user;
}

export async function authenticateUser(username, password) {
  const users = await getUsers();
  const user = users.find(u => u.username === username);
  if (!user) throw new Error('User not found');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid password');
  return user;
}

export function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id,
      username: user.username 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['author'];
  
  // For development - allow requests without token
  if (process.env.NODE_ENV === 'development' && !authHeader) {
    req.user = { id: 'dev-user', username: 'devuser' };
    return next();
  }
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
