import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import folderRoutes from './routes/folders.js';
import storageRoutes from './routes/storage.js';
import shareRoutes from './routes/shares.js';
import settingsRoutes from './routes/settings.js';
import { b2Service as B2ServiceInstance } from './services/b2.js';

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { error: 'Upload limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/signup', loginLimiter);
app.use('/api/files/upload', uploadLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

async function start() {
  await B2ServiceInstance.initialize();
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);