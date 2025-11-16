-- ==========================================
-- CHARLITRON EVENTOS 360 - REVIEWS AUTHENTICATION UPGRADE
-- Migración segura para sistema de reseñas autenticadas
-- ==========================================

-- 1. AGREGAR CAMPOS NUEVOS (sin afectar datos existentes)
ALTER TABLE provider_reviews 
ADD COLUMN IF NOT EXISTS user_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS user_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS helpful_votes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. FUNCIÓN PARA AUTO-ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER PARA AUTO-ACTUALIZAR updated_at
DROP TRIGGER IF EXISTS update_provider_reviews_updated_at ON provider_reviews;
CREATE TRIGGER update_provider_reviews_updated_at
    BEFORE UPDATE ON provider_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. CONSTRAINT PARA EVITAR RESEÑAS DUPLICADAS 
-- (Solo para usuarios autenticados, permite múltiples anónimas)
CREATE UNIQUE INDEX IF NOT EXISTS unique_authenticated_user_provider_review 
ON provider_reviews (user_id, provider_id) 
WHERE user_id IS NOT NULL;

-- 5. FUNCIÓN PARA VERIFICAR SI USUARIO PUEDE DEJAR RESEÑA
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

-- 6. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE RESEÑAS POR PROVEEDOR
CREATE OR REPLACE FUNCTION get_provider_review_stats(p_provider_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_reviews', COUNT(*),
        'average_rating', ROUND(AVG(rating)::numeric, 2),
        'rating_distribution', json_build_object(
            '5_stars', COUNT(*) FILTER (WHERE rating = 5),
            '4_stars', COUNT(*) FILTER (WHERE rating = 4),
            '3_stars', COUNT(*) FILTER (WHERE rating = 3),
            '2_stars', COUNT(*) FILTER (WHERE rating = 2),
            '1_star', COUNT(*) FILTER (WHERE rating = 1)
        ),
        'verified_reviews', COUNT(*) FILTER (WHERE is_verified = true),
        'recent_reviews', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
    )
    INTO result
    FROM provider_reviews
    WHERE provider_id = p_provider_id;
    
    RETURN COALESCE(result, '{"total_reviews": 0, "average_rating": 0}'::json);
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCIÓN PARA INSERTAR RESEÑA CON VALIDACIONES
CREATE OR REPLACE FUNCTION insert_provider_review(
    p_provider_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_rating INTEGER,
    p_comment TEXT,
    p_user_name VARCHAR(100) DEFAULT NULL,
    p_user_avatar_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_review_id BIGINT;
    result JSON;
BEGIN
    -- Validar rating
    IF p_rating < 1 OR p_rating > 5 THEN
        RETURN json_build_object('success', false, 'error', 'Rating debe estar entre 1 y 5');
    END IF;
    
    -- Validar que el proveedor existe
    IF NOT EXISTS (SELECT 1 FROM providers WHERE id = p_provider_id) THEN
        RETURN json_build_object('success', false, 'error', 'Proveedor no encontrado');
    END IF;
    
    -- Verificar si el usuario puede dejar reseña
    IF NOT can_user_review_provider(p_user_id, p_provider_id) THEN
        RETURN json_build_object('success', false, 'error', 'Ya tienes una reseña para este proveedor');
    END IF;
    
    -- Insertar reseña
    INSERT INTO provider_reviews (
        provider_id, user_id, rating, comment, 
        user_name, user_avatar_url, is_verified
    ) VALUES (
        p_provider_id, p_user_id, p_rating, p_comment,
        p_user_name, p_user_avatar_url, (p_user_id IS NOT NULL)
    ) RETURNING id INTO new_review_id;
    
    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'review_id', new_review_id,
        'message', 'Reseña guardada exitosamente'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. POLÍTICAS RLS (Row Level Security)
ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
DROP POLICY IF EXISTS "Reviews are publicly readable" ON provider_reviews;
CREATE POLICY "Reviews are publicly readable" ON provider_reviews
    FOR SELECT USING (true);

-- Política para inserción autenticada
DROP POLICY IF EXISTS "Users can insert own reviews" ON provider_reviews;
CREATE POLICY "Users can insert own reviews" ON provider_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Política para actualización (solo propias reseñas)
DROP POLICY IF EXISTS "Users can update own reviews" ON provider_reviews;
CREATE POLICY "Users can update own reviews" ON provider_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para admin (puede todo)
DROP POLICY IF EXISTS "Admins can manage all reviews" ON provider_reviews;
CREATE POLICY "Admins can manage all reviews" ON provider_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 9. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider_rating 
    ON provider_reviews(provider_id, rating);

CREATE INDEX IF NOT EXISTS idx_provider_reviews_user_created 
    ON provider_reviews(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_reviews_verified 
    ON provider_reviews(is_verified) WHERE is_verified = true;

-- 10. COMENTARIOS
COMMENT ON COLUMN provider_reviews.user_name IS 'Nombre del usuario (cache del perfil)';
COMMENT ON COLUMN provider_reviews.user_avatar_url IS 'URL del avatar del usuario';
COMMENT ON COLUMN provider_reviews.is_verified IS 'true si la reseña es de usuario autenticado';
COMMENT ON COLUMN provider_reviews.helpful_votes IS 'Número de votos útiles de otros usuarios';

-- 11. DATOS DE PRUEBA (opcional)
-- Marcar la reseña existente como no verificada
UPDATE provider_reviews 
SET is_verified = false, user_name = 'Usuario Anónimo'
WHERE user_id IS NULL;

-- ==========================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- ==========================================

-- Ver estructura actualizada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'provider_reviews' 
ORDER BY ordinal_position;

-- Ver datos después de la migración
SELECT * FROM provider_reviews;

-- Probar función de estadísticas
SELECT get_provider_review_stats('5de65dcf-3515-4986-a33b-d108b151f129');

COMMENT ON TABLE provider_reviews IS 'Tabla de reseñas con soporte para autenticación y usuarios anónimos';