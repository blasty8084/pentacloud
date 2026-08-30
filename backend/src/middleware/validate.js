const { body, query, param, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const validators = {
  signup: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Name too long'),
    handleValidationErrors,
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    handleValidationErrors,
  ],

  createFolder: [
    body('name').isString().trim().escape().isLength({ min: 1, max: 255 }).withMessage('Folder name required (1-255 chars)'),
    body('parentId').optional().isUUID().withMessage('Invalid parent folder ID'),
    handleValidationErrors,
  ],

  updateFolder: [
    param('id').isUUID().withMessage('Invalid folder ID'),
    body('name').optional().isString().trim().escape().isLength({ min: 1, max: 255 }).withMessage('Invalid folder name'),
    body('parentId').optional().isUUID().withMessage('Invalid parent folder ID'),
    handleValidationErrors,
  ],

  deleteFolder: [
    param('id').isUUID().withMessage('Invalid folder ID'),
    handleValidationErrors,
  ],

  updateFile: [
    param('id').isUUID().withMessage('Invalid file ID'),
    body('name').optional().isString().trim().escape().isLength({ min: 1, max: 255 }).withMessage('Invalid file name'),
    body('folderId').optional({ nullable: true }).isUUID().withMessage('Invalid folder ID'),
    handleValidationErrors,
  ],

  deleteFile: [
    param('id').isUUID().withMessage('Invalid file ID'),
    handleValidationErrors,
  ],

  createShare: [
    body('fileId').isUUID().withMessage('Valid file ID required'),
    body('expiresInHours').optional().isInt({ min: 1, max: 8760 }).withMessage('Expiry must be 1-8760 hours'),
    handleValidationErrors,
  ],

  downloadShare: [
    param('token').isString().trim().isLength({ min: 1 }).withMessage('Token required'),
    handleValidationErrors,
  ],

  listFiles: [
    query('folderId').optional().isUUID().withMessage('Invalid folder ID'),
    query('search').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Search query too long'),
    handleValidationErrors,
  ],

  addB2Account: [
    body('name').isString().trim().escape().isLength({ min: 1, max: 100 }).withMessage('Account name required'),
    body('keyId').isString().trim().notEmpty().withMessage('Key ID required'),
    body('applicationKey').isString().trim().notEmpty().withMessage('Application key required'),
    body('bucketId').isString().trim().notEmpty().withMessage('Bucket ID required'),
    body('bucketName').isString().trim().notEmpty().withMessage('Bucket name required'),
    body('bucketRegion').optional().isString().trim().isIn(['us-west-000', 'us-east-001', 'eu-central-003']).withMessage('Invalid region'),
    body('maxSizeGb').optional().isInt({ min: 1, max: 100 }).withMessage('Max size must be 1-100 GB'),
    handleValidationErrors,
  ],

  deleteB2Account: [
    param('id').isString().trim().notEmpty().withMessage('Account ID required'),
    handleValidationErrors,
  ],
};

module.exports = validators;