-- ARREGLO FINAL DE POLÍTICAS RLS PARA AI_SETTINGS
-- Este script corrige los permisos para que el toggle funcione

-- 1. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "AI settings admin only" ON ai_settings;
DROP POLICY IF EXISTS "AI settings admin modify" ON ai_settings;
DROP POLICY IF EXISTS "AI settings public read" ON ai_settings;

-- 2. Crear política simple de lectura pública
CREATE POLICY "AI settings public read" ON ai_settings
    FOR SELECT USING (true);

-- 3. Crear política de modificación SOLO para admins usando JWT
CREATE POLICY "AI settings admin modify" ON ai_settings
    FOR ALL
    USING (
        current_setting('jwt.claims.email', true) IN (
            'nadrian18@gmail.com', 
            'admin@charlitron.com',
            'ventas@charlitron.com'
        )
    )
    WITH CHECK (
        current_setting('jwt.claims.email', true) IN (
            'nadrian18@gmail.com', 
            'admin@charlitron.com',
            'ventas@charlitron.com'
        )
    );

-- 4. Verificar que las políticas se aplicaron correctamente
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'ai_settings'
ORDER BY policyname;

-- 5. Verificar que hay exactamente 1 fila en ai_settings
SELECT 
    COUNT(*) as "Total Filas",
    id,
    is_enabled,
    rate_limit_per_day
FROM ai_settings 
GROUP BY id, is_enabled, rate_limit_per_day;

-- Mensaje de confirmación
SELECT '✅ Políticas RLS corregidas - El toggle debería funcionar ahora' as resultado;