import { Router } from 'express';
import { generateReportSnapshot, generateCSVExport } from '../services/reportService.js';

const router = Router();

// GET /api/reports/:case_id (Report Snapshot)
router.get('/:case_id', (req, res) => {
  const snapshot = generateReportSnapshot(req.params.case_id);
  if (!snapshot) {
    return res.status(404).json({ success: false, error: { message: 'Report snapshot not found for this case.' } });
  }
  res.json({ success: true, data: snapshot });
});

// GET /api/reports/:case_id/csv (CSV Download)
router.get('/:case_id/csv', (req, res) => {
  const snapshot = generateReportSnapshot(req.params.case_id);
  if (!snapshot) {
    return res.status(404).json({ success: false, error: { message: 'Report not found.' } });
  }

  const csv = generateCSVExport(snapshot);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${snapshot.report_number}.csv"`);
  res.send(csv);
});

// GET /api/reports/:case_id/json (JSON Certificate Download)
router.get('/:case_id/json', (req, res) => {
  const snapshot = generateReportSnapshot(req.params.case_id);
  if (!snapshot) {
    return res.status(404).json({ success: false, error: { message: 'Report not found.' } });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${snapshot.report_number}.json"`);
  res.send(JSON.stringify(snapshot, null, 2));
});

export default router;
