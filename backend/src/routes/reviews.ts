import { Router } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';
import type { EvaluationCase } from '../types/index.js';

const router = Router();

// POST /api/reviews/:case_id/approve
router.post('/:case_id/approve', authenticate, requireRole(['reviewer', 'admin', 'lab_manager']), (req: AuthenticatedRequest, res) => {
  const caseItem = db.getCaseById(req.params.case_id);
  if (!caseItem) {
    return res.status(404).json({ success: false, error: { message: 'Case not found.' } });
  }

  const user = req.user!;
  const { comments } = req.body;

  // Compute immutable SHA-256 hash of the final test snapshot
  const testResults = db.getTestExecution(caseItem.id);
  const rawPayload = JSON.stringify({
    case_number: caseItem.case_number,
    instrument_id: caseItem.instrument_id,
    test_results: testResults,
    test_date: caseItem.test_date,
    environmental_conditions: caseItem.environmental_conditions,
    approved_by: user.name,
    approved_at: new Date().toISOString(),
  });
  const dataHash = 'sha256:' + crypto.createHash('sha256').update(rawPayload).digest('hex');

  caseItem.status = 'approved';
  caseItem.reviewer_id = user.id;
  caseItem.reviewer_name = user.name;
  caseItem.reviewer_comments = comments || 'Approved: Complies with OIML R 76-1:2006 metrological requirements.';
  caseItem.data_hash = dataHash;
  caseItem.locked_at = new Date().toISOString();
  caseItem.updated_at = new Date().toISOString();
  db.saveCase(caseItem);

  // Update instrument status to approved
  const instrument = db.getInstrumentById(caseItem.instrument_id);
  if (instrument) {
    instrument.status = 'approved';
    db.saveInstrument(instrument);
  }

  logAuditEvent(
    { id: user.id, name: user.name, role: user.role },
    'APPROVE_AND_LOCK_REPORT',
    'EvaluationCase',
    caseItem.id,
    {
      beforeValue: 'under_review',
      afterValue: `approved (Hash: ${dataHash.slice(0, 16)}...)`,
      reason: comments || 'Verified observations and calculation traces against OIML R 76-1',
    }
  );

  res.json({
    success: true,
    data: {
      case: caseItem,
      data_hash: dataHash,
    },
  });
});

// POST /api/reviews/:case_id/reject
router.post('/:case_id/reject', authenticate, requireRole(['reviewer', 'admin', 'lab_manager']), (req: AuthenticatedRequest, res) => {
  const caseItem = db.getCaseById(req.params.case_id);
  if (!caseItem) {
    return res.status(404).json({ success: false, error: { message: 'Case not found.' } });
  }

  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ success: false, error: { message: 'Rejection reason is mandatory.' } });
  }

  const user = req.user!;

  caseItem.status = 'rejected';
  caseItem.reviewer_id = user.id;
  caseItem.reviewer_name = user.name;
  caseItem.rejection_reason = reason;
  caseItem.updated_at = new Date().toISOString();
  db.saveCase(caseItem);

  const instrument = db.getInstrumentById(caseItem.instrument_id);
  if (instrument) {
    instrument.status = 'rejected';
    db.saveInstrument(instrument);
  }

  logAuditEvent(
    { id: user.id, name: user.name, role: user.role },
    'REJECT_AND_REQUEST_CORRECTION',
    'EvaluationCase',
    caseItem.id,
    {
      beforeValue: 'under_review',
      afterValue: 'rejected',
      reason,
    }
  );

  res.json({ success: true, data: caseItem });
});

// POST /api/reviews/:case_id/create-revision (Correction-aware workflow creating V2)
router.post('/:case_id/create-revision', authenticate, (req: AuthenticatedRequest, res) => {
  const previousCase = db.getCaseById(req.params.case_id);
  if (!previousCase) {
    return res.status(404).json({ success: false, error: { message: 'Previous case not found.' } });
  }

  const user = req.user!;
  const { correction_notes } = req.body;

  const newRevisionNumber = previousCase.revision + 1;
  const newCaseId = uuidv4();

  const newCase: EvaluationCase = {
    id: newCaseId,
    case_number: previousCase.case_number, // Keep base case number
    instrument_id: previousCase.instrument_id,
    lab_id: previousCase.lab_id,
    laboratory_name: previousCase.laboratory_name,
    technician_id: user.id,
    technician_name: user.name,
    status: 'in_progress',
    revision: newRevisionNumber,
    previous_case_id: previousCase.id,
    rule_release_id: previousCase.rule_release_id,
    test_date: new Date().toISOString().slice(0, 10),
    environmental_conditions: { ...previousCase.environmental_conditions, recorded_at: new Date().toISOString() },
    equipment_used_ids: [...previousCase.equipment_used_ids],
    overall_result: 'pending',
    correction_notes: correction_notes || `Revision V${newRevisionNumber} created following reviewer feedback on V${previousCase.revision}.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.saveCase(newCase);

  // Copy existing test execution to allow corrections
  const previousTestExecution = db.getTestExecution(previousCase.id);
  db.saveTestExecution(newCase.id, JSON.parse(JSON.stringify(previousTestExecution)));

  // Update instrument status
  const instrument = db.getInstrumentById(previousCase.instrument_id);
  if (instrument) {
    instrument.status = 'in_testing';
    db.saveInstrument(instrument);
  }

  logAuditEvent(
    { id: user.id, name: user.name, role: user.role },
    'CREATE_CASE_REVISION',
    'EvaluationCase',
    newCase.id,
    {
      beforeValue: `V${previousCase.revision} (${previousCase.status})`,
      afterValue: `V${newRevisionNumber} (in_progress)`,
      reason: correction_notes || 'Initiated corrected test run preserving predecessor history',
    }
  );

  res.status(201).json({ success: true, data: newCase });
});

export default router;
