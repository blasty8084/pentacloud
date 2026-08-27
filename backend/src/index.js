const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { resolve } = require('path');
const { fileURLToPath } = require('url');

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const authRoutes = require('./routes/auth.js');
const fileRoutes = require('./routes/files.js');
const folderRoutes = require('./routes/folders.js');
const storageRoutes = require('./routes/storage.js');
const shareRoutes = require('./routes/shares.js');
const settingsRoutes = require('./routes/settings.js');
const b2Service = require('./services/b2.js');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

async function start() {
  await b2Service.initialize();
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);