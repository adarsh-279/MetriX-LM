import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';
import type { Evidence } from '../types/index.js';

const router = Router();

// GET /api/evidence?case_id=xxx
router.get('/', (req, res) => {
  const { case_id } = req.query;
  if (!case_id) {
    return res.json({ success: true, data: db.get().evidence });
  }
  const items = db.getEvidenceByCase(String(case_id));
  res.json({ success: true, data: items });
});

// POST /api/evidence (Add/attach evidence item)
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const { case_id, test_type, category, title, file_url, file_type, remarks } = req.body;

  if (!case_id || !title || !file_url) {
    return res.status(400).json({ success: false, error: { message: 'case_id, title, and file_url are required.' } });
  }

  const user = req.user!;

  const newEvidence: Evidence = {
    id: uuidv4(),
    case_id,
    test_type: test_type || 'general',
    category: category || 'test_setup',
    title,
    file_url,
    file_type: file_type || 'image/jpeg',
    uploader_name: user.name,
    remarks,
    timestamp: new Date().toISOString(),
  };

  db.saveEvidence(newEvidence);

  logAuditEvent(
    { id: user.id, name: user.name, role: user.role },
    'ATTACH_EVIDENCE',
    'Evidence',
    newEvidence.id,
    { afterValue: `${newEvidence.title} (${newEvidence.category})`, reason: `Attached evidence to case ${case_id}` }
  );

  res.status(201).json({ success: true, data: newEvidence });
});

// DELETE /api/evidence/:id
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const existing = db.get().evidence.find((e) => e.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: { message: 'Evidence not found.' } });
  }

  db.deleteEvidence(req.params.id);

  if (req.user) {
    logAuditEvent(
      { id: req.user.id, name: req.user.name, role: req.user.role },
      'DELETE_EVIDENCE',
      'Evidence',
      req.params.id,
      { beforeValue: existing.title, reason: 'Removed attached evidence' }
    );
  }

  res.json({ success: true, message: 'Evidence deleted.' });
});

export default router;
