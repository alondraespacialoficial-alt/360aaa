-- Crear RPC para registrar feedback de usuario sobre una interacción AI
-- Requiere permisos de administrador para crear
CREATE OR REPLACE FUNCTION public.log_ai_feedback(
  p_feedback boolean,
  p_usage_id uuid,
  p_user_id uuid,
  p_user_ip text,
  p_comment text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Si se proporcionó un usage_id conocido, actualizar esa fila
  IF p_usage_id IS NOT NULL THEN
    UPDATE public.ai_usage_tracking
    SET user_feedback = p_feedback,
        feedback_comment = p_comment,
        feedback_at = now()
    WHERE id = p_usage_id;
    RETURN;
  END IF;

  -- Si no se proporcionó usage_id, intentar actualizar la última fila del usuario/IP
  IF p_user_id IS NOT NULL OR p_user_ip IS NOT NULL THEN
    UPDATE public.ai_usage_tracking
    SET user_feedback = p_feedback,
        feedback_comment = p_comment,
        feedback_at = now()
    WHERE id = (
      SELECT id FROM public.ai_usage_tracking
      WHERE (p_user_id IS NOT NULL AND user_id = p_user_id) OR (p_user_ip IS NOT NULL AND user_ip = p_user_ip)
      ORDER BY created_at DESC
      LIMIT 1
    );
    RETURN;
  END IF;

  -- Si no hay información de usuario, insertar una fila mínima para seguimiento
  INSERT INTO public.ai_usage_tracking (session_id, user_ip, question, response, tokens_input, tokens_output, cost_usd, processing_time_ms, user_feedback, feedback_comment, feedback_at)
  VALUES (gen_random_uuid()::uuid, p_user_ip, 'feedback_only', 'feedback_only', 0, 0, 0, 0, p_feedback, p_comment, now());
END;
$function$;

-- Nota: Esta función asume que la tabla ai_usage_tracking existe y que la función gen_random_uuid() está disponible (pgcrypto extension).
