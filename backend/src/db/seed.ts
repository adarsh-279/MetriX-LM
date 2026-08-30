import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, initDB } from './index.js';
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
import { evaluateWeighingPoint, evaluateRepeatability, evaluateEccentricity, evaluateZeroTare, evaluateDiscrimination } from '../services/oimlEngine.js';

export function seedData(): void {
  initDB();

  console.log('🌱 Seeding MetriX-LM OIML database with realistic test cases & master data...');

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Laboratories
  const labs: Laboratory[] = [
    {
      id: 'lab-01',
      name: 'National Legal Metrology Testing & Type-Evaluation Centre',
      code: 'NLMTC-DELHI',
      address: 'Department of Consumer Affairs, Pusa Campus, New Delhi 110012, India',
      contact: '+91-11-2584-0012 | director.nlmtc@nic.in',
      accreditation_number: 'NABL / OIML-TC9-IND-2026',
    },
    {
      id: 'lab-02',
      name: 'Regional Legal Metrology Laboratory (Western Region)',
      code: 'RLML-MUMBAI',
      address: 'Plot 44, Metrology Bhavan, Sector 18, Navi Mumbai 400705, India',
      contact: '+91-22-2789-4401 | head.rlmlmumbai@gov.in',
      accreditation_number: 'NABL / LM-WR-2024',
    },
  ];

  // 2. Users
  const users: User[] = [
    {
      id: 'usr-tech-01',
      name: 'Rajesh Kumar, Senior Test Engineer',
      email: 'tech@nawi.gov.in',
      password_hash: passwordHash,
      role: 'technician',
      laboratory_id: 'lab-01',
      active: true,
      created_at: new Date('2026-01-10').toISOString(),
    },
    {
      id: 'usr-rev-01',
      name: 'Dr. S. Ananth, Principal Metrologist',
      email: 'reviewer@nawi.gov.in',
      password_hash: passwordHash,
      role: 'reviewer',
      laboratory_id: 'lab-01',
      active: true,
      created_at: new Date('2026-01-10').toISOString(),
    },
    {
      id: 'usr-admin-01',
      name: 'Sunita Verma, System Administrator',
      email: 'admin@nawi.gov.in',
      password_hash: passwordHash,
      role: 'admin',
      laboratory_id: 'lab-01',
      active: true,
      created_at: new Date('2026-01-05').toISOString(),
    },
    {
      id: 'usr-mgr-01',
      name: 'K. Mukherjee, Laboratory Director',
      email: 'manager@nawi.gov.in',
      password_hash: passwordHash,
      role: 'lab_manager',
      laboratory_id: 'lab-01',
      active: true,
      created_at: new Date('2026-01-05').toISOString(),
    },
  ];

  // 3. Calibration Equipment
  const equipment: CalibrationEquipment[] = [
    {
      id: 'eq-01',
      name: 'E2 Class Stainless Steel Mass Standard Box (1 mg – 500 g)',
      serial_number: 'NPLI-E2-2024-99',
      type: 'standard_weights',
      accuracy_class: 'E2 (OIML R 111)',
      calibration_date: '2026-02-15',
      due_date: '2027-02-14',
      certificate_number: 'NPL/CSIR/CAL/2026/0891',
      status: 'valid',
    },
    {
      id: 'eq-02',
      name: 'F1 Class Precision Weight Set (1 g – 10 kg)',
      serial_number: 'W-F1-2025-104',
      type: 'standard_weights',
      accuracy_class: 'F1 (OIML R 111)',
      calibration_date: '2026-01-20',
      due_date: '2027-01-19',
      certificate_number: 'GATC/CAL/2026/142',
      status: 'valid',
    },
    {
      id: 'eq-03',
      name: 'M1 Working Standard Weights (10 kg – 50 kg Cast Iron)',
      serial_number: 'W-M1-2024-008',
      type: 'standard_weights',
      accuracy_class: 'M1 (OIML R 111)',
      calibration_date: '2025-11-10',
      due_date: '2026-11-09',
      certificate_number: 'RLML/CAL/2025/990',
      status: 'valid',
    },
    {
      id: 'eq-04',
      name: 'Fluke 1620A Precision Thermo-Hygrometer (DewK)',
      serial_number: 'FLK-ENV-8842',
      type: 'thermometer',
      accuracy_class: '±0.25 °C / ±2% RH',
      calibration_date: '2026-03-01',
      due_date: '2027-02-28',
      certificate_number: 'IDEMI/ENV/2026/044',
      status: 'valid',
    },
  ];

  // 4. Instruments
  const instruments: Instrument[] = [
    {
      id: 'ins-01',
      name: 'Industrial Bench & Platform Scale',
      manufacturer: 'Precision Weighing Systems Ltd.',
      model: 'PWS-30 Pro',
      serial_number: 'PWS30-2026-00125',
      accuracy_class: 'III',
      max_capacity: 30,
      verification_scale_interval: 0.01, // 10 g = 0.01 kg
      actual_scale_interval: 0.01,
      min_capacity: 0.2, // 200 g = 20e
      number_of_scale_intervals: 3000,
      tare_max: 10,
      unit: 'kg',
      display_type: 'High-contrast 7-segment LED with backlight',
      load_receptor: 'Stainless Steel Platform 400 mm x 400 mm',
      power_supply: '230 V AC (50 Hz) / Internal 6V 4Ah Rechargeable Battery',
      software_version: 'v3.1.2-LM (Checksum: 0x8A4F)',
      identification_markings: 'Laser-etched metallic nameplate riveted on chassis rear',
      photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      created_at: new Date('2026-08-01').toISOString(),
      updated_at: new Date('2026-08-20').toISOString(),
    },
    {
      id: 'ins-02',
      name: 'Analytical Semi-Micro Balance',
      manufacturer: 'Sartorius Metrology AG',
      model: 'Cubis II Ultra-Precision',
      serial_number: 'SAR-CUB2-99014',
      accuracy_class: 'I',
      max_capacity: 220, // 220 g
      verification_scale_interval: 0.001, // 1 mg (0.001 g)
      actual_scale_interval: 0.0001, // 0.1 mg (d = 0.1e)
      min_capacity: 0.1, // 100 mg = 100e
      number_of_scale_intervals: 220000,
      tare_max: 220,
      unit: 'g',
      display_type: '7-inch Capacitive Colour Touchscreen TFT',
      load_receptor: 'Draft Shield enclosed Titanium Pan Ø 90 mm',
      power_supply: 'External 100-240 V AC / 15 V DC Switch-mode PSU',
      software_version: 'QApp Suite v4.8.0',
      identification_markings: 'Secured metrological seal on sensor adjustment port',
      photo_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
      status: 'under_review',
      created_at: new Date('2026-08-15').toISOString(),
      updated_at: new Date('2026-08-25').toISOString(),
    },
    {
      id: 'ins-03',
      name: 'Heavy Duty Floor Platform Scale',
      manufacturer: 'Avery Weigh-Tronix',
      model: 'ZM510-FL1500',
      serial_number: 'AVT-2026-00441',
      accuracy_class: 'III',
      max_capacity: 1500, // 1500 kg
      verification_scale_interval: 0.5, // 0.5 kg (500 g)
      actual_scale_interval: 0.5,
      min_capacity: 10, // 10 kg = 20e
      number_of_scale_intervals: 3000,
      tare_max: 500,
      unit: 'kg',
      display_type: 'Graphic IBN display with bargraph indicator',
      load_receptor: 'Diamond tread steel plate 1200 mm x 1200 mm with 4 IP68 load cells',
      power_supply: '230 V AC 50 Hz Mains',
      software_version: 'ZM-Firmware 1.22',
      identification_markings: 'Stamping plate affixed near junction box',
      photo_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
      status: 'rejected',
      created_at: new Date('2026-08-18').toISOString(),
      updated_at: new Date('2026-08-26').toISOString(),
    },
  ];

  // 5. Versioned OIML Rulesets
  const rulesets: RuleRelease[] = [
    {
      id: 'OIML-R76-2006',
      standard: 'OIML R 76-1',
      release_year: '2006',
      title: 'Non-automatic weighing instruments — Metrological and technical requirements — Tests',
      status: 'active',
      effective_date: '2006-10-01',
      rules: [
        {
          id: 'R76-Table-1',
          clause: '3.1 / Table 1',
          title: 'Accuracy Classes and Scale Interval Verification',
          description: 'Defines e, nMin, nMax, and Min capacity requirements for Classes I, II, III, and IIII.',
          applicable_tests: ['instrument_validation'],
          formula_summary: 'n = Max / e, limits per accuracy class.',
        },
        {
          id: 'R76-Table-3-MPE',
          clause: '3.5.1 / Table 3',
          title: 'Maximum Permissible Errors on Initial Verification',
          description: 'Specifies ±0.5e, ±1.0e, and ±1.5e limits according to accuracy class and load steps.',
          applicable_tests: ['weighing_performance', 'eccentricity', 'zero_tare'],
          formula_summary: '0.5e | 1.0e | 1.5e tiered by load in scale intervals.',
        },
        {
          id: 'R76-A44-Weighing',
          clause: 'A.4.4',
          title: 'Weighing Performance Test (Error of Indication)',
          description: 'Errors at increasing and decreasing loads must be within MPE for initial verification.',
          applicable_tests: ['weighing_performance'],
          formula_summary: 'E = I - L, |E| <= MPE(L).',
        },
        {
          id: 'R76-A410-Repeatability',
          clause: 'A.4.10',
          title: 'Repeatability Test',
          description: 'Difference between max and min indications at same load must not exceed 0.25e (if e <= 0.2g) or 0.5e (if e > 0.2g).',
          applicable_tests: ['repeatability'],
          formula_summary: 'Range = Max - Min <= permissible limit.',
        },
        {
          id: 'R76-A47-Eccentricity',
          clause: 'A.4.7',
          title: 'Eccentricity (Corner Load) Test',
          description: 'Test load = 1/3 Max placed at 4 quadrant positions. Deviation vs center reference must be within MPE.',
          applicable_tests: ['eccentricity'],
          formula_summary: 'Error = I_corner - I_center, |Error| <= MPE(Max/3).',
        },
        {
          id: 'R76-A413-Tare',
          clause: 'A.4.13',
          title: 'Tare Setting & Weighing Test',
          description: 'Errors of net indication with tare applied must not exceed MPE for the net load.',
          applicable_tests: ['zero_tare'],
          formula_summary: 'E_net = I_net - L_net, |E_net| <= MPE.',
        },
        {
          id: 'R76-A48-Discrimination',
          clause: 'A.4.8',
          title: 'Discrimination Test',
          description: 'Instrument must respond to addition of 0.4e small incremental weights.',
          applicable_tests: ['discrimination'],
          formula_summary: 'Delta I > 0 when 0.4e load is applied.',
        },
      ],
    },
    {
      id: 'LM-RULES-2011',
      standard: 'Legal Metrology (General) Rules, 2011',
      release_year: '2011',
      title: 'Indian National Standard for Non-Automatic Weighing Instruments',
      status: 'active',
      effective_date: '2011-04-01',
      rules: [
        {
          id: 'IN-LM-R76-Harmonized',
          clause: 'Seventh Schedule - Part I',
          title: 'Specifications for Non-Automatic Weighing Instruments',
          description: 'Harmonized Indian Legal Metrology specifications conforming to OIML R 76-1:2006.',
          applicable_tests: ['weighing_performance', 'repeatability', 'eccentricity', 'zero_tare'],
          formula_summary: 'Conforms to OIML R 76-1 Table 1 and Table 3.',
        },
      ],
    },
  ];

  // 6. Evaluation Cases & Test Data
  // Case 1: Approved Case (PWS-30 Pro)
  const case1Id = 'case-01';
  const case1: EvaluationCase = {
    id: case1Id,
    case_number: 'CASE-2026-001',
    instrument_id: 'ins-01',
    lab_id: 'lab-01',
    laboratory_name: labs[0].name,
    technician_id: 'usr-tech-01',
    technician_name: 'Rajesh Kumar, Senior Test Engineer',
    reviewer_id: 'usr-rev-01',
    reviewer_name: 'Dr. S. Ananth, Principal Metrologist',
    status: 'approved',
    revision: 1,
    rule_release_id: 'OIML-R76-2006',
    test_date: '2026-08-20',
    environmental_conditions: {
      temperature_start: 22.4,
      temperature_end: 22.8,
      humidity_start: 54.0,
      humidity_end: 56.5,
      atmospheric_pressure: 1013.2,
      recorded_at: '2026-08-20T09:30:00Z',
    },
    equipment_used_ids: ['eq-02', 'eq-04'],
    overall_result: 'pass',
    reviewer_comments: 'All tests (Weighing Performance, Repeatability, Eccentricity, Zero/Tare, Discrimination) meet OIML R 76-1:2006 Table 3 tolerances. Certificate approved for model approval issuance.',
    data_hash: 'sha256:8f4c2817d23a10e54b684992dc7a550991ab0b8e7c11f930129bc6223e71d43a',
    locked_at: '2026-08-20T16:45:00Z',
    created_at: '2026-08-20T09:00:00Z',
    updated_at: '2026-08-20T16:45:00Z',
  };

  // Case 1 Tests
  const ins1E = 0.01; // 10 g
  const ins1Cls = 'III';
  const test1Data: TestExecutionData = {
    weighing_tests: [
      evaluateWeighingPoint(0.2, ins1E, ins1Cls, 0.200, 0.200), // Min (20e) -> MPE = 0.5e = 0.005 kg
      evaluateWeighingPoint(5.0, ins1E, ins1Cls, 5.000, 5.000), // 500e -> MPE = 0.5e
      evaluateWeighingPoint(10.0, ins1E, ins1Cls, 10.005, 10.000), // 1000e -> MPE = 1.0e = 0.010 kg
      evaluateWeighingPoint(20.0, ins1E, ins1Cls, 20.005, 20.005), // 2000e -> MPE = 1.0e
      evaluateWeighingPoint(30.0, ins1E, ins1Cls, 30.010, 30.005), // Max (3000e) -> MPE = 1.5e = 0.015 kg
    ],
    repeatability_tests: [
      evaluateRepeatability(15.0, [15.000, 15.000, 15.005, 15.000, 15.005], ins1E), // 50% Max
      evaluateRepeatability(30.0, [30.005, 30.010, 30.005, 30.005, 30.010], ins1E), // Max
    ],
    eccentricity_tests: [
      evaluateEccentricity(
        10.0, // 1/3 Max = 10 kg
        10.000, // Center
        [
          { position: 'Front-Left', reading: 10.005 },
          { position: 'Back-Left', reading: 10.000 },
          { position: 'Back-Right', reading: 10.005 },
          { position: 'Front-Right', reading: 10.000 },
        ],
        ins1E,
        ins1Cls
      ),
    ],
    zero_tare_tests: [
      evaluateZeroTare(5.0, 10.0, 10.005, ins1E, ins1Cls),
      evaluateZeroTare(10.0, 15.0, 15.005, ins1E, ins1Cls),
    ],
    discrimination_tests: [
      evaluateDiscrimination(15.0, 15.000, 15.010),
    ],
  };

  // Case 2: Under Review (Sartorius Cubis II Class I)
  const case2Id = 'case-02';
  const case2: EvaluationCase = {
    id: case2Id,
    case_number: 'CASE-2026-002',
    instrument_id: 'ins-02',
    lab_id: 'lab-01',
    laboratory_name: labs[0].name,
    technician_id: 'usr-tech-01',
    technician_name: 'Rajesh Kumar, Senior Test Engineer',
    reviewer_id: 'usr-rev-01',
    reviewer_name: 'Dr. S. Ananth, Principal Metrologist',
    status: 'under_review',
    revision: 1,
    rule_release_id: 'OIML-R76-2006',
    test_date: '2026-08-25',
    environmental_conditions: {
      temperature_start: 20.1,
      temperature_end: 20.3,
      humidity_start: 48.0,
      humidity_end: 49.0,
      atmospheric_pressure: 1015.0,
      recorded_at: '2026-08-25T10:00:00Z',
    },
    equipment_used_ids: ['eq-01', 'eq-04'],
    overall_result: 'pass',
    created_at: '2026-08-25T09:30:00Z',
    updated_at: '2026-08-25T14:30:00Z',
  };

  const ins2E = 0.001; // 1 mg
  const ins2Cls = 'I';
  const test2Data: TestExecutionData = {
    weighing_tests: [
      evaluateWeighingPoint(0.1, ins2E, ins2Cls, 0.1000, 0.1000), // Min = 100e
      evaluateWeighingPoint(50.0, ins2E, ins2Cls, 50.0002, 50.0001), // 50,000e -> MPE = 0.5 mg
      evaluateWeighingPoint(100.0, ins2E, ins2Cls, 100.0005, 100.0004), // 100,000e -> MPE = 1.0 mg
      evaluateWeighingPoint(200.0, ins2E, ins2Cls, 200.0008, 200.0007), // 200,000e -> MPE = 1.0 mg
      evaluateWeighingPoint(220.0, ins2E, ins2Cls, 220.0011, 220.0010), // Max -> MPE = 1.5 mg
    ],
    repeatability_tests: [
      evaluateRepeatability(100.0, [100.0001, 100.0002, 100.0001, 100.0003, 100.0002], ins2E),
    ],
    eccentricity_tests: [
      evaluateEccentricity(
        70.0, // ~1/3 Max
        70.0000,
        [
          { position: 'Front-Left', reading: 70.0003 },
          { position: 'Back-Left', reading: 70.0002 },
          { position: 'Back-Right', reading: 70.0004 },
          { position: 'Front-Right', reading: 70.0002 },
        ],
        ins2E,
        ins2Cls
      ),
    ],
    zero_tare_tests: [
      evaluateZeroTare(50.0, 50.0, 50.0003, ins2E, ins2Cls),
    ],
    discrimination_tests: [
      evaluateDiscrimination(100.0, 100.0000, 100.0005),
    ],
  };

  // Case 3: Rejected / Revision Needed (Avery FL1500 with deliberate Eccentricity FAIL)
  const case3Id = 'case-03';
  const case3: EvaluationCase = {
    id: case3Id,
    case_number: 'CASE-2026-003',
    instrument_id: 'ins-03',
    lab_id: 'lab-01',
    laboratory_name: labs[0].name,
    technician_id: 'usr-tech-01',
    technician_name: 'Rajesh Kumar, Senior Test Engineer',
    reviewer_id: 'usr-rev-01',
    reviewer_name: 'Dr. S. Ananth, Principal Metrologist',
    status: 'rejected',
    revision: 1,
    rule_release_id: 'OIML-R76-2006',
    test_date: '2026-08-26',
    environmental_conditions: {
      temperature_start: 24.5,
      temperature_end: 25.1,
      humidity_start: 62.0,
      humidity_end: 64.0,
      atmospheric_pressure: 1010.5,
      recorded_at: '2026-08-26T11:00:00Z',
    },
    equipment_used_ids: ['eq-03', 'eq-04'],
    overall_result: 'fail',
    rejection_reason: 'Eccentricity test failed at Back-Right load cell position (observed error +1.5 kg exceeds MPE ±0.5 kg). Re-level platform and calibrate corner trim potentiometer before resubmission.',
    created_at: '2026-08-26T10:30:00Z',
    updated_at: '2026-08-26T17:00:00Z',
  };

  const ins3E = 0.5; // 0.5 kg (500 g)
  const ins3Cls = 'III';
  const test3Data: TestExecutionData = {
    weighing_tests: [
      evaluateWeighingPoint(10.0, ins3E, ins3Cls, 10.0, 10.0),
      evaluateWeighingPoint(250.0, ins3E, ins3Cls, 250.0, 250.0),
      evaluateWeighingPoint(750.0, ins3E, ins3Cls, 750.5, 750.0),
      evaluateWeighingPoint(1500.0, ins3E, ins3Cls, 1500.5, 1500.5),
    ],
    repeatability_tests: [
      evaluateRepeatability(750.0, [750.0, 750.5, 750.0, 750.5, 750.0], ins3E),
    ],
    eccentricity_tests: [
      evaluateEccentricity(
        500.0, // 1/3 Max = 500 kg -> 1000e -> MPE = 1.0e = 0.5 kg
        500.0,
        [
          { position: 'Front-Left', reading: 500.0 },
          { position: 'Back-Left', reading: 500.5 },
          { position: 'Back-Right', reading: 501.5 }, // FAIL: error = +1.5 kg, MPE = 0.5 kg!
          { position: 'Front-Right', reading: 500.0 },
        ],
        ins3E,
        ins3Cls
      ),
    ],
    zero_tare_tests: [
      evaluateZeroTare(200.0, 500.0, 500.5, ins3E, ins3Cls),
    ],
    discrimination_tests: [
      evaluateDiscrimination(500.0, 500.0, 500.5),
    ],
  };

  // 7. Evidence
  const evidenceItems: Evidence[] = [
    {
      id: 'ev-01',
      case_id: case1Id,
      test_type: 'weighing_performance',
      category: 'nameplate',
      title: 'PWS-30 Pro Stamping & Identification Nameplate Photo',
      file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      file_type: 'image/jpeg',
      uploader_name: 'Rajesh Kumar',
      remarks: 'Metallic nameplate with serial number PWS30-2026-00125 clearly visible and verified.',
      timestamp: '2026-08-20T10:15:00Z',
    },
    {
      id: 'ev-02',
      case_id: case1Id,
      test_type: 'eccentricity',
      category: 'test_setup',
      title: 'Corner Loading Test Setup with 10 kg F1 Test Weights',
      file_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
      file_type: 'image/jpeg',
      uploader_name: 'Rajesh Kumar',
      remarks: 'Weights positioned centrally on quadrant 2 (Back-Left).',
      timestamp: '2026-08-20T12:00:00Z',
    },
    {
      id: 'ev-03',
      case_id: case3Id,
      test_type: 'eccentricity',
      category: 'error_indication',
      title: 'Eccentricity Over-Tolerance Observation on Display',
      file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      file_type: 'image/jpeg',
      uploader_name: 'Rajesh Kumar',
      remarks: 'Back-Right corner reading 501.5 kg (deviation +1.5 kg exceeding ±0.5 kg MPE).',
      timestamp: '2026-08-26T14:15:00Z',
    },
  ];

  // 8. Audit Logs
  const auditLogs: AuditEvent[] = [
    {
      id: 'aud-01',
      actor_id: 'usr-tech-01',
      actor_name: 'Rajesh Kumar (Technician)',
      actor_role: 'technician',
      action: 'CREATE_EVALUATION_CASE',
      entity_type: 'EvaluationCase',
      entity_id: case1Id,
      after_value: 'Created CASE-2026-001 for instrument PWS-30 Pro (Class III)',
      reason: 'Initiating initial type-evaluation compliance testing',
      timestamp: '2026-08-20T09:00:00Z',
    },
    {
      id: 'aud-02',
      actor_id: 'usr-tech-01',
      actor_name: 'Rajesh Kumar (Technician)',
      actor_role: 'technician',
      action: 'SUBMIT_FOR_REVIEW',
      entity_type: 'EvaluationCase',
      entity_id: case1Id,
      before_value: 'in_progress',
      after_value: 'submitted',
      reason: 'All 5 test procedures completed with PASS outcome',
      timestamp: '2026-08-20T14:30:00Z',
    },
    {
      id: 'aud-03',
      actor_id: 'usr-rev-01',
      actor_name: 'Dr. S. Ananth (Reviewer)',
      actor_role: 'reviewer',
      action: 'APPROVE_AND_LOCK_REPORT',
      entity_type: 'EvaluationCase',
      entity_id: case1Id,
      before_value: 'under_review',
      after_value: 'approved',
      reason: 'Verified observations and deterministic calculation traces. Generated immutable hash.',
      timestamp: '2026-08-20T16:45:00Z',
    },
    {
      id: 'aud-04',
      actor_id: 'usr-rev-01',
      actor_name: 'Dr. S. Ananth (Reviewer)',
      actor_role: 'reviewer',
      action: 'REJECT_AND_REQUEST_CORRECTION',
      entity_type: 'EvaluationCase',
      entity_id: case3Id,
      before_value: 'under_review',
      after_value: 'rejected',
      reason: 'Eccentricity corner deviation (+1.5 kg) exceeds MPE (±0.5 kg) per OIML R 76-1 A.4.7',
      timestamp: '2026-08-26T17:00:00Z',
    },
  ];

  // Save all to DB
  db.set({
    laboratories: labs,
    users: users,
    equipment: equipment,
    instruments: instruments,
    rulesets: rulesets,
    cases: [case1, case2, case3],
    test_executions: {
      [case1Id]: test1Data,
      [case2Id]: test2Data,
      [case3Id]: test3Data,
    },
    evidence: evidenceItems,
    audit_events: auditLogs,
  });

  console.log('✅ Database seeded successfully with 3 instruments, 3 test cases, 4 users, and 4 audit events.');
}

// If run directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedData();
}
