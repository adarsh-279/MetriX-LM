import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';
import type { CalibrationEquipment } from '../types/index.js';

const router = Router();

// GET /api/equipment
router.get('/', (req, res) => {
  const list = db.getEquipment();
  res.json({ success: true, data: list });
});

// POST /api/equipment
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const { name, serial_number, type, accuracy_class, calibration_date, due_date, certificate_number } = req.body;

  if (!name || !serial_number || !certificate_number) {
    return res.status(400).json({ success: false, error: { message: 'Required: name, serial_number, certificate_number.' } });
  }

  const isExpired = new Date(due_date).getTime() < Date.now();

  const newEq: CalibrationEquipment = {
    id: uuidv4(),
    name,
    serial_number,
    type: type || 'standard_weights',
    accuracy_class,
    calibration_date: calibration_date || new Date().toISOString().slice(0, 10),
    due_date: due_date || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    certificate_number,
    status: isExpired ? 'expired' : 'valid',
  };

  db.saveEquipment(newEq);

  if (req.user) {
    logAuditEvent(
      { id: req.user.id, name: req.user.name, role: req.user.role },
      'REGISTER_CALIBRATION_EQUIPMENT',
      'CalibrationEquipment',
      newEq.id,
      { afterValue: `${newEq.name} (Cert: ${newEq.certificate_number})`, reason: 'Added traceable standard weight / instrument' }
    );
  }

  res.status(201).json({ success: true, data: newEq });
});

export default router;
