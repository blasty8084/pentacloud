// File controller - handles file operations
import { v4: uuidv4 } from 'uuid';
import { db, statements } from '../db/db.js';
import { routerService } from '../services/routerService.js';
import { sanitizeFileName } from '../middleware/uploadMiddleware.js';

export async function listFiles(req, res) {
  try {
    const { folderId, search } = req.query;
    let files;

    if (search) {
      files = statements.searchFiles.all(req.user.id, `%${search}%`);
    } else if (folderId) {
      files = statements.getFilesByUserAndFolder.all(req.user.id, folderId);
    } else {
      files = statements.getFilesByUser.all(req.user.id, null);
    }

    res.json(files);
  } catch (err) {
    console.error('List files error:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
}

export async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { folderId } = req.body;
    if (folderId) {
      const folder = statements.getFolderById.get(folderId, req.user.id);
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }

    const sanitizedName = sanitizeFileName(req.file.originalname);
    const result = await routerService.uploadFile(sanitizedName, req.file.buffer, req.file.mimetype);

    const fileId = uuidv4();
    statements.createFile.run(
      fileId,
      sanitizedName,
      sanitizedName,
      req.file.mimetype,
      req.file.size,
      folderId || null,
      req.user.id,
      result.accountIndex,
      result.fileId,
      result.storedFileName
    );

    const file = statements.getFileById.get(fileId);
    res.status(201).json(file);
  } catch (err) {
    if (err.message?.includes('not allowed')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
}

export async function downloadFile(req, res) {
  try {
    const file = statements.getFileForDownload.get(req.params.id, req.user.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stream = await routerService.downloadFile(file.b2_account_index, file.b2_file_name);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', file.size);
    stream.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
}

export async function updateFile(req, res) {
  try {
    const file = statements.getFileForDownload.get(req.params.id, req.user.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { name, folderId } = req.body;
    const updates = { updated_at: Date.now() };

    if (name !== undefined) {
      updates.name = sanitizeFileName(name);
    }
    if (folderId !== undefined) {
      if (folderId) {
        const folder = statements.getFolderById.get(folderId, req.user.id);
        if (!folder) {
          return res.status(404).json({ error: 'Target folder not found' });
        }
      }
      updates.folder_id = folderId || null;
    }

    statements.updateFile.run(updates.name, updates.folder_id, updates.updated_at, req.params.id, req.user.id);
    const updated = statements.getFileById.get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update file error:', err);
    res.status(500).json({ error: 'Failed to update file' });
  }
}

export async function deleteFile(req, res) {
  try {
    const file = statements.getFileForDownload.get(req.params.id, req.user.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await routerService.deleteFile(file.b2_account_index, file.b2_file_name, file.b2_file_id);
    statements.deleteFile.run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}