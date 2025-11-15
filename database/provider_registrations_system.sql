-- ============================================================================
-- SISTEMA DE REGISTRO Y MODERACIÓN DE PROVEEDORES
-- ============================================================================
-- Autor: Charlitron Eventos 360
-- Fecha: 2025-11-14
-- Descripción: Tabla para solicitudes de registro de proveedores nuevos
--              con sistema de moderación antes de publicar en 'providers'
-- ============================================================================

-- ============================================================================
-- 1. TABLA: provider_registrations (Solicitudes pendientes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_registrations (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos básicos del negocio
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  
  -- Ubicación (flexible: dirección manual O link de Maps)
  location_type TEXT CHECK (location_type IN ('manual', 'maps_url')),
  address TEXT,
  city TEXT,
  state TEXT,
  maps_url TEXT,
  
  -- Descripción del negocio
  description TEXT NOT NULL CHECK (char_length(description) >= 50),
  
  -- Categorías (array de strings)
  categories TEXT[] NOT NULL DEFAULT '{}',
  
  -- Servicios (JSON array)
  -- Formato: [{"name": "Servicio 1", "description": "...", "price": 500}]
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Imágenes (URLs de Supabase Storage)
  profile_image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  
  -- Redes sociales (opcional)
  instagram TEXT,
  instagram_url TEXT,
  facebook TEXT,
  facebook_url TEXT,
  website TEXT,
  
  -- Estado de moderación
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Notas del admin (razón de rechazo, comentarios internos)
  admin_notes TEXT,
  
  -- Quién aprobó/rechazó (referencia a auth.users)
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  
  -- ID del proveedor creado (si fue aprobado)
  provider_id UUID REFERENCES providers(id),
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_location CHECK (
    (location_type = 'manual' AND address IS NOT NULL AND city IS NOT NULL AND state IS NOT NULL) OR
    (location_type = 'maps_url' AND maps_url IS NOT NULL)
  ),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT at_least_one_category CHECK (array_length(categories, 1) > 0)
);

-- Comentarios
COMMENT ON TABLE provider_registrations IS 'Solicitudes de registro de nuevos proveedores pendientes de moderación';
COMMENT ON COLUMN provider_registrations.status IS 'pending: esperando revisión | approved: aprobado y migrado | rejected: rechazado';
COMMENT ON COLUMN provider_registrations.services IS 'Array JSON con servicios: [{"name": "...", "description": "...", "price": 0}]';

-- ============================================================================
-- 2. ÍNDICES para optimizar búsquedas
-- ============================================================================

CREATE INDEX idx_registrations_status ON provider_registrations(status);
CREATE INDEX idx_registrations_created_at ON provider_registrations(created_at DESC);
CREATE INDEX idx_registrations_email ON provider_registrations(email);
CREATE INDEX idx_registrations_categories ON provider_registrations USING GIN(categories);
CREATE INDEX idx_registrations_pending ON provider_registrations(status, created_at DESC) 
  WHERE status = 'pending';

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE provider_registrations ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede insertar (registro público)
CREATE POLICY "Permitir INSERT público para registros"
  ON provider_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política: Solo admins pueden ver registros
CREATE POLICY "Solo admins pueden SELECT registros"
  ON provider_registrations
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid()::uuid IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar (aprobar/rechazar)
CREATE POLICY "Solo admins pueden UPDATE registros"
  ON provider_registrations
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid()::uuid IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Política: Solo admins pueden eliminar
CREATE POLICY "Solo admins pueden DELETE registros"
  ON provider_registrations
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- ============================================================================
-- 4. FUNCIÓN: Aprobar registro y migrar a providers
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_provider_registration(
  registration_id UUID,
  admin_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reg_data RECORD;
  new_provider_id UUID;
  contact_details JSONB;
BEGIN
  -- Obtener datos del registro
  SELECT * INTO reg_data
  FROM provider_registrations
  WHERE id = registration_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro no encontrado o ya procesado';
  END IF;
  
  -- Construir contact_details JSON
  contact_details := jsonb_build_object(
    'whatsapp', reg_data.whatsapp,
    'phone', reg_data.phone,
    'email', reg_data.email,
    'instagram', reg_data.instagram,
    'instagram_url', reg_data.instagram_url,
    'facebook', reg_data.facebook,
    'facebook_url', reg_data.facebook_url,
    'website', reg_data.website,
    'maps_url', reg_data.maps_url
  );
  
  -- Insertar en tabla providers
  INSERT INTO providers (
    name,
    description,
    contact,
    address,
    city,
    state,
    maps_url,
    profile_image_url,
    instagram,
    instagram_url,
    facebook,
    facebook_url,
    website,
    is_active,
    created_at
  ) VALUES (
    reg_data.business_name,
    reg_data.description,
    contact_details,
    reg_data.address,
    reg_data.city,
    reg_data.state,
    reg_data.maps_url,
    reg_data.profile_image_url,
    reg_data.instagram,
    reg_data.instagram_url,
    reg_data.facebook,
    reg_data.facebook_url,
    reg_data.website,
    true,
    NOW()
  )
  RETURNING id INTO new_provider_id;
  
  -- Insertar categorías en provider_categories
  INSERT INTO provider_categories (provider_id, category_id)
  SELECT new_provider_id, c.id
  FROM categories c
  WHERE c.name = ANY(reg_data.categories);
  
  -- Insertar servicios en provider_services
  INSERT INTO provider_services (provider_id, name, description, price)
  SELECT 
    new_provider_id,
    (service->>'name')::TEXT,
    (service->>'description')::TEXT,
    COALESCE((service->>'price')::NUMERIC, 0)
  FROM jsonb_array_elements(reg_data.services) AS service;
  
  -- Insertar imágenes de galería en provider_media
  IF reg_data.gallery_images IS NOT NULL AND array_length(reg_data.gallery_images, 1) > 0 THEN
    INSERT INTO provider_media (provider_id, media_url, media_type, display_order)
    SELECT 
      new_provider_id,
      unnest(reg_data.gallery_images),
      'image',
      generate_series(1, array_length(reg_data.gallery_images, 1));
  END IF;
  
  -- Actualizar registro como aprobado
  UPDATE provider_registrations
  SET 
    status = 'approved',
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    provider_id = new_provider_id
  WHERE id = registration_id;
  
  RETURN new_provider_id;
END;
$$;

COMMENT ON FUNCTION approve_provider_registration IS 'Aprueba un registro y migra datos a tabla providers';

-- ============================================================================
-- 5. FUNCIÓN: Rechazar registro
-- ============================================================================

CREATE OR REPLACE FUNCTION reject_provider_registration(
  registration_id UUID,
  admin_user_id UUID,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE provider_registrations
  SET 
    status = 'rejected',
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    admin_notes = rejection_reason
  WHERE id = registration_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro no encontrado o ya procesado';
  END IF;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION reject_provider_registration IS 'Rechaza un registro con razón opcional';

-- ============================================================================
-- 6. FUNCIÓN: Obtener estadísticas de registros
-- ============================================================================

CREATE OR REPLACE FUNCTION get_registration_stats()
RETURNS TABLE (
  total_registrations BIGINT,
  pending_count BIGINT,
  approved_count BIGINT,
  rejected_count BIGINT,
  avg_review_time_hours NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COUNT(*) as total_registrations,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    ROUND(
      CAST(
        AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) 
        FILTER (WHERE reviewed_at IS NOT NULL)
        AS NUMERIC
      ), 
      2
    ) as avg_review_time_hours
  FROM provider_registrations;
$$;

-- ============================================================================
-- 7. TRIGGER: Notificar nuevo registro (opcional)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Enviar notificación (puede ser email, webhook, etc.)
  PERFORM pg_notify(
    'new_provider_registration',
    json_build_object(
      'id', NEW.id,
      'business_name', NEW.business_name,
      'email', NEW.email,
      'created_at', NEW.created_at
    )::text
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_registration
  AFTER INSERT ON provider_registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_registration();

-- ============================================================================
-- 8. VISTAS útiles para admin panel
-- ============================================================================

-- Vista: Registros pendientes con datos resumidos
CREATE OR REPLACE VIEW pending_registrations_summary AS
SELECT 
  id,
  business_name,
  contact_name,
  email,
  phone,
  array_length(categories, 1) as category_count,
  jsonb_array_length(services) as service_count,
  CASE 
    WHEN location_type = 'maps_url' THEN '🗺️ Google Maps'
    ELSE city || ', ' || state
  END as location_display,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_pending
FROM provider_registrations
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Vista: Historial de revisiones
CREATE OR REPLACE VIEW registration_review_history AS
SELECT 
  r.id,
  r.business_name,
  r.status,
  r.reviewed_at,
  r.admin_notes,
  p.full_name as reviewer_name,
  EXTRACT(EPOCH FROM (r.reviewed_at - r.created_at)) / 3600 as review_time_hours
FROM provider_registrations r
LEFT JOIN profiles p ON p.id = r.reviewed_by
WHERE r.status IN ('approved', 'rejected')
ORDER BY r.reviewed_at DESC;

-- ============================================================================
-- 9. DATOS DE PRUEBA (opcional - comentado)
-- ============================================================================

/*
-- Insertar registro de prueba
INSERT INTO provider_registrations (
  business_name,
  contact_name,
  email,
  phone,
  whatsapp,
  location_type,
  city,
  state,
  maps_url,
  description,
  categories,
  services
) VALUES (
  'Florería Pérez',
  'Juan Pérez',
  'juan@floreriaperez.com',
  '521444123456',
  '521444123456',
  'maps_url',
  'San Luis Potosí',
  'San Luis Potosí',
  'https://maps.app.goo.gl/abc123',
  'Somos especialistas en arreglos florales para todo tipo de eventos. Más de 10 años de experiencia creando momentos únicos con flores frescas de la más alta calidad.',
  ARRAY['Flores y decoración', 'Decoración y Ambientación'],
  '[
    {"name": "Arreglo de mesa", "description": "Arreglo floral para mesa de 8 personas", "price": 350},
    {"name": "Ramo de novia", "description": "Ramo personalizado según tema", "price": 800}
  ]'::jsonb
);
*/

-- ============================================================================
-- 10. PERMISOS finales
-- ============================================================================

-- Permitir a la app pública insertar registros
GRANT INSERT ON provider_registrations TO anon;
GRANT INSERT ON provider_registrations TO authenticated;

-- Permitir a admins ejecutar funciones
GRANT EXECUTE ON FUNCTION approve_provider_registration TO authenticated;
GRANT EXECUTE ON FUNCTION reject_provider_registration TO authenticated;
GRANT EXECUTE ON FUNCTION get_registration_stats TO authenticated;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Para verificar que todo se creó correctamente:
-- SELECT * FROM provider_registrations;
-- SELECT * FROM pending_registrations_summary;
-- SELECT * FROM get_registration_stats();
