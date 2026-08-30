import { Router } from 'express';
import {
  evaluateWeighingPoint,
  evaluateRepeatability,
  evaluateEccentricity,
  evaluateZeroTare,
  evaluateDiscrimination,
  getMPEForLoad,
  validateInstrumentClass,
} from '../services/oimlEngine.js';
import type { AccuracyClass } from '../types/index.js';

const router = Router();

// POST /api/calculate/weighing
router.post('/weighing', (req, res) => {
  const { load, e, accuracy_class, indication_inc, indication_dec } = req.body;
  if (load === undefined || !e || !accuracy_class) {
    return res.status(400).json({ success: false, error: { message: 'Missing parameters (load, e, accuracy_class).' } });
  }

  const result = evaluateWeighingPoint(
    parseFloat(load),
    parseFloat(e),
    accuracy_class as AccuracyClass,
    indication_inc !== undefined ? parseFloat(indication_inc) : undefined,
    indication_dec !== undefined ? parseFloat(indication_dec) : undefined
  );

  res.json({ success: true, data: result });
});

// POST /api/calculate/repeatability
router.post('/repeatability', (req, res) => {
  const { load, readings, e } = req.body;
  if (load === undefined || !readings || !e) {
    return res.status(400).json({ success: false, error: { message: 'Missing parameters (load, readings, e).' } });
  }

  const nums = readings.map((r: any) => parseFloat(r)).filter((r: any) => !isNaN(r));
  const result = evaluateRepeatability(parseFloat(load), nums, parseFloat(e));
  res.json({ success: true, data: result });
});

// POST /api/calculate/eccentricity
router.post('/eccentricity', (req, res) => {
  const { test_load, center_reading, positions, e, accuracy_class } = req.body;
  if (test_load === undefined || !e || !accuracy_class) {
    return res.status(400).json({ success: false, error: { message: 'Missing parameters (test_load, e, accuracy_class).' } });
  }

  const center = center_reading !== undefined ? parseFloat(center_reading) : undefined;
  const posInputs = (positions || []).map((p: any) => ({
    position: p.position,
    reading: p.reading !== undefined ? parseFloat(p.reading) : undefined,
  }));

  const result = evaluateEccentricity(parseFloat(test_load), center, posInputs, parseFloat(e), accuracy_class as AccuracyClass);
  res.json({ success: true, data: result });
});

// POST /api/calculate/zero-tare
router.post('/zero-tare', (req, res) => {
  const { tare_load, test_load, net_indication, e, accuracy_class } = req.body;
  const net = net_indication !== undefined ? parseFloat(net_indication) : undefined;
  const result = evaluateZeroTare(
    parseFloat(tare_load || 0),
    parseFloat(test_load || 0),
    net,
    parseFloat(e),
    accuracy_class as AccuracyClass
  );
  res.json({ success: true, data: result });
});

// POST /api/calculate/mpe
router.post('/mpe', (req, res) => {
  const { load, e, accuracy_class } = req.body;
  if (load === undefined || !e || !accuracy_class) {
    return res.status(400).json({ success: false, error: { message: 'Missing parameters (load, e, accuracy_class).' } });
  }

  const mpeInfo = getMPEForLoad(parseFloat(load), parseFloat(e), accuracy_class as AccuracyClass);
  res.json({ success: true, data: mpeInfo });
});

// POST /api/calculate/validate-instrument
router.post('/validate-instrument', (req, res) => {
  const { accuracy_class, e, max, min } = req.body;
  if (!accuracy_class || !e || !max) {
    return res.status(400).json({ success: false, error: { message: 'Missing parameters (accuracy_class, e, max).' } });
  }

  const result = validateInstrumentClass(
    accuracy_class as AccuracyClass,
    parseFloat(e),
    parseFloat(max),
    min !== undefined ? parseFloat(min) : undefined
  );
  res.json({ success: true, data: result });
});

export default router;
