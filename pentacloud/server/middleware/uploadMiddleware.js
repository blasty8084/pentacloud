// Upload middleware - file validation and multer configuration
const multer = require('multer');

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/csv', 'text/markdown', 'text/html', 'text/css', 'text/javascript',
  'application/json',
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/octet-stream',
];

function sanitizeFileName(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[\._]+|[\._]+$/g, '')
    .substring(0, 255);
}

function validateFileType(mimetype) {
  return ALLOWED_MIME_TYPES.includes(mimetype);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!validateFileType(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
    cb(null, true);
  },
});

module.exports = { upload, sanitizeFileName, validateFileType, MAX_FILE_SIZE, ALLOWED_MIME_TYPES };