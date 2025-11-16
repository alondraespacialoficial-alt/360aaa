-- Canonicalize log_ai_usage: drop common overloads and create a single function
-- that returns the inserted ai_usage_tracking.id (uuid).

BEGIN;

-- Conservative drops for known conflicting signatures (no-op if missing)
DROP FUNCTION IF EXISTS public.log_ai_usage(text, text, uuid, text, text, integer, integer, numeric, integer, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.log_ai_usage(uuid, text, uuid, text, text, integer, integer, numeric, integer, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.log_ai_usage(text, text, text, text, text, integer, integer, numeric, integer, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.log_ai_usage(text, text, uuid, text, text, integer, integer, numeric, integer);
DROP FUNCTION IF EXISTS public.log_ai_usage(text, text, text, text, text, integer, integer, numeric, integer);
DROP FUNCTION IF EXISTS public.log_ai_usage(uuid, character varying, uuid, text, text, integer, integer, numeric, integer, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.log_ai_usage(uuid, character varying, uuid, text, text, integer, integer, numeric, integer);
DROP FUNCTION IF EXISTS public.log_ai_usage(uuid, character varying, uuid, text, text, integer, integer, numeric);
DROP FUNCTION IF EXISTS public.log_ai_usage;

-- Single canonical function with required params first and optional defaults after
CREATE OR REPLACE FUNCTION public.log_ai_usage(
  p_session_id uuid,
  p_user_ip text,
  p_user_id uuid,
  p_question text,
  p_response text,
  p_tokens_input integer,
  p_tokens_output integer,
  p_cost_usd numeric,
  p_processing_time_ms integer,
  p_sources_used jsonb DEFAULT NULL,
  p_ranking_scores jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.ai_usage_tracking (
    session_id, user_ip, user_id, question, response, tokens_input, tokens_output, cost_usd, processing_time_ms, sources_used, ranking_scores, created_at
  ) VALUES (
    p_session_id, p_user_ip, p_user_id, p_question, p_response, p_tokens_input, p_tokens_output, p_cost_usd, p_processing_time_ms, p_sources_used, p_ranking_scores, now()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

-- Security: restrict execution to authenticated role (recommended)
REVOKE EXECUTE ON FUNCTION public.log_ai_usage(uuid, text, uuid, text, text, integer, integer, numeric, integer, jsonb, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.log_ai_usage(uuid, text, uuid, text, text, integer, integer, numeric, integer, jsonb, jsonb) TO authenticated;

COMMIT;

-- Verification helper (run separately if desired):
-- SELECT p.oid::regprocedure AS signature, pg_get_function_arguments(p.oid) AS args, pg_get_userbyid(p.proowner) AS owner, n.nspname AS schema_name
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE p.proname = 'log_ai_usage';

