CREATE TABLE IF NOT EXISTS metrix_users (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrix_laboratories (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrix_instruments (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrix_equipment (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrix_cases (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrix_test_executions (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrix_evidence (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrix_audit_events (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrix_rulesets (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrix_reports (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrix_cases_data ON metrix_cases USING gin (data);
CREATE INDEX IF NOT EXISTS idx_metrix_instruments_data ON metrix_instruments USING gin (data);
CREATE INDEX IF NOT EXISTS idx_metrix_audit_events_created_at ON metrix_audit_events (created_at DESC);

ALTER TABLE metrix_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrix_laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrix_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrix_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrix_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrix_test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrix_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrix_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrix_rulesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrix_reports ENABLE ROW LEVEL SECURITY;

-- The Express backend connects with the server-side database URL.
-- No anon/authenticated client policies are granted.
