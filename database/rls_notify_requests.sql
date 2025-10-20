-- RLS policies and grants for notify_requests
-- Run this in Supabase SQL Editor to restrict access to authenticated users only.

-- Enable row level security on the table
ALTER TABLE public.notify_requests
  ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to SELECT
CREATE POLICY IF NOT EXISTS notify_requests_select_authenticated
  ON public.notify_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: allow authenticated users to INSERT
CREATE POLICY IF NOT EXISTS notify_requests_insert_authenticated
  ON public.notify_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Revoke public execute on the RPC and grant to authenticated role only
REVOKE EXECUTE ON FUNCTION public.insert_notify_request(text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.insert_notify_request(text, text, text, text, text) TO authenticated;

-- Note: the function was created with SECURITY DEFINER, so it will execute with the owner's
-- privileges and will be able to insert rows even with RLS enabled. Adjust the function owner
-- and the grants if you want different behavior.
