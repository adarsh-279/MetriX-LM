import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { validateInstrumentClass } from '../services/oimlEngine.js';
import { logAuditEvent } from '../services/auditService.js';
import type { Instrument, AccuracyClass } from '../types/index.js';

const router = Router();

// GET /api/instruments
router.get('/', (req, res) => {
  const { search, status, accuracy_class } = req.query;
  let list = db.getInstruments();

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.manufacturer.toLowerCase().includes(q) ||
        i.model.toLowerCase().includes(q) ||
        i.serial_number.toLowerCase().includes(q)
    );
  }

  if (status) {
    list = list.filter((i) => i.status === status);
  }

  if (accuracy_class) {
    list = list.filter((i) => i.accuracy_class === accuracy_class);
  }

  res.json({ success: true, data: list });
});

// GET /api/instruments/:id
router.get('/:id', (req, res) => {
  const instrument = db.getInstrumentById(req.params.id);
  if (!instrument) {
    return res.status(404).json({ success: false, error: { message: 'Instrument not found.' } });
  }
  res.json({ success: true, data: instrument });
});

// GET /api/instruments/:id/passport (Digital Instrument Passport)
router.get('/:id/passport', (req, res) => {
  const instrument = db.getInstrumentById(req.params.id);
  if (!instrument) {
    return res.status(404).json({ success: false, error: { message: 'Instrument not found.' } });
  }

  // Find all evaluation cases for this instrument
  const cases = db.getCases().filter((c) => c.instrument_id === instrument.id);
  const evidence = db.get().evidence.filter((e) => cases.some((c) => c.id === e.case_id));

  // Compute test track record
  const testHistory = cases.map((c) => ({
    case_id: c.id,
    case_number: c.case_number,
    revision: c.revision,
    test_date: c.test_date,
    status: c.status,
    overall_result: c.overall_result,
    reviewer_name: c.reviewer_name,
    locked_at: c.locked_at,
  }));

  const validation = validateInstrumentClass(
    instrument.accuracy_class,
    instrument.verification_scale_interval,
    instrument.max_capacity,
    instrument.min_capacity
  );

  res.json({
    success: true,
    data: {
      instrument,
      validation,
      test_history: testHistory,
      documents: evidence,
      total_evaluations: cases.length,
      approved_evaluations: cases.filter((c) => c.status === 'approved').length,
    },
  });
});

// GET /api/instruments/:id/readiness (Pre-Test Readiness Check)
router.get('/:id/readiness', (req, res) => {
  const instrument = db.getInstrumentById(req.params.id);
  if (!instrument) {
    return res.status(404).json({ success: false, error: { message: 'Instrument not found.' } });
  }

  const classValidation = validateInstrumentClass(
    instrument.accuracy_class,
    instrument.verification_scale_interval,
    instrument.max_capacity,
    instrument.min_capacity
  );

  const equipmentList = db.getEquipment();
  const validEquipment = equipmentList.filter((e) => e.status === 'valid');

  const checks = [
    {
      id: 'spec_complete',
      name: 'Instrument Specifications Complete',
      passed: !!(instrument.name && instrument.manufacturer && instrument.model && instrument.serial_number),
      detail: `${instrument.manufacturer} ${instrument.model} (SN: ${instrument.serial_number})`,
    },
    {
      id: 'oiml_table1',
      name: 'OIML R 76-1 Table 1 Conformance',
      passed: classValidation.valid,
      detail: classValidation.valid
        ? `n = ${classValidation.n.toLocaleString()} scale intervals valid for Class ${instrument.accuracy_class}`
        : classValidation.reason || 'Invalid parameters',
    },
    {
      id: 'scale_intervals',
      name: 'Verification Scale Interval (e) & Actual (d) Configured',
      passed: instrument.verification_scale_interval > 0 && instrument.actual_scale_interval > 0,
      detail: `e = ${instrument.verification_scale_interval} ${instrument.unit}, d = ${instrument.actual_scale_interval} ${instrument.unit}`,
    },
    {
      id: 'equipment_traceability',
      name: 'Traceable Calibration Equipment Available',
      passed: validEquipment.length >= 2,
      detail: `${validEquipment.length} valid mass and environmental standards available in laboratory`,
    },
  ];

  const allPassed = checks.every((c) => c.passed);

  res.json({
    success: true,
    data: {
      instrument_id: instrument.id,
      instrument_name: instrument.name,
      status: allPassed ? 'READY_FOR_TESTING' : 'PREREQUISITES_INCOMPLETE',
      ready: allPassed,
      checks,
    },
  });
});

// POST /api/instruments (Register NAWI)
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const {
    name,
    manufacturer,
    model,
    serial_number,
    accuracy_class,
    max_capacity,
    verification_scale_interval,
    actual_scale_interval,
    min_capacity,
    tare_max,
    unit,
    display_type,
    load_receptor,
    power_supply,
    software_version,
    identification_markings,
    photo_url,
  } = req.body;

  if (!name || !manufacturer || !model || !accuracy_class || !max_capacity || !verification_scale_interval) {
    return res.status(400).json({
      success: false,
      error: { message: 'Required fields: name, manufacturer, model, accuracy_class, max_capacity, verification_scale_interval.' },
    });
  }

  const e = parseFloat(verification_scale_interval);
  const max = parseFloat(max_capacity);
  const d = actual_scale_interval ? parseFloat(actual_scale_interval) : e;
  const min = min_capacity ? parseFloat(min_capacity) : undefined;
  const n = Math.round(max / e);

  // Validate Table 1 limits
  const validation = validateInstrumentClass(accuracy_class as AccuracyClass, e, max, min);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'OIML_TABLE1_VALIDATION_ERROR',
        message: validation.reason,
      },
    });
  }

  const newInstrument: Instrument = {
    id: uuidv4(),
    name,
    manufacturer,
    model,
    serial_number: serial_number || `SN-${Date.now().toString().slice(-6)}`,
    accuracy_class: accuracy_class as AccuracyClass,
    max_capacity: max,
    verification_scale_interval: e,
    actual_scale_interval: d,
    min_capacity: min || validation.minRequired,
    number_of_scale_intervals: n,
    tare_max: tare_max ? parseFloat(tare_max) : undefined,
    unit: unit || 'kg',
    display_type: display_type || 'Digital LCD with backlight',
    load_receptor: load_receptor || 'Standard Platform',
    power_supply: power_supply || '230V AC / Battery',
    software_version: software_version || 'v1.0',
    identification_markings: identification_markings || 'Riveted metal stamping nameplate',
    photo_url: photo_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.saveInstrument(newInstrument);

  if (req.user) {
    logAuditEvent(
      { id: req.user.id, name: req.user.name, role: req.user.role },
      'REGISTER_NAWI_INSTRUMENT',
      'Instrument',
      newInstrument.id,
      { afterValue: `${newInstrument.name} (Class ${newInstrument.accuracy_class}, Max ${newInstrument.max_capacity} ${newInstrument.unit})`, reason: 'Registered new instrument for type-evaluation testing' }
    );
  }

  res.status(201).json({ success: true, data: newInstrument });
});

// PUT /api/instruments/:id
router.put('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const existing = db.getInstrumentById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: { message: 'Instrument not found.' } });
  }

  const updated: Instrument = {
    ...existing,
    ...req.body,
    id: existing.id,
    updated_at: new Date().toISOString(),
  };

  if (req.body.max_capacity && req.body.verification_scale_interval) {
    updated.number_of_scale_intervals = Math.round(
      parseFloat(req.body.max_capacity) / parseFloat(req.body.verification_scale_interval)
    );
  }

  db.saveInstrument(updated);

  if (req.user) {
    logAuditEvent(
      { id: req.user.id, name: req.user.name, role: req.user.role },
      'UPDATE_INSTRUMENT',
      'Instrument',
      existing.id,
      { reason: 'Updated instrument parameters in digital passport' }
    );
  }

  res.json({ success: true, data: updated });
});

// DELETE /api/instruments/:id
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const existing = db.getInstrumentById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: { message: 'Instrument not found.' } });
  }

  db.deleteInstrument(req.params.id);

  if (req.user) {
    logAuditEvent(
      { id: req.user.id, name: req.user.name, role: req.user.role },
      'DELETE_INSTRUMENT',
      'Instrument',
      req.params.id,
      { beforeValue: existing.name, reason: 'Removed instrument record' }
    );
  }

  res.json({ success: true, message: 'Instrument deleted.' });
});

export default router;
