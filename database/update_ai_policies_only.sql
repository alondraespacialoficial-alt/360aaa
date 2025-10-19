-- ACTUALIZAR SOLO LAS POLÍTICAS DE IA PARA ARREGLAR ERROR DE PERMISOS
-- Ejecuta solo este script en lugar del completo

-- 1. Eliminar políticas existentes que causan problemas
DROP POLICY IF EXISTS "AI settings admin only" ON ai_settings;
DROP POLICY IF EXISTS "AI usage admin read" ON ai_usage_tracking;

-- 2. Crear políticas nuevas que usan jwt.claims.email (no requiere auth.users)
CREATE POLICY "AI settings admin only" ON ai_settings
    FOR ALL USING (
        current_setting('jwt.claims.email', true) IN (
            'nadrian18@gmail.com', 
            'admin@charlitron.com',
            'ventas@charlitron.com'
        )
    );

CREATE POLICY "AI usage admin read" ON ai_usage_tracking
    FOR SELECT USING (
        current_setting('jwt.claims.email', true) IN (
            'nadrian18@gmail.com', 
            'admin@charlitron.com',
            'ventas@charlitron.com'
        )
    );

-- 3. Verificar que las políticas se aplicaron
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('ai_settings', 'ai_usage_tracking')
ORDER BY tablename, policyname;

-- Mensaje de confirmación
SELECT '✅ Políticas de IA actualizadas - Ya no habrá errores de permission denied' as resultado;