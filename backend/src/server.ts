import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB, db } from './db/index.js';
import { seedData } from './db/seed.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import instrumentsRoutes from './routes/instruments.js';
import casesRoutes from './routes/cases.js';
import calculateRoutes from './routes/calculate.js';
import reviewsRoutes from './routes/reviews.js';
import evidenceRoutes from './routes/evidence.js';
import equipmentRoutes from './routes/equipment.js';
import auditRoutes from './routes/audit.js';
import rulesRoutes from './routes/rules.js';
import aiRoutes from './routes/ai.js';
import statsRoutes from './routes/stats.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Seed default data if empty
initDB();
if (db.getUsers().length === 0 || db.getInstruments().length === 0) {
  seedData();
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MetriX-LM (NAWI-Verify) Backend API',
    standard: 'OIML R 76-1:2006 / OIML R 76-2:2007',
    timestamp: new Date().toISOString(),
  });
});

// Reseed demo data endpoint
app.post('/api/seed/reset', (req, res) => {
  seedData();
  res.json({ success: true, message: 'Database reseeded successfully with demo instruments and test cases.' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/instruments', instrumentsRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/calculate', calculateRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportsRoutes);

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 MetriX-LM Backend API server running on http://localhost:${PORT}`);
  console.log(`⚖️  OIML R 76 Compliance Engine ready.`);
});

export default app;
