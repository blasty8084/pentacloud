const jwt = require('jsonwebtoken');
const db = require('../db/init.js').default;

const JWT_SECRET = process.env.JWT_SECRET || 'pentacloud-secret-change-in-production';

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.id);
      if (user) req.user = user;
    }
  }
  next();
}

module.exports = { generateToken, verifyToken, authMiddleware, optionalAuthMiddleware };