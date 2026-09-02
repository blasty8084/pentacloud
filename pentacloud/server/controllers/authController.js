// Authentication controller
import bcrypt from 'bcrypt';
import { v4: uuidv4 } from 'uuid';
import { db, statements } from '../db/db.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/authMiddleware.js';

export async function signup(req, res) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = statements.getUserByEmail.get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userCount = statements.getUserCount.get();
    if (userCount.count >= 5) {
      return res.status(403).json({ error: 'Maximum 5 users allowed' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const role = userCount.count === 0 ? 'admin' : 'user';

    statements.createUser.run(id, email, passwordHash, name || '', role);

    const user = { id, email, name: name || '', role };
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = statements.getUserByEmail.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    res.json({ accessToken, refreshToken, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = statements.getUserById.get(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userData = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = generateAccessToken(userData);
    const newRefreshToken = generateRefreshToken(userData);

    res.json({ accessToken, refreshToken: newRefreshToken, user: userData });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}