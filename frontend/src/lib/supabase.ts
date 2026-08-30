/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Instrument {
  id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  accuracy_class: string;
  max_capacity: number;
  verification_scale_interval: number;
  min_capacity: number | null;
  number_of_scale_intervals: number | null;
  tare_max: number | null;
  created_at: string;
}

export interface Report {
  id: string;
  instrument_id: string;
  report_number: string | null;
  lab_name: string | null;
  technician: string | null;
  test_date: string | null;
  temperature: number | null;
  humidity: number | null;
  status: string;
  overall_result: string;
  notes: string | null;
  created_at: string;
}

export interface WeighingTest {
  id: string;
  report_id: string;
  seq: number;
  load: number;
  indication: number | null;
  increasing_error: number | null;
  decreasing_error: number | null;
  mpe: number | null;
  pass: boolean;
}

export interface RepeatabilityTest {
  id: string;
  report_id: string;
  load: number;
  readings: number[];
  std_dev: number | null;
  range: number | null;
  mpe: number | null;
  pass: boolean;
}

export interface EccentricityTest {
  id: string;
  report_id: string;
  test_load: number;
  center_reading: number | null;
  positions: { position: string; reading: number | null; error: number | null }[];
  max_error: number | null;
  mpe: number | null;
  pass: boolean;
}

export interface DiscriminationTest {
  id: string;
  report_id: string;
  test_load: number;
  readings: number[];
  pass: boolean;
}

export interface TareTest {
  id: string;
  report_id: string;
  tare_load: number;
  net_indication: number | null;
  error: number | null;
  mpe: number | null;
  pass: boolean;
}

export interface ReportWithInstrument extends Report {
  instrument?: Instrument;
}

export interface FullReport extends Report {
  instrument?: Instrument;
  weighing_tests?: WeighingTest[];
  repeatability_tests?: RepeatabilityTest[];
  eccentricity_tests?: EccentricityTest[];
  discrimination_tests?: DiscriminationTest[];
  tare_tests?: TareTest[];
}
