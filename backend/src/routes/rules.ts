import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

// GET /api/rules
router.get('/', (req, res) => {
  const rulesets = db.getRulesets();
  res.json({ success: true, data: rulesets });
});

// GET /api/rules/:id
router.get('/:id', (req, res) => {
  const ruleset = db.getRulesetById(req.params.id);
  if (!ruleset) {
    return res.status(404).json({ success: false, error: { message: 'Ruleset not found.' } });
  }
  res.json({ success: true, data: ruleset });
});

export default router;
