import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { JWT_SECRET, authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: { message: 'Email and password required.' } });
  }

  const user = db.getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, error: { message: 'Invalid email or password.' } });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  logAuditEvent(
    { id: user.id, name: user.name, role: user.role },
    'USER_LOGIN',
    'User',
    user.id,
    { reason: 'User logged in successfully' }
  );

  const { password_hash, ...safeUser } = user;
  res.json({
    success: true,
    data: {
      user: safeUser,
      token,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { message: 'Not authenticated.' } });
  }
  const { password_hash, ...safeUser } = req.user;
  res.json({ success: true, data: safeUser });
});

// GET /api/auth/users (for hackathon demo role switching)
router.get('/users', (req, res) => {
  const users = db.getUsers().map(({ password_hash, ...u }) => u);
  res.json({ success: true, data: users });
});

export default router;
