// Folder routes
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { db, statements } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

router.get('/', (req, res) => {
  const folders = statements.getFoldersByUser.all(req.user.id);
  res.json(folders);
});

router.get('/tree', (req, res) => {
  const folders = statements.getFolderTree.all(req.user.id);
  const folderMap = new Map();
  const roots = [];

  for (const folder of folders) {
    folder.children = [];
    folderMap.set(folder.id, folder);
  }

  for (const folder of folders) {
    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      folderMap.get(folder.parent_id).children.push(folder);
    } else {
      roots.push(folder);
    }
  }

  res.json(roots);
});

router.post('/', [
  body('name').isString().trim().escape().isLength({ min: 1, max: 255 }).withMessage('Folder name required (1-255 chars)'),
  body('parentId').optional().isUUID().withMessage('Invalid parent folder ID'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, parentId } = req.body;

  if (parentId) {
    const parent = statements.getFolderById.get(parentId, req.user.id);
    if (!parent) {
      return res.status(404).json({ error: 'Parent folder not found' });
    }
  }

  const id = uuidv4();
  statements.createFolder.run(id, name, parentId || null, req.user.id);

  const folder = statements.getFolderById.get(id);
  res.status(201).json(folder);
});

router.patch('/:id', [
  param('id').isUUID().withMessage('Invalid folder ID'),
  body('name').optional().isString().trim().escape().isLength({ min: 1, max: 255 }).withMessage('Invalid folder name'),
  body('parentId').optional().isUUID().withMessage('Invalid parent folder ID'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const folder = statements.getFolderById.get(req.params.id, req.user.id);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  const { name, parentId } = req.body;
  const updates = { updated_at: Date.now() };

  if (name !== undefined) updates.name = name;
  if (parentId !== undefined) {
    if (parentId === folder.id) {
      return res.status(400).json({ error: 'Cannot move folder into itself' });
    }
    if (parentId) {
      const parent = statements.getFolderById.get(parentId, req.user.id);
      if (!parent) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
      let current = folder;
      while (current.parent_id) {
        if (current.parent_id === parentId) {
          return res.status(400).json({ error: 'Cannot move folder into its own descendant' });
        }
        current = statements.getFolderById.get(current.parent_id);
      }
    }
    updates.parent_id = parentId || null;
  }

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.user.id];
  statements.db.prepare(`UPDATE folders SET ${setClause} WHERE id = ? AND user_id = ?`).run(...values);

  const updated = statements.getFolderById.get(req.params.id);
  res.json(updated);
});

router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid folder ID'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const folder = statements.getFolderById.get(req.params.id, req.user.id);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  statements.deleteFolder.run(req.params.id, req.user.id);
  res.json({ success: true });
});

export default router;