const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');
const uploadsDir = require('../uploadsDir');

const router = express.Router();

const canView = requirePermission('projects', 'view');
const canEdit = requirePermission('projects', 'edit');

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 20);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_BYTES } });

function serializeDocument(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    filename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

router.get('/', canView, (req, res) => {
  const { projectId } = req.query;
  let rows;
  if (projectId === 'none') {
    rows = db.prepare('SELECT * FROM documents WHERE project_id IS NULL ORDER BY created_at DESC').all();
  } else if (projectId) {
    rows = db.prepare('SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
  } else {
    rows = db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
  }
  res.json(rows.map(serializeDocument));
});

router.post('/', canEdit, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? `File is larger than ${MAX_FILE_BYTES / 1024 / 1024}MB` : err.message;
      return res.status(400).json({ error: message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const { title, description, projectId } = req.body || {};
    const finalTitle = title && title.trim() ? title.trim() : req.file.originalname;

    const result = db
      .prepare(
        `INSERT INTO documents (project_id, user_id, title, description, original_filename, stored_filename, mime_type, size_bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        projectId || null,
        req.session.userId,
        finalTitle,
        description || null,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size
      );

    const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(serializeDocument(row));
  });
});

router.get('/:id/file', canView, (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Document not found' });

  const filePath = path.join(uploadsDir, row.stored_filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server' });

  res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.original_filename)}"`);
  fs.createReadStream(filePath).pipe(res);
});

router.delete('/:id', canEdit, (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Document not found' });

  const filePath = path.join(uploadsDir, row.stored_filename);
  fs.unlink(filePath, () => {}); // best-effort; row deletion is the source of truth

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
