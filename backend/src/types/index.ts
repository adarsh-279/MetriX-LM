export type AccuracyClass = 'I' | 'II' | 'III' | 'IIII';

export type UserRole = 'technician' | 'reviewer' | 'admin' | 'lab_manager';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  laboratory_id?: string;
  active: boolean;
  created_at: string;
}

export interface Laboratory {
  id: string;
  name: string;
  code: string;
  address: string;
  contact: string;
  accreditation_number: string;
}

export interface Instrument {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  accuracy_class: AccuracyClass;
  max_capacity: number; // Max
  verification_scale_interval: number; // e
  actual_scale_interval: number; // d
  min_capacity: number; // Min
  number_of_scale_intervals: number; // n = Max / e
  tare_max?: number;
  unit: string; // 'kg', 'g', 'mg'
  display_type?: string; // 'LCD with backlight', 'VFD', 'LED'
  load_receptor?: string; // 'Platform 400x400mm', 'Weighing Pan Ø 90mm'
  power_supply?: string; // '230V AC / Internal Battery', '12V DC Adapter'
  software_version?: string; // 'v2.10.4'
  identification_markings?: string; // 'Stamping plate attached at rear'
  photo_url?: string;
  spec_document_url?: string;
  status: 'active' | 'in_testing' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CalibrationEquipment {
  id: string;
  name: string;
  serial_number: string;
  type: 'standard_weights' | 'thermometer' | 'hygrometer' | 'barometer';
  accuracy_class?: string; // e.g. 'E2', 'F1', 'M1'
  calibration_date: string;
  due_date: string;
  certificate_number: string;
  status: 'valid' | 'expired' | 'due_soon';
}

export interface EnvironmentalConditions {
  temperature_start: number; // °C
  temperature_end: number;
  humidity_start: number; // %
  humidity_end: number;
  atmospheric_pressure?: number; // hPa
  recorded_at: string;
}

export type CaseStatus =
  | 'draft'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface EvaluationCase {
  id: string;
  case_number: string; // e.g. "CASE-2026-001"
  instrument_id: string;
  instrument?: Instrument;
  lab_id: string;
  laboratory_name?: string;
  technician_id: string;
  technician_name: string;
  reviewer_id?: string;
  reviewer_name?: string;
  status: CaseStatus;
  revision: number; // 1, 2, 3...
  previous_case_id?: string;
  rule_release_id: string; // e.g. "OIML-R76-2006"
  test_date: string;
  environmental_conditions: EnvironmentalConditions;
  equipment_used_ids: string[];
  overall_result: 'pass' | 'fail' | 'pending';
  reviewer_comments?: string;
  rejection_reason?: string;
  correction_notes?: string;
  data_hash?: string;
  locked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WeighingTestRow {
  load: number;
  indication_inc?: number;
  indication_dec?: number;
  error_inc?: number;
  error_dec?: number;
  mpe: number;
  pass: boolean;
  explanation?: string;
}

export interface RepeatabilityTestRow {
  load: number;
  readings: number[];
  max_val?: number;
  min_val?: number;
  range?: number;
  std_dev?: number;
  mpe_range: number;
  pass: boolean;
  explanation?: string;
}

export interface EccentricityPosition {
  position: string; // 'Center', 'Front-Left', 'Back-Left', 'Back-Right', 'Front-Right'
  reading?: number;
  error?: number; // relative to center
}

export interface EccentricityTestRow {
  test_load: number;
  center_reading?: number;
  positions: EccentricityPosition[];
  max_error?: number;
  mpe: number;
  pass: boolean;
  explanation?: string;
}

export interface ZeroTareTestRow {
  tare_load: number;
  test_load: number;
  net_indication?: number;
  error?: number;
  mpe: number;
  pass: boolean;
  explanation?: string;
}

export interface DiscriminationTestRow {
  test_load: number;
  reading_before?: number;
  reading_after?: number; // after +0.4e added
  change_detected: boolean;
  pass: boolean;
  explanation?: string;
}

export interface TestExecutionData {
  weighing_tests: WeighingTestRow[];
  repeatability_tests: RepeatabilityTestRow[];
  eccentricity_tests: EccentricityTestRow[];
  zero_tare_tests: ZeroTareTestRow[];
  discrimination_tests: DiscriminationTestRow[];
}

export interface Evidence {
  id: string;
  case_id: string;
  test_type?: string;
  category: 'instrument_photo' | 'nameplate' | 'test_setup' | 'error_indication' | 'spec_sheet' | 'calibration_cert';
  title: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  uploader_name: string;
  remarks?: string;
  timestamp: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_value?: string;
  after_value?: string;
  reason?: string;
  timestamp: string;
}

export interface OIMLRule {
  id: string;
  clause: string;
  title: string;
  description: string;
  applicable_tests: string[];
  formula_summary: string;
}

export interface RuleRelease {
  id: string;
  standard: string;
  release_year: string;
  title: string;
  status: 'active' | 'superseded' | 'draft';
  effective_date: string;
  rules: OIMLRule[];
}
