-- ==========================================
-- DESACTIVAR RLS EN AI_SETTINGS (Temporal)
-- Para permitir UPDATE sin restricciones
-- ==========================================

-- 1. Ver estado actual de RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'ai_settings';

-- 2. Desactivar RLS en la tabla ai_settings
ALTER TABLE ai_settings DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que se desactivó
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'ai_settings';

-- 4. Probar UPDATE manual
UPDATE ai_settings SET is_enabled = true;

-- 5. Ver el resultado
SELECT id, is_enabled FROM ai_settings;

-- ✅ RESULTADO ESPERADO
SELECT '✅ RLS desactivado - Ahora el toggle debería funcionar' as resultado;
