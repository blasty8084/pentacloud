import { Router } from 'express';
import { query } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import validators from '../middleware/validate.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const folders = await query('SELECT * FROM folders WHERE user_id = $1 ORDER BY name', [req.user.id]);
  res.json(folders.rows);
});

router.get('/tree', async (req, res) => {
  const foldersResult = await query('SELECT * FROM folders WHERE user_id = $1 ORDER BY name', [req.user.id]);
  const folders = foldersResult.rows;
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

router.post('/', validators.createFolder, async (req, res) => {
  const { name, parentId } = req.body;

  if (parentId) {
    const parent = await query('SELECT id FROM folders WHERE id = $1 AND user_id = $2', [parentId, req.user.id]);
    if (parent.rows.length === 0) {
      return res.status(404).json({ error: 'Parent folder not found' });
    }
  }

  const id = uuidv4();
  await query('INSERT INTO folders (id, name, parent_id, user_id) VALUES ($1, $2, $3, $4)', [id, name, parentId || null, req.user.id]);

  const folder = await query('SELECT * FROM folders WHERE id = $1', [id]);
  res.status(201).json(folder.rows[0]);
});

router.patch('/:id', validators.updateFolder, async (req, res) => {
  const folderResult = await query('SELECT * FROM folders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (folderResult.rows.length === 0) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  const folder = folderResult.rows[0];
  const { name, parentId } = req.body;
  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(name);
  }
  if (parentId !== undefined) {
    if (parentId === folder.id) {
      return res.status(400).json({ error: 'Cannot move folder into itself' });
    }
    if (parentId) {
      const parent = await query('SELECT id FROM folders WHERE id = $1 AND user_id = $2', [parentId, req.user.id]);
      if (parent.rows.length === 0) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
      let current = folder;
      while (current.parent_id) {
        if (current.parent_id === parentId) {
          return res.status(400).json({ error: 'Cannot move folder into its own descendant' });
        }
        const currentResult = await query('SELECT * FROM folders WHERE id = $1', [current.parent_id]);
        current = currentResult.rows[0];
      }
    }
    updates.push(`parent_id = $${paramIndex++}`);
    params.push(parentId || null);
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.push(`updated_at = NOW()`);
  params.push(req.params.id);

  await query(`UPDATE folders SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
  const updatedResult = await query('SELECT * FROM folders WHERE id = $1', [req.params.id]);
  res.json(updatedResult.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const folderResult = await query('SELECT * FROM folders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (folderResult.rows.length === 0) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  await query('DELETE FROM folders WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

export default router;