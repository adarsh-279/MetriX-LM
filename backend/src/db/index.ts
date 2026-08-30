import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  Laboratory,
  Instrument,
  CalibrationEquipment,
  EvaluationCase,
  TestExecutionData,
  Evidence,
  AuditEvent,
  RuleRelease,
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  laboratories: Laboratory[];
  instruments: Instrument[];
  equipment: CalibrationEquipment[];
  cases: EvaluationCase[];
  test_executions: Record<string, TestExecutionData>; // key: case_id
  evidence: Evidence[];
  audit_events: AuditEvent[];
  rulesets: RuleRelease[];
}

let dbMemory: DatabaseSchema = {
  users: [],
  laboratories: [],
  instruments: [],
  equipment: [],
  cases: [],
  test_executions: {},
  evidence: [],
  audit_events: [],
  rulesets: [],
};

// Initialize DB file
export function initDB(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbMemory = JSON.parse(raw);
      console.log('📦 Loaded database from', DB_FILE);
    } catch (err) {
      console.error('Error reading db.json, reinitializing...', err);
      saveDB();
    }
  } else {
    console.log('🌱 No db.json found. Creating new database...');
    saveDB();
  }
}

export function saveDB(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbMemory, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

export const db = {
  get: (): DatabaseSchema => dbMemory,
  set: (data: Partial<DatabaseSchema>): void => {
    dbMemory = { ...dbMemory, ...data };
    saveDB();
  },

  // Users
  getUsers: () => dbMemory.users,
  getUserById: (id: string) => dbMemory.users.find((u) => u.id === id),
  getUserByEmail: (email: string) => dbMemory.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  saveUser: (user: User) => {
    const idx = dbMemory.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) dbMemory.users[idx] = user;
    else dbMemory.users.push(user);
    saveDB();
    return user;
  },

  // Laboratories
  getLaboratories: () => dbMemory.laboratories,
  getLabById: (id: string) => dbMemory.laboratories.find((l) => l.id === id),

  // Instruments
  getInstruments: () => dbMemory.instruments,
  getInstrumentById: (id: string) => dbMemory.instruments.find((i) => i.id === id),
  saveInstrument: (ins: Instrument) => {
    const idx = dbMemory.instruments.findIndex((i) => i.id === ins.id);
    if (idx >= 0) dbMemory.instruments[idx] = ins;
    else dbMemory.instruments.unshift(ins);
    saveDB();
    return ins;
  },
  deleteInstrument: (id: string) => {
    dbMemory.instruments = dbMemory.instruments.filter((i) => i.id !== id);
    saveDB();
  },

  // Calibration Equipment
  getEquipment: () => dbMemory.equipment,
  getEquipmentById: (id: string) => dbMemory.equipment.find((e) => e.id === id),
  saveEquipment: (eq: CalibrationEquipment) => {
    const idx = dbMemory.equipment.findIndex((e) => e.id === eq.id);
    if (idx >= 0) dbMemory.equipment[idx] = eq;
    else dbMemory.equipment.push(eq);
    saveDB();
    return eq;
  },

  // Cases
  getCases: () => dbMemory.cases,
  getCaseById: (id: string) => dbMemory.cases.find((c) => c.id === id),
  saveCase: (c: EvaluationCase) => {
    const idx = dbMemory.cases.findIndex((item) => item.id === c.id);
    if (idx >= 0) dbMemory.cases[idx] = c;
    else dbMemory.cases.unshift(c);
    saveDB();
    return c;
  },
  deleteCase: (id: string) => {
    dbMemory.cases = dbMemory.cases.filter((c) => c.id !== id);
    delete dbMemory.test_executions[id];
    dbMemory.evidence = dbMemory.evidence.filter((e) => e.case_id !== id);
    saveDB();
  },

  // Test Executions
  getTestExecution: (caseId: string): TestExecutionData => {
    return (
      dbMemory.test_executions[caseId] || {
        weighing_tests: [],
        repeatability_tests: [],
        eccentricity_tests: [],
        zero_tare_tests: [],
        discrimination_tests: [],
      }
    );
  },
  saveTestExecution: (caseId: string, data: TestExecutionData) => {
    dbMemory.test_executions[caseId] = data;
    saveDB();
    return data;
  },

  // Evidence
  getEvidenceByCase: (caseId: string) => dbMemory.evidence.filter((e) => e.case_id === caseId),
  saveEvidence: (item: Evidence) => {
    dbMemory.evidence.push(item);
    saveDB();
    return item;
  },
  deleteEvidence: (id: string) => {
    dbMemory.evidence = dbMemory.evidence.filter((e) => e.id !== id);
    saveDB();
  },

  // Audit Events
  getAuditEvents: (entityId?: string) => {
    if (entityId) {
      return dbMemory.audit_events
        .filter((a) => a.entity_id === entityId || a.entity_type === entityId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return dbMemory.audit_events.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  logAudit: (event: AuditEvent) => {
    dbMemory.audit_events.unshift(event);
    saveDB();
    return event;
  },

  // Rulesets
  getRulesets: () => dbMemory.rulesets,
  getRulesetById: (id: string) => dbMemory.rulesets.find((r) => r.id === id),
  saveRuleset: (rs: RuleRelease) => {
    const idx = dbMemory.rulesets.findIndex((r) => r.id === rs.id);
    if (idx >= 0) dbMemory.rulesets[idx] = rs;
    else dbMemory.rulesets.push(rs);
    saveDB();
    return rs;
  },
};
