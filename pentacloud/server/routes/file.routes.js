// File routes
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { listFiles, uploadFile, downloadFile, updateFile, deleteFile } from '../controllers/fileController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

router.use(authMiddleware);

router.get('/', [
  query('folderId').optional().isUUID().withMessage('Invalid folder ID'),
  query('search').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Search query too long'),
  handleValidation
], listFiles);

router.post('/upload', upload.single('file'), uploadFile);

router.get('/:id/download', [
  param('id').isUUID().withMessage('Invalid file ID'),
  handleValidation
], downloadFile);

router.patch('/:id', [
  param('id').isUUID().withMessage('Invalid file ID'),
  body('name').optional().isString().trim().escape().isLength({ min: 1, max: 255 }).withMessage('Invalid file name'),
  body('folderId').optional({ nullable: true }).isUUID().withMessage('Invalid folder ID'),
  handleValidation
], updateFile);

router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid file ID'),
  handleValidation
], deleteFile);

export default router;