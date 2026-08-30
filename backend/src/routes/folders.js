const { Router } = require('express');
const db = require('../db/init.js').default;
const { authMiddleware } = require('../middleware/auth.js');
const validators = require('../middleware/validate.js');
const { v4: uuidv4 } = require('uuid');

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const folders = db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY name').all(req.user.id);
  res.json(folders);
});

router.get('/tree', (req, res) => {
  const folders = db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY name').all(req.user.id);
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

router.post('/', validators.createFolder, (req, res) => {
  const { name, parentId } = req.body;

  if (parentId) {
    const parent = db.prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?').get(parentId, req.user.id);
    if (!parent) {
      return res.status(404).json({ error: 'Parent folder not found' });
    }
  }

  const id = uuidv4();
  db.prepare('INSERT INTO folders (id, name, parent_id, user_id) VALUES (?, ?, ?, ?)')
    .run(id, name, parentId || null, req.user.id);

  const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
  res.status(201).json(folder);
});

router.patch('/:id', validators.updateFolder, (req, res) => {
  const folder = db.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  const { name, parentId } = req.body;
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (parentId !== undefined) {
    if (parentId === folder.id) {
      return res.status(400).json({ error: 'Cannot move folder into itself' });
    }
    if (parentId) {
      const parent = db.prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?').get(parentId, req.user.id);
      if (!parent) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
      let current = folder;
      while (current.parent_id) {
        if (current.parent_id === parentId) {
          return res.status(400).json({ error: 'Cannot move folder into its own descendant' });
        }
        current = db.prepare('SELECT * FROM folders WHERE id = ?').get(current.parent_id);
      }
    }
    updates.push('parent_id = ?');
    params.push(parentId || null);
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.push('updated_at = ?');
  params.push(Date.now());
  params.push(req.params.id);

  db.prepare(`UPDATE folders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', validators.deleteFolder, (req, res) => {
  const folder = db.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  db.prepare('DELETE FROM folders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;