import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/index.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authMiddleware,
  setTokenCookies,
  clearTokenCookies,
} from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userCount = await query('SELECT COUNT(*) as count FROM users');
    if (userCount.rows[0].count >= 5) {
      return res.status(403).json({ error: 'Maximum 5 users allowed' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const role = parseInt(userCount.rows[0].count) === 0 ? 'admin' : 'user';

    await query(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5)',
      [id, email, passwordHash, name || '', role]
    );

    const user = { id, email, name: name || '', role };
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setTokenCookies(res, accessToken, refreshToken);
    res.json({ accessToken, user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    setTokenCookies(res, accessToken, refreshToken);
    res.json({ accessToken, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const result = await query('SELECT id, email, name, role FROM users WHERE id = $1', [payload.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const userData = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = generateAccessToken(userData);
    const newRefreshToken = generateRefreshToken(userData);

    setTokenCookies(res, accessToken, newRefreshToken);
    res.json({ accessToken, user: userData });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

router.post('/logout', (req, res) => {
  clearTokenCookies(res);
  res.json({ success: true });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;