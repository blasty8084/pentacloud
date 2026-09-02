// Authentication routes
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { signup, login, refresh, me } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

router.post('/signup', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Name too long'),
  handleValidation
], signup);

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidation
], login);

router.post('/refresh', refresh);

router.get('/me', authMiddleware, me);

export default router;