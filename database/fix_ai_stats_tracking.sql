-- ==========================================
-- ARREGLAR TRACKING DE ESTADÍSTICAS DE IA
-- Crea las funciones RPC necesarias
-- ==========================================

-- 0. ELIMINAR FUNCIONES EXISTENTES (si existen)
DROP FUNCTION IF EXISTS log_ai_usage(uuid,character varying,uuid,text,text,integer,integer,numeric,integer);
DROP FUNCTION IF EXISTS log_ai_usage;
DROP FUNCTION IF EXISTS get_ai_stats(text);
DROP FUNCTION IF EXISTS get_ai_stats;

-- 1. FUNCIÓN: Registrar uso de IA
CREATE OR REPLACE FUNCTION log_ai_usage(
  p_session_id UUID,
  p_user_ip VARCHAR,
  p_user_id UUID,
  p_question TEXT,
  p_response TEXT,
  p_tokens_input INTEGER,
  p_tokens_output INTEGER,
  p_cost_usd DECIMAL(10,6),
  p_processing_time_ms INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_usage_tracking (
    session_id,
    user_ip,
    user_id,
    question,
    response,
    tokens_input,
    tokens_output,
    cost_usd,
    processing_time_ms,
    created_at
  ) VALUES (
    p_session_id,
    p_user_ip,
    p_user_id,
    p_question,
    p_response,
    p_tokens_input,
    p_tokens_output,
    p_cost_usd,
    p_processing_time_ms,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNCIÓN: Obtener estadísticas de IA
CREATE OR REPLACE FUNCTION get_ai_stats(p_period TEXT)
RETURNS TABLE (
  period TEXT,
  total_questions BIGINT,
  total_cost_usd DECIMAL,
  avg_processing_time_ms DECIMAL,
  total_tokens_input BIGINT,
  total_tokens_output BIGINT,
  unique_users BIGINT,
  top_questions JSONB
) AS $$
DECLARE
  start_date TIMESTAMP;
BEGIN
  -- Determinar fecha de inicio según el período
  CASE p_period
    WHEN 'today' THEN
      start_date := DATE_TRUNC('day', NOW());
    WHEN 'week' THEN
      start_date := DATE_TRUNC('week', NOW());
    WHEN 'month' THEN
      start_date := DATE_TRUNC('month', NOW());
    ELSE
      start_date := DATE_TRUNC('day', NOW());
  END CASE;

  RETURN QUERY
  SELECT
    p_period AS period,
    COUNT(*)::BIGINT AS total_questions,
    COALESCE(SUM(cost_usd), 0)::DECIMAL AS total_cost_usd,
    COALESCE(AVG(processing_time_ms), 0)::DECIMAL AS avg_processing_time_ms,
    COALESCE(SUM(tokens_input), 0)::BIGINT AS total_tokens_input,
    COALESCE(SUM(tokens_output), 0)::BIGINT AS total_tokens_output,
    COUNT(DISTINCT COALESCE(user_id::TEXT, user_ip))::BIGINT AS unique_users,
    COALESCE(
      (
        SELECT JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'question', question,
            'count', question_count
          )
        )
        FROM (
          SELECT 
            question,
            COUNT(*) AS question_count
          FROM ai_usage_tracking
          WHERE created_at >= start_date
          GROUP BY question
          ORDER BY question_count DESC
          LIMIT 5
        ) top_q
      ),
      '[]'::JSONB
    ) AS top_questions
  FROM ai_usage_tracking
  WHERE created_at >= start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificar que la tabla ai_usage_tracking existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_usage_tracking') THEN
    CREATE TABLE ai_usage_tracking (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id UUID NOT NULL,
      user_ip VARCHAR(45),
      user_id UUID REFERENCES auth.users(id),
      question TEXT NOT NULL,
      response TEXT NOT NULL,
      tokens_input INTEGER DEFAULT 0,
      tokens_output INTEGER DEFAULT 0,
      cost_usd DECIMAL(10,6) DEFAULT 0,
      processing_time_ms INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Índices para performance
    CREATE INDEX idx_ai_usage_created_at ON ai_usage_tracking(created_at DESC);
    CREATE INDEX idx_ai_usage_user_id ON ai_usage_tracking(user_id);
    CREATE INDEX idx_ai_usage_user_ip ON ai_usage_tracking(user_ip);
    CREATE INDEX idx_ai_usage_session_id ON ai_usage_tracking(session_id);
  END IF;
END $$;

-- 4. Dar permisos de ejecución a funciones RPC
GRANT EXECUTE ON FUNCTION log_ai_usage TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ai_stats TO anon, authenticated;

-- 5. Probar las funciones
-- Insertar un registro de prueba
SELECT log_ai_usage(
  uuid_generate_v4(),
  '127.0.0.1',
  NULL,
  'Pregunta de prueba',
  'Respuesta de prueba',
  10,
  20,
  0.0001,
  150
);

-- Ver estadísticas de hoy
SELECT * FROM get_ai_stats('today');

-- Ver últimos 5 registros
SELECT 
  question,
  cost_usd,
  tokens_input,
  tokens_output,
  created_at
FROM ai_usage_tracking
ORDER BY created_at DESC
LIMIT 5;

-- ✅ RESULTADO ESPERADO
SELECT '✅ Funciones RPC creadas - El tracking de IA ya funciona' as resultado;
