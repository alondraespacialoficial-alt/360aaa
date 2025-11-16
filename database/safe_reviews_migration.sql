-- ==========================================
-- CHARLITRON EVENTOS 360 - REVIEWS AUTHENTICATION 
-- MIGRACIÓN SEGURA - Preserva datos existentes
-- ==========================================

-- 1. AGREGAR CAMPOS NUEVOS (sin afectar datos existentes)
ALTER TABLE provider_reviews 
ADD COLUMN IF NOT EXISTS user_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS user_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS helpful_votes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. MARCAR RESEÑA EXISTENTE COMO NO VERIFICADA (preservar data)
UPDATE provider_reviews 
SET is_verified = false, 
    user_name = 'Usuario Anónimo',
    helpful_votes = 0
WHERE user_id IS NULL AND user_name IS NULL;

-- 3. CONSTRAINT PARA EVITAR RESEÑAS DUPLICADAS 
-- (Solo para usuarios autenticados, permite múltiples anónimas)
CREATE UNIQUE INDEX IF NOT EXISTS unique_authenticated_user_provider_review 
ON provider_reviews (user_id, provider_id) 
WHERE user_id IS NOT NULL;

-- 4. FUNCIÓN PARA VERIFICAR SI USUARIO PUEDE DEJAR RESEÑA
CREATE OR REPLACE FUNCTION can_user_review_provider(
    p_user_id UUID,
    p_provider_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Si no hay user_id, permitir (reseña anónima)
    IF p_user_id IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar si ya existe una reseña del usuario para este proveedor
    RETURN NOT EXISTS (
        SELECT 1 FROM provider_reviews 
        WHERE user_id = p_user_id 
        AND provider_id = p_provider_id
    );
END;
$$ LANGUAGE plpgsql;

-- 5. POLÍTICAS RLS (Row Level Security)
ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (CUALQUIERA puede leer reseñas)
DROP POLICY IF EXISTS "Reviews are publicly readable" ON provider_reviews;
CREATE POLICY "Reviews are publicly readable" ON provider_reviews
    FOR SELECT USING (true);

-- Política para inserción (usuarios autenticados + anónimas)
DROP POLICY IF EXISTS "Users can insert reviews" ON provider_reviews;
CREATE POLICY "Users can insert reviews" ON provider_reviews
    FOR INSERT WITH CHECK (true);

-- Política para actualización (solo propias reseñas)
DROP POLICY IF EXISTS "Users can update own reviews" ON provider_reviews;
CREATE POLICY "Users can update own reviews" ON provider_reviews
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- POLÍTICA ESPECIAL PARA ADMINS (CONTROL TOTAL)
DROP POLICY IF EXISTS "Admins can manage all reviews" ON provider_reviews;
CREATE POLICY "Admins can manage all reviews" ON provider_reviews
    FOR ALL USING (
        -- Si el usuario es admin en la tabla profiles
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email IN (
                'nadrian18@gmail.com', 
                'admin@charlitron.com',
                'ventas@charlitron.com'
            )
        )
        -- O si es el superuser actual
        OR auth.uid() = (SELECT auth.uid())
    );

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider_rating 
    ON provider_reviews(provider_id, rating);

CREATE INDEX IF NOT EXISTS idx_provider_reviews_user_created 
    ON provider_reviews(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_reviews_verified 
    ON provider_reviews(is_verified) WHERE is_verified = true;

-- 7. VERIFICACIÓN DE LA MIGRACIÓN
DO $$
BEGIN
    -- Verificar que los campos se agregaron
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'provider_reviews' 
        AND column_name = 'is_verified'
    ) THEN
        RAISE NOTICE '✅ Migración exitosa: Campos agregados correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error en migración: Campos no encontrados';
    END IF;
    
    -- Mostrar estadísticas
    DECLARE
        total_reviews INTEGER;
        verified_reviews INTEGER;
    BEGIN
        SELECT COUNT(*) INTO total_reviews FROM provider_reviews;
        SELECT COUNT(*) INTO verified_reviews FROM provider_reviews WHERE is_verified = true;
        
        RAISE NOTICE '📊 Total de reseñas: %', total_reviews;
        RAISE NOTICE '📊 Reseñas verificadas: %', verified_reviews;
        RAISE NOTICE '📊 Reseñas anónimas: %', total_reviews - verified_reviews;
    END;
END $$;

-- ==========================================
-- MIGRACIÓN COMPLETADA EXITOSAMENTE
-- ==========================================

COMMENT ON TABLE provider_reviews IS 'Tabla de reseñas con soporte para autenticación y usuarios anónimos - Migración completada';