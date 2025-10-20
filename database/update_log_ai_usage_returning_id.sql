-- Actualizar/Crear RPC log_ai_usage para retornar el id de la fila insertada
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

-- Nota: Requiere permisos para INSERT en ai_usage_tracking. Asegúrate de ajustar RLS si aplica.
