import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import postgres from 'postgres';
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
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const sql = databaseUrl ? postgres(databaseUrl, { prepare: false }) : null;

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

type DomainRow = { id: string; data: unknown };

async function replaceRows(tx: any, table: string, rows: DomainRow[]): Promise<void> {
  const json = (value: unknown) => tx.json(JSON.parse(JSON.stringify(value)));

  if (table === 'users') {
    await tx`delete from metrix_users`;
    for (const row of rows) await tx`insert into metrix_users (id, data) values (${row.id}, ${json(row.data)})`;
  } else if (table === 'laboratories') {
    await tx`delete from metrix_laboratories`;
    for (const row of rows) await tx`insert into metrix_laboratories (id, data) values (${row.id}, ${json(row.data)})`;
  } else if (table === 'instruments') {
    await tx`delete from metrix_instruments`;
    for (const row of rows) await tx`insert into metrix_instruments (id, data) values (${row.id}, ${json(row.data)})`;
  } else if (table === 'equipment') {
    await tx`delete from metrix_equipment`;
    for (const row of rows) await tx`insert into metrix_equipment (id, data) values (${row.id}, ${json(row.data)})`;
  } else if (table === 'cases') {
    await tx`delete from metrix_cases`;
    for (const row of rows) await tx`insert into metrix_cases (id, data) values (${row.id}, ${json(row.data)})`;
  } else if (table === 'test_executions') {
    await tx`delete from metrix_test_executions`;
    for (const row of rows) await tx`insert into metrix_test_executions (id, data) values (${row.id}, ${json(row.data)})`;
  } else if (table === 'evidence') {
    await tx`delete from metrix_evidence`;
    for (const row of rows) await tx`insert into metrix_evidence (id, data) values (${row.id}, ${json(row.data)})`;
  } else if (table === 'audit_events') {
    await tx`delete from metrix_audit_events`;
    for (const row of rows) await tx`insert into metrix_audit_events (id, data) values (${row.id}, ${json(row.data)})`;
  } else if (table === 'rulesets') {
    await tx`delete from metrix_rulesets`;
    for (const row of rows) await tx`insert into metrix_rulesets (id, data) values (${row.id}, ${json(row.data)})`;
  }
}

function stateRows(): Record<string, DomainRow[]> {
  return {
    users: dbMemory.users.map((item) => ({ id: item.id, data: item })),
    laboratories: dbMemory.laboratories.map((item) => ({ id: item.id, data: item })),
    instruments: dbMemory.instruments.map((item) => ({ id: item.id, data: item })),
    equipment: dbMemory.equipment.map((item) => ({ id: item.id, data: item })),
    cases: dbMemory.cases.map((item) => ({ id: item.id, data: item })),
    test_executions: Object.entries(dbMemory.test_executions).map(([id, data]) => ({ id, data })),
    evidence: dbMemory.evidence.map((item) => ({ id: item.id, data: item })),
    audit_events: dbMemory.audit_events.map((item) => ({ id: item.id, data: item })),
    rulesets: dbMemory.rulesets.map((item) => ({ id: item.id, data: item })),
  };
}

async function persistToSupabase(): Promise<void> {
  if (!sql) return;

  const rows = stateRows();
  await sql.begin(async (tx) => {
    for (const [table, values] of Object.entries(rows)) await replaceRows(tx, table, values);
  });
}

// Load Supabase state when configured; retain db.json for local development.
export async function initDB(): Promise<void> {
  if (sql) {
    await Promise.all([
      sql`create table if not exists metrix_users (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
      sql`create table if not exists metrix_laboratories (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
      sql`create table if not exists metrix_instruments (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
      sql`create table if not exists metrix_equipment (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
      sql`create table if not exists metrix_cases (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
      sql`create table if not exists metrix_test_executions (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
      sql`create table if not exists metrix_evidence (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
      sql`create table if not exists metrix_audit_events (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
      sql`create table if not exists metrix_rulesets (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
      sql`create table if not exists metrix_reports (id text primary key, data jsonb not null, created_at timestamptz not null default now())`,
    ]);

    const [users, laboratories, instruments, equipment, cases, testExecutions, evidence, auditEvents, rulesets] = await Promise.all([
      sql`select id, data from metrix_users`,
      sql`select id, data from metrix_laboratories`,
      sql`select id, data from metrix_instruments`,
      sql`select id, data from metrix_equipment`,
      sql`select id, data from metrix_cases`,
      sql`select id, data from metrix_test_executions`,
      sql`select id, data from metrix_evidence`,
      sql`select id, data from metrix_audit_events order by created_at`,
      sql`select id, data from metrix_rulesets`,
    ]);
    dbMemory = {
      users: users.map((row) => row.data as User),
      laboratories: laboratories.map((row) => row.data as Laboratory),
      instruments: instruments.map((row) => row.data as Instrument),
      equipment: equipment.map((row) => row.data as CalibrationEquipment),
      cases: cases.map((row) => row.data as EvaluationCase),
      test_executions: Object.fromEntries(testExecutions.map((row) => [row.id, row.data as TestExecutionData])),
      evidence: evidence.map((row) => row.data as Evidence),
      audit_events: auditEvents.map((row) => row.data as AuditEvent),
      rulesets: rulesets.map((row) => row.data as RuleRelease),
    };
    console.log('Loaded domain tables from Supabase');
    return;
  }

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
  if (sql) {
    void persistToSupabase().catch((err) => console.error('Error saving database to Supabase:', err));
    return;
  }

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
