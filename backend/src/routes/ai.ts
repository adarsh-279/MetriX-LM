import { Router } from 'express';
import { extractSpecificationsFromText, generateTestExplanation } from '../services/aiService.js';

const router = Router();

// POST /api/ai/extract-spec
router.post('/extract-spec', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: { message: 'Text is required for extraction.' } });
  }

  const extracted = extractSpecificationsFromText(text);
  res.json({ success: true, data: extracted });
});

// POST /api/ai/explain-result
router.post('/explain-result', (req, res) => {
  const { test_type, observed_value, reference_value, error, mpe, pass, standard_clause } = req.body;

  const explanation = generateTestExplanation(test_type || 'weighing', {
    observedValue: observed_value !== undefined ? parseFloat(observed_value) : undefined,
    referenceValue: reference_value !== undefined ? parseFloat(reference_value) : undefined,
    error: error !== undefined ? parseFloat(error) : undefined,
    mpe: mpe !== undefined ? parseFloat(mpe) : undefined,
    pass: pass === true || pass === 'true',
    standardClause: standard_clause,
  });

  res.json({ success: true, data: { explanation } });
});

export default router;
