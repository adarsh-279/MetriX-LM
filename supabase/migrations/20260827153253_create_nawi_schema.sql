/*
# OIML R-76 NAWI Test Report Generator — Schema

## Purpose
Single-tenant prototype app for generating test reports for Non-Automatic
Weighing Instruments (NAWI) per OIML Recommendation R-76. No auth screen.

## New Tables
1. `instruments` — registered weighing instruments under test
   - id, name, manufacturer, model, serial_number, accuracy_class (I/II/III/IIII),
     max_capacity (Max), verification_scale_interval (e), min_capacity (Min),
     number_of_scale_intervals (n), tare_max, created_at
2. `reports` — a test report session for an instrument
   - id, instrument_id (FK), report_number, lab_name, technician, test_date,
     temperature, humidity, status (draft/completed), overall_result (pass/fail),
     created_at
3. `weighing_tests` — weighing performance test points (errors of indication)
   - id, report_id (FK), load, indication, increasing_error, decreasing_error,
     mpe, pass (bool), seq
4. `repeatability_tests` — repeatability test readings
   - id, report_id (FK), load, readings (jsonb array), std_dev, range, mpe, pass
5. `eccentricity_tests` — eccentricity (corner load) test
   - id, report_id (FK), test_load, center_reading, positions (jsonb array of {position, reading, error}),
     max_error, mpe, pass
6. `discrimination_tests` — discrimination test
   - id, report_id (FK), test_load, readings (jsonb array), pass
7. `tare_tests` — tare test results
   - id, report_id (FK), tare_load, net_indication, error, mpe, pass

## Security
- RLS enabled on all tables.
- No auth screen → anon + authenticated CRUD (data intentionally shared).
*/

CREATE TABLE IF NOT EXISTS instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  manufacturer text,
  model text,
  serial_number text,
  accuracy_class text NOT NULL DEFAULT 'III',
  max_capacity numeric NOT NULL,
  verification_scale_interval numeric NOT NULL,
  min_capacity numeric,
  number_of_scale_intervals integer,
  tare_max numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  report_number text,
  lab_name text,
  technician text,
  test_date date DEFAULT CURRENT_DATE,
  temperature numeric,
  humidity numeric,
  status text NOT NULL DEFAULT 'draft',
  overall_result text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weighing_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  seq integer NOT NULL DEFAULT 0,
  load numeric NOT NULL,
  indication numeric,
  increasing_error numeric,
  decreasing_error numeric,
  mpe numeric,
  pass boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS repeatability_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  load numeric NOT NULL,
  readings jsonb NOT NULL DEFAULT '[]'::jsonb,
  std_dev numeric,
  range numeric,
  mpe numeric,
  pass boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS eccentricity_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  test_load numeric NOT NULL,
  center_reading numeric,
  positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_error numeric,
  mpe numeric,
  pass boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS discrimination_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  test_load numeric NOT NULL,
  readings jsonb NOT NULL DEFAULT '[]'::jsonb,
  pass boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS tare_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  tare_load numeric NOT NULL,
  net_indication numeric,
  error numeric,
  mpe numeric,
  pass boolean DEFAULT true
);

ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE weighing_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE repeatability_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE eccentricity_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE discrimination_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tare_tests ENABLE ROW LEVEL SECURITY;

-- instruments policies
DROP POLICY IF EXISTS "anon_select_instruments" ON instruments;
CREATE POLICY "anon_select_instruments" ON instruments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_instruments" ON instruments;
CREATE POLICY "anon_insert_instruments" ON instruments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_instruments" ON instruments;
CREATE POLICY "anon_update_instruments" ON instruments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_instruments" ON instruments;
CREATE POLICY "anon_delete_instruments" ON instruments FOR DELETE TO anon, authenticated USING (true);

-- reports policies
DROP POLICY IF EXISTS "anon_select_reports" ON reports;
CREATE POLICY "anon_select_reports" ON reports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_reports" ON reports;
CREATE POLICY "anon_insert_reports" ON reports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_reports" ON reports;
CREATE POLICY "anon_update_reports" ON reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_reports" ON reports;
CREATE POLICY "anon_delete_reports" ON reports FOR DELETE TO anon, authenticated USING (true);

-- weighing_tests policies
DROP POLICY IF EXISTS "anon_select_weighing_tests" ON weighing_tests;
CREATE POLICY "anon_select_weighing_tests" ON weighing_tests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_weighing_tests" ON weighing_tests;
CREATE POLICY "anon_insert_weighing_tests" ON weighing_tests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_weighing_tests" ON weighing_tests;
CREATE POLICY "anon_update_weighing_tests" ON weighing_tests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_weighing_tests" ON weighing_tests;
CREATE POLICY "anon_delete_weighing_tests" ON weighing_tests FOR DELETE TO anon, authenticated USING (true);

-- repeatability_tests policies
DROP POLICY IF EXISTS "anon_select_repeatability_tests" ON repeatability_tests;
CREATE POLICY "anon_select_repeatability_tests" ON repeatability_tests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_repeatability_tests" ON repeatability_tests;
CREATE POLICY "anon_insert_repeatability_tests" ON repeatability_tests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_repeatability_tests" ON repeatability_tests;
CREATE POLICY "anon_update_repeatability_tests" ON repeatability_tests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_repeatability_tests" ON repeatability_tests;
CREATE POLICY "anon_delete_repeatability_tests" ON repeatability_tests FOR DELETE TO anon, authenticated USING (true);

-- eccentricity_tests policies
DROP POLICY IF EXISTS "anon_select_eccentricity_tests" ON eccentricity_tests;
CREATE POLICY "anon_select_eccentricity_tests" ON eccentricity_tests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_eccentricity_tests" ON eccentricity_tests;
CREATE POLICY "anon_insert_eccentricity_tests" ON eccentricity_tests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_eccentricity_tests" ON eccentricity_tests;
CREATE POLICY "anon_update_eccentricity_tests" ON eccentricity_tests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_eccentricity_tests" ON eccentricity_tests;
CREATE POLICY "anon_delete_eccentricity_tests" ON eccentricity_tests FOR DELETE TO anon, authenticated USING (true);

-- discrimination_tests policies
DROP POLICY IF EXISTS "anon_select_discrimination_tests" ON discrimination_tests;
CREATE POLICY "anon_select_discrimination_tests" ON discrimination_tests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_discrimination_tests" ON discrimination_tests;
CREATE POLICY "anon_insert_discrimination_tests" ON discrimination_tests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_discrimination_tests" ON discrimination_tests;
CREATE POLICY "anon_update_discrimination_tests" ON discrimination_tests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_discrimination_tests" ON discrimination_tests;
CREATE POLICY "anon_delete_discrimination_tests" ON discrimination_tests FOR DELETE TO anon, authenticated USING (true);

-- tare_tests policies
DROP POLICY IF EXISTS "anon_select_tare_tests" ON tare_tests;
CREATE POLICY "anon_select_tare_tests" ON tare_tests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tare_tests" ON tare_tests;
CREATE POLICY "anon_insert_tare_tests" ON tare_tests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tare_tests" ON tare_tests;
CREATE POLICY "anon_update_tare_tests" ON tare_tests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tare_tests" ON tare_tests;
CREATE POLICY "anon_delete_tare_tests" ON tare_tests FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_reports_instrument ON reports(instrument_id);
CREATE INDEX IF NOT EXISTS idx_weighing_report ON weighing_tests(report_id);
CREATE INDEX IF NOT EXISTS idx_repeatability_report ON repeatability_tests(report_id);
CREATE INDEX IF NOT EXISTS idx_eccentricity_report ON eccentricity_tests(report_id);
CREATE INDEX IF NOT EXISTS idx_discrimination_report ON discrimination_tests(report_id);
CREATE INDEX IF NOT EXISTS idx_tare_report ON tare_tests(report_id);
