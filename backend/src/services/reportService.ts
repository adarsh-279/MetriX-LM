import crypto from 'crypto';
import { db } from '../db/index.js';
import type { EvaluationCase, Instrument, Laboratory, CalibrationEquipment, TestExecutionData, Evidence } from '../types/index.js';
import { fmt, fmtSigned } from './oimlEngine.js';

export interface FullReportSnapshot {
  report_number: string;
  case_id: string;
  revision: number;
  data_hash: string;
  generated_at: string;
  ruleset_id: string;
  status: string;
  overall_result: string;
  laboratory: Laboratory | null;
  instrument: Instrument | null;
  technician_name: string;
  reviewer_name?: string;
  reviewer_comments?: string;
  test_date: string;
  environmental_conditions: any;
  equipment_used: CalibrationEquipment[];
  test_results: TestExecutionData;
  evidence_index: Evidence[];
}

export function generateReportSnapshot(caseId: string): FullReportSnapshot | null {
  const caseItem = db.getCaseById(caseId);
  if (!caseItem) return null;

  const instrument = db.getInstrumentById(caseItem.instrument_id) || null;
  const laboratory = db.getLabById(caseItem.lab_id) || (db.getLaboratories()[0] || null);
  const equipmentUsed = (caseItem.equipment_used_ids || [])
    .map((id) => db.getEquipmentById(id))
    .filter(Boolean) as CalibrationEquipment[];
  const testResults = db.getTestExecution(caseId);
  const evidenceList = db.getEvidenceByCase(caseId);

  // Compute immutable SHA-256 hash of the case test data & observations
  const rawPayload = JSON.stringify({
    case_number: caseItem.case_number,
    instrument_id: caseItem.instrument_id,
    test_results: testResults,
    test_date: caseItem.test_date,
    environmental_conditions: caseItem.environmental_conditions,
  });
  const dataHash = 'sha256:' + crypto.createHash('sha256').update(rawPayload).digest('hex');

  const snapshot: FullReportSnapshot = {
    report_number: `OIML-R76-REP-${caseItem.case_number.replace('CASE-', '')}-V${caseItem.revision}`,
    case_id: caseItem.id,
    revision: caseItem.revision,
    data_hash: dataHash,
    generated_at: new Date().toISOString(),
    ruleset_id: caseItem.rule_release_id,
    status: caseItem.status,
    overall_result: caseItem.overall_result,
    laboratory,
    instrument,
    technician_name: caseItem.technician_name,
    reviewer_name: caseItem.reviewer_name,
    reviewer_comments: caseItem.reviewer_comments,
    test_date: caseItem.test_date,
    environmental_conditions: caseItem.environmental_conditions,
    equipment_used: equipmentUsed,
    test_results: testResults,
    evidence_index: evidenceList,
  };

  return snapshot;
}

export function generateCSVExport(snapshot: FullReportSnapshot): string {
  const lines: string[] = [];

  lines.push('=== OIML R 76-2 TYPE-EVALUATION TEST REPORT ===');
  lines.push(`Report Number,${snapshot.report_number}`);
  lines.push(`Case Number,${snapshot.case_id}`);
  lines.push(`Revision,V${snapshot.revision}`);
  lines.push(`Standard Ruleset,${snapshot.ruleset_id}`);
  lines.push(`Overall Compliance Result,${snapshot.overall_result.toUpperCase()}`);
  lines.push(`Test Date,${snapshot.test_date}`);
  lines.push(`Technician,${snapshot.technician_name}`);
  lines.push(`Reviewer,${snapshot.reviewer_name || 'N/A'}`);
  lines.push(`Data Integrity Hash,${snapshot.data_hash}`);
  lines.push('');

  // Instrument
  if (snapshot.instrument) {
    const ins = snapshot.instrument;
    lines.push('=== INSTRUMENT UNDER TEST ===');
    lines.push(`Name,${ins.name}`);
    lines.push(`Manufacturer,${ins.manufacturer}`);
    lines.push(`Model,${ins.model}`);
    lines.push(`Serial Number,${ins.serial_number}`);
    lines.push(`Accuracy Class,Class ${ins.accuracy_class}`);
    lines.push(`Max Capacity (Max),${ins.max_capacity} ${ins.unit}`);
    lines.push(`Scale Interval (e),${ins.verification_scale_interval} ${ins.unit}`);
    lines.push(`Actual Interval (d),${ins.actual_scale_interval} ${ins.unit}`);
    lines.push(`Min Capacity (Min),${ins.min_capacity || '—'} ${ins.unit}`);
    lines.push(`Scale Intervals (n),${ins.number_of_scale_intervals}`);
    lines.push('');
  }

  // Weighing Test Table
  lines.push('=== A.4.4 WEIGHING PERFORMANCE TEST ===');
  lines.push('Step,Load,Indication (Inc),Indication (Dec),Error (Inc),Error (Dec),MPE Tolerance,Result');
  (snapshot.test_results.weighing_tests || []).forEach((w, i) => {
    lines.push(
      `${i + 1},${fmt(w.load)},${fmt(w.indication_inc)},${fmt(w.indication_dec)},${fmtSigned(w.error_inc)},${fmtSigned(w.error_dec)},±${fmt(w.mpe)},${w.pass ? 'PASS' : 'FAIL'}`
    );
  });
  lines.push('');

  // Repeatability Test Table
  lines.push('=== A.4.10 REPEATABILITY TEST ===');
  lines.push('Step,Load,Readings,Max,Min,Range,Allowed Range Limit,Result');
  (snapshot.test_results.repeatability_tests || []).forEach((r, i) => {
    lines.push(
      `${i + 1},${fmt(r.load)},"${r.readings.join('; ')}",${fmt(r.max_val)},${fmt(r.min_val)},${fmt(r.range)},≤${fmt(r.mpe_range)},${r.pass ? 'PASS' : 'FAIL'}`
    );
  });
  lines.push('');

  // Eccentricity Table
  lines.push('=== A.4.7 ECCENTRICITY (CORNER LOAD) TEST ===');
  lines.push('Step,Test Load,Center Ref,Corner Position,Corner Reading,Deviation vs Center,MPE,Result');
  (snapshot.test_results.eccentricity_tests || []).forEach((e, i) => {
    e.positions.forEach((p) => {
      lines.push(
        `${i + 1},${fmt(e.test_load)},${fmt(e.center_reading)},${p.position},${fmt(p.reading)},${fmtSigned(p.error)},±${fmt(e.mpe)},${e.pass ? 'PASS' : 'FAIL'}`
      );
    });
  });

  return lines.join('\n');
}
