DO $$
BEGIN
  IF to_regclass('public.metrix_users') IS NOT NULL AND to_regclass('public.users') IS NULL THEN
    ALTER TABLE public.metrix_users RENAME TO users;
  END IF;
  IF to_regclass('public.metrix_laboratories') IS NOT NULL AND to_regclass('public.laboratories') IS NULL THEN
    ALTER TABLE public.metrix_laboratories RENAME TO laboratories;
  END IF;
  IF to_regclass('public.metrix_equipment') IS NOT NULL AND to_regclass('public.equipment') IS NULL THEN
    ALTER TABLE public.metrix_equipment RENAME TO equipment;
  END IF;
  IF to_regclass('public.metrix_cases') IS NOT NULL AND to_regclass('public.cases') IS NULL THEN
    ALTER TABLE public.metrix_cases RENAME TO cases;
  END IF;
  IF to_regclass('public.metrix_test_executions') IS NOT NULL AND to_regclass('public.test_executions') IS NULL THEN
    ALTER TABLE public.metrix_test_executions RENAME TO test_executions;
  END IF;
  IF to_regclass('public.metrix_evidence') IS NOT NULL AND to_regclass('public.evidence') IS NULL THEN
    ALTER TABLE public.metrix_evidence RENAME TO evidence;
  END IF;
  IF to_regclass('public.metrix_audit_events') IS NOT NULL AND to_regclass('public.audit_events') IS NULL THEN
    ALTER TABLE public.metrix_audit_events RENAME TO audit_events;
  END IF;
  IF to_regclass('public.metrix_rulesets') IS NOT NULL AND to_regclass('public.rulesets') IS NULL THEN
    ALTER TABLE public.metrix_rulesets RENAME TO rulesets;
  END IF;
END $$;

ALTER TABLE IF EXISTS audit_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

CREATE TABLE IF NOT EXISTS audit_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_event_id text NOT NULL REFERENCES audit_events(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by text,
  note text
);

CREATE INDEX IF NOT EXISTS idx_audit_status_history_event
  ON audit_status_history (audit_event_id, changed_at DESC);