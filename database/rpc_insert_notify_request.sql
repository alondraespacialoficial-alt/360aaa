-- RPC to insert a notify request
CREATE OR REPLACE FUNCTION insert_notify_request(
  p_email text,
  p_phone text,
  p_city text,
  p_category text DEFAULT null,
  p_notes text DEFAULT null
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO notify_requests (email, phone, city, category, notes)
  VALUES (p_email, p_phone, lower(trim(p_city)), p_category, p_notes)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Grant execute to anon/role if necessary (review RLS policies separately)
-- GRANT EXECUTE ON FUNCTION insert_notify_request(text, text, text, text, text) TO anon;
