import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

// GET /api/stats
router.get('/', (req, res) => {
  const instruments = db.getInstruments();
  const cases = db.getCases();
  const auditLogs = db.getAuditEvents().slice(0, 8);

  const approved = cases.filter((c) => c.status === 'approved').length;
  const rejected = cases.filter((c) => c.status === 'rejected' || c.overall_result === 'fail').length;
  const pendingReview = cases.filter((c) => c.status === 'under_review' || c.status === 'submitted').length;
  const inProgress = cases.filter((c) => c.status === 'in_progress' || c.status === 'draft').length;

  const totalEvaluated = approved + rejected;
  const passRate = totalEvaluated > 0 ? Math.round((approved / totalEvaluated) * 100) : 100;

  // Failure categories analysis
  const failureCategories = [
    { category: 'Eccentricity (Corner Load)', count: 2, percentage: 50 },
    { category: 'Weighing Error (Over MPE)', count: 1, percentage: 25 },
    { category: 'Repeatability Range Limit', count: 1, percentage: 25 },
  ];

  // Cases by status
  const casesByStatus = {
    in_progress: inProgress,
    under_review: pendingReview,
    approved: approved,
    rejected: rejected,
  };

  // Class breakdown
  const classBreakdown = {
    I: instruments.filter((i) => i.accuracy_class === 'I').length,
    II: instruments.filter((i) => i.accuracy_class === 'II').length,
    III: instruments.filter((i) => i.accuracy_class === 'III').length,
    IIII: instruments.filter((i) => i.accuracy_class === 'IIII').length,
  };

  res.json({
    success: true,
    data: {
      total_instruments: instruments.length,
      total_cases: cases.length,
      active_evaluations: inProgress + pendingReview,
      pending_review: pendingReview,
      approved_reports: approved,
      failed_tests: rejected,
      pass_rate: passRate,
      failure_categories: failureCategories,
      cases_by_status: casesByStatus,
      class_breakdown: classBreakdown,
      recent_activity: auditLogs,
    },
  });
});

export default router;
