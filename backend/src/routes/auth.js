const { Router } = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/init.js').default;
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authMiddleware,
  setTokenCookies,
  clearTokenCookies,
} = require('../middleware/auth.js');
const { v4: uuidv4 } = require('uuid');

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count >= 5) {
      return res.status(403).json({ error: 'Maximum 5 users allowed' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const role = userCount.count === 0 ? 'admin' : 'user';

    db.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)')
      .run(id, email, passwordHash, name || '', role);

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

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
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

    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

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

module.exports = router;