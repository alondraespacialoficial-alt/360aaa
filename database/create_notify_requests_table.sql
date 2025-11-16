-- Create table for storing notify requests when no providers available
BEGIN;

CREATE TABLE IF NOT EXISTS notify_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  city text NOT NULL,
  category text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notify_requests_city ON notify_requests (lower(city));

COMMIT;
