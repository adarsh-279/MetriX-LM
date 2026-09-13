CREATE TABLE IF NOT EXISTS metrix_app_state (
  id text PRIMARY KEY,
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE metrix_app_state ENABLE ROW LEVEL SECURITY;

-- The backend connects with the server-side database URL and owns this table.
-- No client-facing policy is intentionally granted.