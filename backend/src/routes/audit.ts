import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

// GET /api/audit?entity_id=xxx
router.get('/', (req, res) => {
  const { entity_id } = req.query;
  const events = db.getAuditEvents(entity_id ? String(entity_id) : undefined);
  res.json({ success: true, data: events });
});

export default router;
