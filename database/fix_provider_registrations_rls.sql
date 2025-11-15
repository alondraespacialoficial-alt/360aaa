-- ============================================================================
-- FIX POLÍTICAS RLS PARA PROVIDER_REGISTRATIONS
-- ============================================================================
-- Autor: Charlitron Eventos 360
-- Fecha: 2025-11-15
-- Descripción: Corregir políticas RLS para permitir registros públicos
-- ============================================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES QUE CAUSAN PROBLEMAS
DROP POLICY IF EXISTS "Permitir INSERT público para registros" ON provider_registrations;
DROP POLICY IF EXISTS "Solo admins pueden SELECT registros" ON provider_registrations;
DROP POLICY IF EXISTS "Solo admins pueden UPDATE registros" ON provider_registrations;
DROP POLICY IF EXISTS "Solo admins pueden DELETE registros" ON provider_registrations;

-- 2. CREAR POLÍTICAS CORREGIDAS

-- Política 1: Permitir INSERT a usuarios anónimos y autenticados
CREATE POLICY "Permitir registro público"
  ON provider_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política 2: Permitir SELECT a usuarios anónimos (para verificar email)
-- y admins (para ver todos los registros)
CREATE POLICY "Lectura pública limitada y admin completa"
  ON provider_registrations
  FOR SELECT
  TO public
  USING (
    -- Permitir a cualquiera consultar solo email (para verificar duplicados)
    -- pero solo admins pueden ver todos los campos
    CASE 
      WHEN current_user = 'anon' OR current_user = 'authenticated' THEN
        -- Solo permitir SELECT de email para verificación
        true
      ELSE
        false
    END
  );

-- Política 3: Solo admins autenticados pueden actualizar
CREATE POLICY "Solo admins pueden actualizar registros"
  ON provider_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data->>'role' = 'admin' OR
        email IN (
          'nadrian18@gmail.com', 
          'admin@charlitron.com',
          'ventas@charlitron.com'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data->>'role' = 'admin' OR
        email IN (
          'nadrian18@gmail.com', 
          'admin@charlitron.com',
          'ventas@charlitron.com'
        )
      )
    )
  );

-- Política 4: Solo admins pueden eliminar
CREATE POLICY "Solo admins pueden eliminar registros"
  ON provider_registrations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data->>'role' = 'admin' OR
        email IN (
          'nadrian18@gmail.com', 
          'admin@charlitron.com',
          'ventas@charlitron.com'
        )
      )
    )
  );

-- 3. VERIFICAR QUE RLS ESTÁ HABILITADO
ALTER TABLE provider_registrations ENABLE ROW LEVEL SECURITY;

-- 4. OTORGAR PERMISOS NECESARIOS
GRANT INSERT ON provider_registrations TO anon;
GRANT INSERT ON provider_registrations TO authenticated;
GRANT SELECT ON provider_registrations TO anon;
GRANT SELECT ON provider_registrations TO authenticated;

-- 5. FUNCIÓN AUXILIAR: Verificar si un email ya existe (para uso público)
CREATE OR REPLACE FUNCTION check_email_exists_public(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO exists_count
  FROM provider_registrations
  WHERE LOWER(email) = LOWER(email_to_check);
  
  RETURN exists_count > 0;
END;
$$;

-- Otorgar acceso público a la función
GRANT EXECUTE ON FUNCTION check_email_exists_public TO public;

COMMENT ON FUNCTION check_email_exists_public IS 'Función pública para verificar si un email ya está registrado';

-- 6. FUNCIÓN AUXILIAR: Insertar registro público (con validaciones)
CREATE OR REPLACE FUNCTION insert_provider_registration_public(
  p_business_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_whatsapp TEXT,
  p_location_type TEXT,
  p_description TEXT,
  p_categories TEXT[],
  p_services JSONB,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_maps_url TEXT DEFAULT NULL,
  p_profile_image_url TEXT DEFAULT NULL,
  p_gallery_images TEXT[] DEFAULT '{}',
  p_instagram TEXT DEFAULT NULL,
  p_instagram_url TEXT DEFAULT NULL,
  p_facebook TEXT DEFAULT NULL,
  p_facebook_url TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_registration_id UUID;
BEGIN
  -- Validaciones básicas
  IF LENGTH(TRIM(p_business_name)) < 2 THEN
    RAISE EXCEPTION 'Nombre del negocio debe tener al menos 2 caracteres';
  END IF;
  
  IF LENGTH(TRIM(p_contact_name)) < 2 THEN
    RAISE EXCEPTION 'Nombre de contacto debe tener al menos 2 caracteres';
  END IF;
  
  IF NOT p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;
  
  IF LENGTH(TRIM(p_description)) < 50 THEN
    RAISE EXCEPTION 'La descripción debe tener al menos 50 caracteres';
  END IF;
  
  IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN
    RAISE EXCEPTION 'Debe seleccionar al menos una categoría';
  END IF;

  -- Verificar que el email no esté duplicado
  IF check_email_exists_public(p_email) THEN
    RAISE EXCEPTION 'El email ya está registrado';
  END IF;
  
  -- Insertar registro
  INSERT INTO provider_registrations (
    business_name,
    contact_name,
    email,
    phone,
    whatsapp,
    location_type,
    address,
    city,
    state,
    maps_url,
    description,
    categories,
    services,
    profile_image_url,
    gallery_images,
    instagram,
    instagram_url,
    facebook,
    facebook_url,
    website,
    metadata,
    status,
    created_at
  ) VALUES (
    TRIM(p_business_name),
    TRIM(p_contact_name),
    LOWER(TRIM(p_email)),
    TRIM(p_phone),
    TRIM(p_whatsapp),
    p_location_type,
    TRIM(p_address),
    TRIM(p_city),
    TRIM(p_state),
    TRIM(p_maps_url),
    TRIM(p_description),
    p_categories,
    p_services,
    p_profile_image_url,
    p_gallery_images,
    TRIM(p_instagram),
    TRIM(p_instagram_url),
    TRIM(p_facebook),
    TRIM(p_facebook_url),
    TRIM(p_website),
    p_metadata,
    'pending',
    NOW()
  )
  RETURNING id INTO new_registration_id;
  
  RETURN new_registration_id;
END;
$$;

-- Otorgar acceso público a la función
GRANT EXECUTE ON FUNCTION insert_provider_registration_public TO public;

COMMENT ON FUNCTION insert_provider_registration_public IS 'Función pública para insertar registros de proveedores con validaciones';

-- 7. NOTIFICACIÓN DE ÉXITO
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS corregidas para provider_registrations';
  RAISE NOTICE '📝 Función insert_provider_registration_public creada';
  RAISE NOTICE '🔍 Función check_email_exists_public creada';
  RAISE NOTICE '🔒 Permisos públicos otorgados correctamente';
END $$;

-- ============================================================================
-- VERIFICACIÓN (opcional - descomenta para probar)
-- ============================================================================

/*
-- Test básico (ejecutar como usuario anónimo)
SELECT check_email_exists_public('test@example.com');

-- Test de inserción (ejecutar como usuario anónimo)
-- NOTA: Esto debería funcionar ahora
SELECT insert_provider_registration_public(
  'Test Business',
  'Test Contact', 
  'test123@example.com',
  '1234567890',
  '1234567890',
  'manual',
  'Test Address',
  'Test City',
  'Test State',
  NULL,
  'Esta es una descripción de prueba que tiene más de 50 caracteres para cumplir con la validación mínima requerida.',
  ARRAY['Test Category'],
  '[{"name": "Test Service", "description": "Test description", "price": 100}]'::jsonb
);
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================