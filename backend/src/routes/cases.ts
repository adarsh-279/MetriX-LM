import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';
import {
  evaluateWeighingPoint,
  evaluateRepeatability,
  evaluateEccentricity,
  evaluateZeroTare,
  evaluateDiscrimination,
  computeOverallCompliance,
} from '../services/oimlEngine.js';
import type { EvaluationCase, TestExecutionData, AccuracyClass } from '../types/index.js';

const router = Router();

// GET /api/cases
router.get('/', (req, res) => {
  const { status, instrument_id, search } = req.query;
  let list = db.getCases();

  // Populate instrument
  const populated = list.map((c) => {
    const inst = db.getInstrumentById(c.instrument_id);
    return { ...c, instrument: inst };
  });

  let result = populated;

  if (status && status !== 'all') {
    result = result.filter((c) => c.status === status);
  }

  if (instrument_id) {
    result = result.filter((c) => c.instrument_id === instrument_id);
  }

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (c) =>
        c.case_number.toLowerCase().includes(q) ||
        (c.instrument && c.instrument.name.toLowerCase().includes(q)) ||
        (c.instrument && c.instrument.manufacturer.toLowerCase().includes(q)) ||
        c.technician_name.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, data: result });
});

// GET /api/cases/:id
router.get('/:id', (req, res) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ success: false, error: { message: 'Case not found.' } });
  }

  const instrument = db.getInstrumentById(caseItem.instrument_id);
  const laboratory = db.getLabById(caseItem.lab_id);
  const testExecution = db.getTestExecution(caseItem.id);
  const evidence = db.getEvidenceByCase(caseItem.id);
  const auditLogs = db.getAuditEvents(caseItem.id);
  const equipmentUsed = (caseItem.equipment_used_ids || [])
    .map((id) => db.getEquipmentById(id))
    .filter(Boolean);

  res.json({
    success: true,
    data: {
      ...caseItem,
      instrument,
      laboratory,
      test_execution: testExecution,
      evidence,
      audit_logs: auditLogs,
      equipment_used: equipmentUsed,
    },
  });
});

// POST /api/cases (Create new evaluation case)
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const {
    instrument_id,
    test_date,
    temperature_start,
    temperature_end,
    humidity_start,
    humidity_end,
    atmospheric_pressure,
    equipment_used_ids,
    rule_release_id,
  } = req.body;

  if (!instrument_id) {
    return res.status(400).json({ success: false, error: { message: 'instrument_id is required.' } });
  }

  const instrument = db.getInstrumentById(instrument_id);
  if (!instrument) {
    return res.status(404).json({ success: false, error: { message: 'Instrument not found.' } });
  }

  const user = req.user!;
  const lab = db.getLaboratories()[0];

  const caseCount = db.getCases().length + 1;
  const caseNumber = `CASE-2026-${String(caseCount).padStart(3, '0')}`;

  const newCase: EvaluationCase = {
    id: uuidv4(),
    case_number: caseNumber,
    instrument_id: instrument.id,
    lab_id: lab ? lab.id : 'lab-01',
    laboratory_name: lab ? lab.name : 'Central Metrology Laboratory',
    technician_id: user.id,
    technician_name: user.name,
    status: 'in_progress',
    revision: 1,
    rule_release_id: rule_release_id || 'OIML-R76-2006',
    test_date: test_date || new Date().toISOString().slice(0, 10),
    environmental_conditions: {
      temperature_start: temperature_start ? parseFloat(temperature_start) : 22.0,
      temperature_end: temperature_end ? parseFloat(temperature_end) : 22.5,
      humidity_start: humidity_start ? parseFloat(humidity_start) : 50.0,
      humidity_end: humidity_end ? parseFloat(humidity_end) : 52.0,
      atmospheric_pressure: atmospheric_pressure ? parseFloat(atmospheric_pressure) : 1013.2,
      recorded_at: new Date().toISOString(),
    },
    equipment_used_ids: equipment_used_ids || ['eq-02', 'eq-04'],
    overall_result: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.saveCase(newCase);

  // Initialize empty test executions
  const initialExecution: TestExecutionData = {
    weighing_tests: [],
    repeatability_tests: [],
    eccentricity_tests: [],
    zero_tare_tests: [],
    discrimination_tests: [],
  };
  db.saveTestExecution(newCase.id, initialExecution);

  // Update instrument status
  instrument.status = 'in_testing';
  db.saveInstrument(instrument);

  logAuditEvent(
    { id: user.id, name: user.name, role: user.role },
    'CREATE_EVALUATION_CASE',
    'EvaluationCase',
    newCase.id,
    { afterValue: `Created ${newCase.case_number} for ${instrument.name}`, reason: 'Started new OIML R 76 evaluation workflow' }
  );

  res.status(201).json({ success: true, data: newCase });
});

// PUT /api/cases/:id/observations (Save observations & evaluate deterministic compliance)
router.put('/:id/observations', authenticate, (req: AuthenticatedRequest, res) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ success: false, error: { message: 'Case not found.' } });
  }

  if (caseItem.status === 'approved' && caseItem.locked_at) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'CASE_LOCKED',
        message: 'This case has been approved and locked. Corrections must create a new revision.',
      },
    });
  }

  const instrument = db.getInstrumentById(caseItem.instrument_id);
  if (!instrument) {
    return res.status(400).json({ success: false, error: { message: 'Instrument missing.' } });
  }

  const { weighing_tests, repeatability_tests, eccentricity_tests, zero_tare_tests, discrimination_tests } =
    req.body;

  const e = instrument.verification_scale_interval;
  const cls = instrument.accuracy_class as AccuracyClass;
  const max = instrument.max_capacity;

  const allPasses: { pass: boolean }[] = [];

  // 1. Process Weighing Tests
  const evaluatedWeighing = (weighing_tests || []).map((row: any) => {
    const load = parseFloat(row.load);
    const inc = row.indication_inc !== undefined && row.indication_inc !== '' ? parseFloat(row.indication_inc) : undefined;
    const dec = row.indication_dec !== undefined && row.indication_dec !== '' ? parseFloat(row.indication_dec) : undefined;

    // Cross-field validation: applied load > Max
    if (load > max) {
      return {
        load,
        indication_inc: inc,
        indication_dec: dec,
        mpe: 0,
        pass: false,
        explanation: `INVALID: Applied load (${load} ${instrument.unit}) exceeds configured Maximum Capacity (${max} ${instrument.unit}).`,
      };
    }

    const evaluated = evaluateWeighingPoint(load, e, cls, inc, dec);
    if (inc !== undefined || dec !== undefined) {
      allPasses.push({ pass: evaluated.pass });
    }
    return evaluated;
  });

  // 2. Process Repeatability Tests
  const evaluatedRepeat = (repeatability_tests || []).map((row: any) => {
    const load = parseFloat(row.load);
    const readings = (row.readings || []).map((r: any) => parseFloat(r)).filter((r: any) => !isNaN(r));
    const evaluated = evaluateRepeatability(load, readings, e);
    if (readings.length > 1) {
      allPasses.push({ pass: evaluated.pass });
    }
    return evaluated;
  });

  // 3. Process Eccentricity Tests
  const evaluatedEcc = (eccentricity_tests || []).map((row: any) => {
    const testLoad = row.test_load ? parseFloat(row.test_load) : max / 3;
    const center = row.center_reading !== undefined && row.center_reading !== '' ? parseFloat(row.center_reading) : undefined;
    const positions = (row.positions || []).map((p: any) => ({
      position: p.position,
      reading: p.reading !== undefined && p.reading !== '' ? parseFloat(p.reading) : undefined,
    }));
    const evaluated = evaluateEccentricity(testLoad, center, positions, e, cls);
    if (center !== undefined && positions.some((p: any) => p.reading !== undefined)) {
      allPasses.push({ pass: evaluated.pass });
    }
    return evaluated;
  });

  // 4. Process Zero / Tare Tests
  const evaluatedTare = (zero_tare_tests || []).map((row: any) => {
    const tareLoad = parseFloat(row.tare_load || 0);
    const testLoad = parseFloat(row.test_load || 0);
    const net = row.net_indication !== undefined && row.net_indication !== '' ? parseFloat(row.net_indication) : undefined;
    const evaluated = evaluateZeroTare(tareLoad, testLoad, net, e, cls);
    if (net !== undefined) {
      allPasses.push({ pass: evaluated.pass });
    }
    return evaluated;
  });

  // 5. Process Discrimination Tests
  const evaluatedDisc = (discrimination_tests || []).map((row: any) => {
    const testLoad = parseFloat(row.test_load || 0);
    const before = row.reading_before !== undefined && row.reading_before !== '' ? parseFloat(row.reading_before) : undefined;
    const after = row.reading_after !== undefined && row.reading_after !== '' ? parseFloat(row.reading_after) : undefined;
    const evaluated = evaluateDiscrimination(testLoad, before, after);
    if (before !== undefined && after !== undefined) {
      allPasses.push({ pass: evaluated.pass });
    }
    return evaluated;
  });

  const updatedExecution: TestExecutionData = {
    weighing_tests: evaluatedWeighing,
    repeatability_tests: evaluatedRepeat,
    eccentricity_tests: evaluatedEcc,
    zero_tare_tests: evaluatedTare,
    discrimination_tests: evaluatedDisc,
  };

  db.saveTestExecution(caseItem.id, updatedExecution);

  // Compute and update overall result
  const overall = computeOverallCompliance(allPasses);
  caseItem.overall_result = overall;
  caseItem.updated_at = new Date().toISOString();
  db.saveCase(caseItem);

  if (req.user) {
    logAuditEvent(
      { id: req.user.id, name: req.user.name, role: req.user.role },
      'UPDATE_TEST_OBSERVATIONS',
      'EvaluationCase',
      caseItem.id,
      { reason: 'Updated test observations and re-ran compliance engine' }
    );
  }

  res.json({
    success: true,
    data: {
      test_execution: updatedExecution,
      overall_result: overall,
    },
  });
});

// POST /api/cases/:id/submit (Submit case for reviewer inspection)
router.post('/:id/submit', authenticate, (req: AuthenticatedRequest, res) => {
  const caseItem = db.getCaseById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ success: false, error: { message: 'Case not found.' } });
  }

  if (caseItem.status === 'approved') {
    return res.status(400).json({ success: false, error: { message: 'Case already approved.' } });
  }

  caseItem.status = 'under_review';
  caseItem.updated_at = new Date().toISOString();
  db.saveCase(caseItem);

  const instrument = db.getInstrumentById(caseItem.instrument_id);
  if (instrument) {
    instrument.status = 'under_review';
    db.saveInstrument(instrument);
  }

  if (req.user) {
    logAuditEvent(
      { id: req.user.id, name: req.user.name, role: req.user.role },
      'SUBMIT_FOR_REVIEW',
      'EvaluationCase',
      caseItem.id,
      { beforeValue: 'in_progress', afterValue: 'under_review', reason: 'Technician completed observations and submitted for metrologist verification' }
    );
  }

  res.json({ success: true, data: caseItem });
});

export default router;
