-- ==========================================
-- FUNCIÓN RPC PARA REGISTRAR EVENTOS
-- ==========================================

-- Primero eliminar si existe
DROP FUNCTION IF EXISTS log_provider_event(
  UUID, VARCHAR(50), VARCHAR(45), TEXT, TEXT, UUID, VARCHAR(100), VARCHAR(50), VARCHAR(20), JSONB
);

-- Crear la función nuevamente
CREATE OR REPLACE FUNCTION log_provider_event(
  p_provider_id UUID,
  p_event_type VARCHAR(50),
  p_visitor_ip VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_city VARCHAR(100) DEFAULT NULL,
  p_country VARCHAR(50) DEFAULT NULL,
  p_device_type VARCHAR(20) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
  duplicate_count INTEGER;
BEGIN
  -- Debug: Log que estamos ejecutando la función
  RAISE NOTICE 'Ejecutando log_provider_event para proveedor: %', p_provider_id;
  
  -- Verificar que el proveedor existe
  IF NOT EXISTS (SELECT 1 FROM providers WHERE id = p_provider_id) THEN
    RAISE EXCEPTION 'Proveedor con ID % no existe', p_provider_id;
  END IF;
  
  -- Prevenir spam: máximo 10 eventos del mismo tipo por IP por hora (aumentado para testing)
  SELECT COUNT(*)
  INTO duplicate_count
  FROM provider_analytics
  WHERE provider_id = p_provider_id
    AND event_type = p_event_type
    AND visitor_ip = p_visitor_ip
    AND created_at >= NOW() - INTERVAL '1 hour';
  
  RAISE NOTICE 'Eventos duplicados encontrados: %', duplicate_count;
  
  IF duplicate_count >= 10 THEN
    RAISE NOTICE 'Demasiados eventos duplicados, saltando inserción';
    RETURN NULL; -- No registrar evento spam
  END IF;
  
  -- Insertar evento
  INSERT INTO provider_analytics (
    provider_id, event_type, visitor_ip, user_agent, 
    referrer, session_id, city, country, device_type, metadata
  ) VALUES (
    p_provider_id, p_event_type, p_visitor_ip, p_user_agent,
    p_referrer, p_session_id, p_city, p_country, p_device_type, p_metadata
  ) RETURNING id INTO event_id;
  
  RAISE NOTICE 'Evento insertado con ID: %', event_id;
  
  -- Refrescar estadísticas cada 5 eventos para testing
  IF (SELECT COUNT(*) FROM provider_analytics) % 5 = 0 THEN
    REFRESH MATERIALIZED VIEW provider_stats_summary;
    RAISE NOTICE 'Vista materializada refrescada';
  END IF;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Dar permisos para uso público (anon y authenticated)
GRANT EXECUTE ON FUNCTION log_provider_event TO anon;
GRANT EXECUTE ON FUNCTION log_provider_event TO authenticated;

-- Test básico de la función
DO $$
DECLARE
  test_result UUID;
BEGIN
  -- Intentar insertar un evento de prueba
  SELECT log_provider_event(
    (SELECT id FROM providers LIMIT 1), 
    'profile_view', 
    '127.0.0.1', 
    'Test User Agent', 
    'https://test.com',
    gen_random_uuid(),
    'Test City',
    'Test Country',
    'desktop',
    '{"test": true}'
  ) INTO test_result;
  
  IF test_result IS NOT NULL THEN
    RAISE NOTICE 'TEST: Función funciona correctamente. Event ID: %', test_result;
  ELSE
    RAISE NOTICE 'TEST: Función retornó NULL (posible spam protection)';
  END IF;
END $$;