-- ==========================================
-- CHARLITRON EVENTOS 360 - PROVIDER ANALYTICS
-- Sistema de métricas y dashboard para proveedores
-- ==========================================

-- 1. TABLA PRINCIPAL: provider_analytics
-- Registra todos los eventos de interacción con proveedores
CREATE TABLE IF NOT EXISTS provider_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, 
  -- Tipos de eventos:
  -- 'profile_view' = Vista del perfil público
  -- 'whatsapp_click' = Clic en botón WhatsApp
  -- 'phone_click' = Clic en número telefónico  
  -- 'website_click' = Clic en sitio web
  -- 'instagram_click' = Clic en Instagram
  -- 'facebook_click' = Clic en Facebook
  -- 'service_view' = Vista de servicio específico
  -- 'gallery_view' = Vista de galería de fotos
  
  visitor_ip VARCHAR(45), -- IP para evitar spam (IPv4/IPv6)
  user_agent TEXT, -- Info del navegador/dispositivo
  referrer TEXT, -- URL de origen de la visita
  session_id UUID, -- ID de sesión para agrupar eventos
  city VARCHAR(100), -- Ciudad del visitante (estimada por IP)
  country VARCHAR(50), -- País del visitante
  device_type VARCHAR(20), -- 'mobile', 'desktop', 'tablet'
  
  -- Metadata adicional en formato JSON
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'profile_view', 'whatsapp_click', 'phone_click', 
      'website_click', 'instagram_click', 'facebook_click',
      'service_view', 'gallery_view'
    )
  ),
  CONSTRAINT valid_device_type CHECK (
    device_type IN ('mobile', 'desktop', 'tablet', 'unknown') OR device_type IS NULL
  )
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_provider_analytics_provider_id 
  ON provider_analytics(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_analytics_event_type 
  ON provider_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_provider_analytics_created_at 
  ON provider_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_analytics_visitor_ip 
  ON provider_analytics(visitor_ip);

CREATE INDEX IF NOT EXISTS idx_provider_analytics_session 
  ON provider_analytics(session_id);

-- Índice compuesto para consultas comunes
CREATE INDEX IF NOT EXISTS idx_provider_analytics_provider_event_date 
  ON provider_analytics(provider_id, event_type, created_at DESC);

-- 3. VISTA MATERIALIZADA: Resumen de estadísticas por proveedor
CREATE MATERIALIZED VIEW IF NOT EXISTS provider_stats_summary AS
SELECT 
  p.provider_id,
  p.provider_name,
  
  -- Vistas del perfil
  COUNT(*) FILTER (WHERE p.event_type = 'profile_view') as total_views,
  COUNT(*) FILTER (WHERE p.event_type = 'profile_view' AND p.created_at >= CURRENT_DATE - INTERVAL '30 days') as views_last_30_days,
  COUNT(*) FILTER (WHERE p.event_type = 'profile_view' AND p.created_at >= CURRENT_DATE - INTERVAL '7 days') as views_last_7_days,
  COUNT(*) FILTER (WHERE p.event_type = 'profile_view' AND p.created_at >= CURRENT_DATE) as views_today,
  
  -- Interacciones de contacto
  COUNT(*) FILTER (WHERE p.event_type = 'whatsapp_click') as whatsapp_clicks,
  COUNT(*) FILTER (WHERE p.event_type = 'phone_click') as phone_clicks,
  COUNT(*) FILTER (WHERE p.event_type = 'website_click') as website_clicks,
  COUNT(*) FILTER (WHERE p.event_type = 'instagram_click') as instagram_clicks,
  COUNT(*) FILTER (WHERE p.event_type = 'facebook_click') as facebook_clicks,
  
  -- Engagement con contenido
  COUNT(*) FILTER (WHERE p.event_type = 'service_view') as service_views,
  COUNT(*) FILTER (WHERE p.event_type = 'gallery_view') as gallery_views,
  
  -- Visitantes únicos
  COUNT(DISTINCT p.visitor_ip) FILTER (WHERE p.event_type = 'profile_view') as unique_visitors,
  COUNT(DISTINCT p.visitor_ip) FILTER (WHERE p.event_type = 'profile_view' AND p.created_at >= CURRENT_DATE - INTERVAL '30 days') as unique_visitors_30_days,
  
  -- Distribución geográfica
  COUNT(DISTINCT p.city) as cities_reached,
  COUNT(DISTINCT p.country) as countries_reached,
  
  -- Distribución por dispositivos
  COUNT(*) FILTER (WHERE p.device_type = 'mobile') as mobile_views,
  COUNT(*) FILTER (WHERE p.device_type = 'desktop') as desktop_views,
  COUNT(*) FILTER (WHERE p.device_type = 'tablet') as tablet_views,
  
  -- Timestamps importantes
  MIN(p.created_at) as first_view,
  MAX(p.created_at) as last_activity,
  
  -- Rate de conversión (contacto/vistas)
  CASE 
    WHEN COUNT(*) FILTER (WHERE p.event_type = 'profile_view') > 0 
    THEN ROUND(
      (COUNT(*) FILTER (WHERE p.event_type IN ('whatsapp_click', 'phone_click'))::decimal / 
       COUNT(*) FILTER (WHERE p.event_type = 'profile_view')::decimal) * 100, 2
    )
    ELSE 0
  END as contact_conversion_rate

FROM (
  SELECT 
    pa.*,
    pr.name as provider_name
  FROM provider_analytics pa
  JOIN providers pr ON pa.provider_id = pr.id
  WHERE pr.is_active = true
) p
GROUP BY p.provider_id, p.provider_name;

-- Índice en la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_stats_summary_provider_id 
  ON provider_stats_summary(provider_id);

-- 4. FUNCIÓN PARA REGISTRAR EVENTOS
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
  -- Prevenir spam: máximo 5 eventos del mismo tipo por IP por hora
  SELECT COUNT(*)
  INTO duplicate_count
  FROM provider_analytics
  WHERE provider_id = p_provider_id
    AND event_type = p_event_type
    AND visitor_ip = p_visitor_ip
    AND created_at >= NOW() - INTERVAL '1 hour';
  
  IF duplicate_count >= 5 THEN
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
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE UN PROVEEDOR
CREATE OR REPLACE FUNCTION get_provider_stats(p_provider_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT row_to_json(stats)
  INTO result
  FROM (
    SELECT 
      provider_id,
      provider_name,
      total_views,
      views_last_30_days,
      views_last_7_days,
      views_today,
      whatsapp_clicks,
      phone_clicks,
      website_clicks,
      instagram_clicks,
      facebook_clicks,
      service_views,
      gallery_views,
      unique_visitors,
      unique_visitors_30_days,
      cities_reached,
      countries_reached,
      mobile_views,
      desktop_views,
      tablet_views,
      contact_conversion_rate,
      first_view,
      last_activity
    FROM provider_stats_summary
    WHERE provider_id = p_provider_id
  ) stats;
  
  RETURN COALESCE(result, '{}');
END;
$$ LANGUAGE plpgsql;

-- 6. FUNCIÓN PARA REFRESCAR ESTADÍSTICAS
CREATE OR REPLACE FUNCTION refresh_provider_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY provider_stats_summary;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER PARA REFRESCAR ESTADÍSTICAS AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION trigger_refresh_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Refrescar stats cada 100 eventos nuevos
  IF (SELECT COUNT(*) FROM provider_analytics) % 100 = 0 THEN
    PERFORM refresh_provider_stats();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_stats_trigger
  AFTER INSERT ON provider_analytics
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_stats();

-- 8. POLÍTICAS RLS (Row Level Security) si es necesario
-- ALTER TABLE provider_analytics ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de estadísticas
-- CREATE POLICY "Public read access for analytics" ON provider_analytics
--   FOR SELECT USING (true);

-- Política para inserción (solo desde backend autenticado)
-- CREATE POLICY "Insert analytics events" ON provider_analytics
--   FOR INSERT WITH CHECK (true);

-- 9. COMENTARIOS Y DOCUMENTACIÓN
COMMENT ON TABLE provider_analytics IS 'Tabla principal para tracking de eventos de proveedores';
COMMENT ON COLUMN provider_analytics.event_type IS 'Tipo de evento: profile_view, whatsapp_click, phone_click, etc.';
COMMENT ON COLUMN provider_analytics.visitor_ip IS 'IP del visitante para prevenir spam';
COMMENT ON COLUMN provider_analytics.session_id IS 'ID de sesión para agrupar eventos relacionados';
COMMENT ON COLUMN provider_analytics.metadata IS 'Datos adicionales en formato JSON';

COMMENT ON MATERIALIZED VIEW provider_stats_summary IS 'Vista materializada con resumen de estadísticas por proveedor';
COMMENT ON FUNCTION log_provider_event IS 'Función para registrar eventos con protección anti-spam';
COMMENT ON FUNCTION get_provider_stats IS 'Función para obtener estadísticas de un proveedor específico';

-- ==========================================
-- FIN DEL SCHEMA DE ANALYTICS
-- ==========================================

-- Para verificar que todo se creó correctamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%analytics%';
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%provider%';