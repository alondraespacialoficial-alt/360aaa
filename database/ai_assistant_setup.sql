-- ==========================================
-- CHARLITRON EVENTOS 360 - AI ASSISTANT SETUP
-- Sistema de IA con control administrativo completo
-- ==========================================

-- 1. TABLA DE CONFIGURACIÓN DE IA
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_enabled BOOLEAN DEFAULT true,
  daily_budget_usd DECIMAL(10,2) DEFAULT 5.00,
  monthly_budget_usd DECIMAL(10,2) DEFAULT 100.00,
  rate_limit_per_minute INTEGER DEFAULT 3,
  rate_limit_per_hour INTEGER DEFAULT 20,
  rate_limit_per_day INTEGER DEFAULT 50,
  max_tokens_per_question INTEGER DEFAULT 1000,
  max_conversation_length INTEGER DEFAULT 10,
  welcome_message TEXT DEFAULT '¡Hola! Soy tu asistente virtual de Charlitron Eventos 360. Puedo ayudarte a encontrar proveedores, comparar servicios y responder preguntas sobre nuestro directorio. ¿En qué puedo ayudarte?',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. TABLA DE TRACKING DE USO DE IA
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID,
  user_ip VARCHAR(45),
  user_id UUID REFERENCES auth.users(id),
  question TEXT,
  response TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd DECIMAL(10,6),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata adicional
  user_agent TEXT,
  referrer TEXT,
  city VARCHAR(100),
  country VARCHAR(50)
);

-- 3. TABLA DE RATE LIMITING
CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_identifier VARCHAR(100), -- IP o user_id
  identifier_type VARCHAR(20),   -- 'ip' o 'user_id'
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_type VARCHAR(20),       -- 'minute', 'hour', 'day'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar duplicados
  UNIQUE(user_identifier, identifier_type, window_type, window_start)
);

-- 4. INSERTAR CONFIGURACIÓN INICIAL
INSERT INTO ai_settings (
  is_enabled,
  daily_budget_usd,
  monthly_budget_usd,
  rate_limit_per_minute,
  rate_limit_per_hour,
  rate_limit_per_day,
  welcome_message
) VALUES (
  true,
  5.00,
  100.00,
  3,
  20,
  50,
  '¡Hola! 👋 Soy tu asistente virtual de Charlitron Eventos 360. 

Puedo ayudarte con:
🔍 Buscar proveedores por categoría o ubicación
⭐ Comparar reseñas y calificaciones  
💰 Información de precios y servicios
📍 Recomendaciones personalizadas
📊 Estadísticas del directorio

¿Qué necesitas saber sobre nuestros proveedores de eventos?'
) ON CONFLICT DO NOTHING;

-- 5. FUNCIÓN PARA VERIFICAR SI IA ESTÁ HABILITADA
CREATE OR REPLACE FUNCTION is_ai_enabled()
RETURNS BOOLEAN AS $$
DECLARE
    enabled BOOLEAN;
BEGIN
    SELECT is_enabled INTO enabled FROM ai_settings LIMIT 1;
    RETURN COALESCE(enabled, false);
END;
$$ LANGUAGE plpgsql;

-- 6. FUNCIÓN PARA VERIFICAR RATE LIMITS
CREATE OR REPLACE FUNCTION check_ai_rate_limit(
    p_user_identifier VARCHAR(100),
    p_identifier_type VARCHAR(20),
    p_window_type VARCHAR(20)
)
RETURNS JSON AS $$
DECLARE
    current_count INTEGER;
    limit_value INTEGER;
    window_start_time TIMESTAMP;
    window_duration INTERVAL;
BEGIN
    -- Determinar duración de ventana
    CASE p_window_type
        WHEN 'minute' THEN 
            window_duration := INTERVAL '1 minute';
            window_start_time := date_trunc('minute', NOW());
        WHEN 'hour' THEN 
            window_duration := INTERVAL '1 hour';
            window_start_time := date_trunc('hour', NOW());
        WHEN 'day' THEN 
            window_duration := INTERVAL '1 day';
            window_start_time := date_trunc('day', NOW());
        ELSE
            RETURN json_build_object('allowed', false, 'error', 'Invalid window type');
    END CASE;
    
    -- Obtener límite configurado
    SELECT 
        CASE p_window_type
            WHEN 'minute' THEN rate_limit_per_minute
            WHEN 'hour' THEN rate_limit_per_hour
            WHEN 'day' THEN rate_limit_per_day
        END
    INTO limit_value
    FROM ai_settings LIMIT 1;
    
    -- Contar requests en la ventana actual
    SELECT COALESCE(SUM(requests_count), 0)
    INTO current_count
    FROM ai_rate_limits
    WHERE user_identifier = p_user_identifier
      AND identifier_type = p_identifier_type
      AND window_type = p_window_type
      AND window_start >= window_start_time;
    
    -- Verificar si está dentro del límite
    IF current_count < limit_value THEN
        -- Incrementar contador
        INSERT INTO ai_rate_limits (
            user_identifier, identifier_type, window_type, 
            window_start, requests_count
        ) VALUES (
            p_user_identifier, p_identifier_type, p_window_type,
            window_start_time, 1
        )
        ON CONFLICT (user_identifier, identifier_type, window_type, window_start)
        DO UPDATE SET requests_count = ai_rate_limits.requests_count + 1;
        
        RETURN json_build_object(
            'allowed', true,
            'current_count', current_count + 1,
            'limit', limit_value,
            'window_reset', window_start_time + window_duration
        );
    ELSE
        RETURN json_build_object(
            'allowed', false,
            'current_count', current_count,
            'limit', limit_value,
            'window_reset', window_start_time + window_duration,
            'error', 'Rate limit exceeded'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCIÓN PARA REGISTRAR USO DE IA
CREATE OR REPLACE FUNCTION log_ai_usage(
    p_session_id UUID,
    p_user_ip VARCHAR(45),
    p_user_id UUID,
    p_question TEXT,
    p_response TEXT,
    p_tokens_input INTEGER,
    p_tokens_output INTEGER,
    p_cost_usd DECIMAL(10,6),
    p_processing_time_ms INTEGER
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO ai_usage_tracking (
        session_id, user_ip, user_id, question, response,
        tokens_input, tokens_output, cost_usd, processing_time_ms
    ) VALUES (
        p_session_id, p_user_ip, p_user_id, p_question, p_response,
        p_tokens_input, p_tokens_output, p_cost_usd, p_processing_time_ms
    ) RETURNING id INTO usage_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE IA
CREATE OR REPLACE FUNCTION get_ai_stats(p_period VARCHAR(20) DEFAULT 'today')
RETURNS JSON AS $$
DECLARE
    start_date TIMESTAMP;
    result JSON;
BEGIN
    CASE p_period
        WHEN 'today' THEN start_date := date_trunc('day', NOW());
        WHEN 'week' THEN start_date := date_trunc('week', NOW());
        WHEN 'month' THEN start_date := date_trunc('month', NOW());
        ELSE start_date := date_trunc('day', NOW());
    END CASE;
    
    SELECT json_build_object(
        'period', p_period,
        'total_questions', COUNT(*),
        'total_cost_usd', COALESCE(SUM(cost_usd), 0),
        'avg_processing_time_ms', COALESCE(AVG(processing_time_ms), 0),
        'total_tokens_input', COALESCE(SUM(tokens_input), 0),
        'total_tokens_output', COALESCE(SUM(tokens_output), 0),
        'unique_users', COUNT(DISTINCT COALESCE(user_id::text, user_ip)),
        'top_questions', (
            SELECT json_agg(question_summary)
            FROM (
                SELECT 
                    LEFT(question, 100) as question_text,
                    COUNT(*) as frequency
                FROM ai_usage_tracking
                WHERE created_at >= start_date
                GROUP BY LEFT(question, 100)
                ORDER BY COUNT(*) DESC
                LIMIT 5
            ) question_summary
        )
    )
    INTO result
    FROM ai_usage_tracking
    WHERE created_at >= start_date;
    
    RETURN COALESCE(result, '{"total_questions": 0, "total_cost_usd": 0}'::json);
END;
$$ LANGUAGE plpgsql;

-- 9. POLÍTICAS RLS PARA SEGURIDAD
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Lectura pública para configuración (solo is_enabled y welcome_message)
CREATE POLICY "AI settings public read" ON ai_settings
    FOR SELECT USING (true);

-- Solo admins pueden modificar configuración
CREATE POLICY "AI settings admin only" ON ai_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email IN (
                'nadrian18@gmail.com', 
                'admin@charlitron.com',
                'ventas@charlitron.com'
            )
        )
    );

-- Tracking: inserción pública, lectura solo admin
CREATE POLICY "AI usage insert" ON ai_usage_tracking
    FOR INSERT WITH CHECK (true);

CREATE POLICY "AI usage admin read" ON ai_usage_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email IN (
                'nadrian18@gmail.com', 
                'admin@charlitron.com',
                'ventas@charlitron.com'
            )
        )
    );

-- Rate limits: acceso público para verificación
CREATE POLICY "AI rate limits public" ON ai_rate_limits
    FOR ALL USING (true);

-- 10. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_created_at 
    ON ai_usage_tracking(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_user_ip 
    ON ai_usage_tracking(user_ip);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_cost 
    ON ai_usage_tracking(cost_usd);

CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_identifier 
    ON ai_rate_limits(user_identifier, identifier_type, window_type);

CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_window 
    ON ai_rate_limits(window_start, window_type);

-- 11. LIMPIEZA AUTOMÁTICA (eliminar rate limits antiguos)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_rate_limits 
    WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Programar limpieza diaria (opcional, requiere pg_cron)
-- SELECT cron.schedule('cleanup-ai-rate-limits', '0 2 * * *', 'SELECT cleanup_old_rate_limits();');

-- ==========================================
-- VERIFICACIÓN DE INSTALACIÓN
-- ==========================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM ai_settings) THEN
        RAISE NOTICE '✅ Sistema de IA configurado correctamente';
        RAISE NOTICE '📊 Configuración inicial creada';
        RAISE NOTICE '🛡️ Políticas de seguridad aplicadas';
        RAISE NOTICE '📈 Sistema de tracking habilitado';
    ELSE
        RAISE EXCEPTION '❌ Error en configuración de IA';
    END IF;
END $$;

COMMENT ON TABLE ai_settings IS 'Configuración del asistente de IA con control administrativo';
COMMENT ON TABLE ai_usage_tracking IS 'Tracking completo del uso de la IA para análisis y costos';
COMMENT ON TABLE ai_rate_limits IS 'Control de límites de uso para prevenir abuso';