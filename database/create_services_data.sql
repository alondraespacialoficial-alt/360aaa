-- VERIFICAR Y CREAR DATOS DE SERVICIOS CON PRECIOS
-- Para probar respuestas inteligentes de la IA

-- PASO 1: Verificar si la tabla provider_services existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_services') THEN
        -- Crear la tabla si no existe
        CREATE TABLE provider_services (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
            category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
            service_name VARCHAR(255),
            description TEXT,
            price_range VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(provider_id, category_id)
        );
        
        RAISE NOTICE '✅ Tabla provider_services creada';
    ELSE
        RAISE NOTICE '✅ Tabla provider_services ya existe';
    END IF;
END $$;

-- PASO 2: Verificar estructura actual
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'provider_services' 
ORDER BY ordinal_position;

-- PASO 3: Ver datos existentes si los hay
SELECT COUNT(*) as "Servicios Existentes" FROM provider_services;

-- PASO 4: Ver categorías disponibles
SELECT id, name, slug FROM categories ORDER BY name;

-- PASO 5: Ver proveedores disponibles  
SELECT id, name, city FROM providers WHERE is_active = true LIMIT 5;

-- PASO 6: Insertar datos de prueba (version simplificada)
DO $$
DECLARE
    video_cat_id UUID;
    music_cat_id UUID;
    catering_cat_id UUID;
    provider_id UUID;
BEGIN
    -- Obtener primera categoría que contenga "video" o "fotografia"
    SELECT id INTO video_cat_id FROM categories 
    WHERE name ILIKE '%video%' OR name ILIKE '%fotograf%' OR slug ILIKE '%video%' 
    LIMIT 1;
    
    -- Obtener primera categoría que contenga "musica" o "dj"
    SELECT id INTO music_cat_id FROM categories 
    WHERE name ILIKE '%music%' OR name ILIKE '%dj%' OR slug ILIKE '%music%'
    LIMIT 1;
    
    -- Obtener primera categoría que contenga "banquet" o "catering"
    SELECT id INTO catering_cat_id FROM categories 
    WHERE name ILIKE '%banquet%' OR name ILIKE '%catering%' OR slug ILIKE '%banquet%'
    LIMIT 1;
    
    -- Obtener primer proveedor activo
    SELECT id INTO provider_id FROM providers WHERE is_active = true LIMIT 1;
    
    IF provider_id IS NOT NULL THEN
        -- Insertar servicios de video
        IF video_cat_id IS NOT NULL THEN
            INSERT INTO provider_services (provider_id, category_id, service_name, description, price_range)
            VALUES (provider_id, video_cat_id, 'Video Profesional San Luis Potosí', 'Bodas y eventos sociales completos', '$2,500 - $4,000 MXN')
            ON CONFLICT (provider_id, category_id) DO NOTHING;
        END IF;
        
        -- Insertar servicios de música
        IF music_cat_id IS NOT NULL THEN
            INSERT INTO provider_services (provider_id, category_id, service_name, description, price_range)
            VALUES (provider_id, music_cat_id, 'DJ Profesional', 'Equipo completo para eventos', '$1,500 - $3,000 MXN')
            ON CONFLICT (provider_id, category_id) DO NOTHING;
        END IF;
        
        -- Insertar servicios de banquetes
        IF catering_cat_id IS NOT NULL THEN
            INSERT INTO provider_services (provider_id, category_id, service_name, description, price_range)
            VALUES (provider_id, catering_cat_id, 'Banquete Completo', 'Servicio de banquetes para eventos', '$200 - $350 MXN por persona')
            ON CONFLICT (provider_id, category_id) DO NOTHING;
        END IF;
        
        RAISE NOTICE '✅ Servicios de prueba insertados';
    ELSE
        RAISE NOTICE '❌ No se encontraron proveedores activos';
    END IF;
END $$;

-- PASO 7: Actualizar algunos proveedores para tener ciudad específica
UPDATE providers SET city = 'San Luis Potosí' 
WHERE id IN (SELECT id FROM providers WHERE is_active = true LIMIT 2);

-- PASO 8: Verificar resultados finales
SELECT 
    p.name as proveedor,
    p.city,
    c.name as categoria,
    ps.service_name,
    ps.price_range
FROM provider_services ps
JOIN providers p ON ps.provider_id = p.id  
JOIN categories c ON ps.category_id = c.id
ORDER BY p.name;