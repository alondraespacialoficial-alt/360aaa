-- SCRIPT SUPER SIMPLE PARA PROBAR EL TOGGLE
-- Solo cambiar el valor is_enabled manualmente para verificar

-- Ver estado actual
SELECT id, is_enabled, updated_at FROM ai_settings;

-- CAMBIAR MANUALMENTE (ejecuta una de las dos líneas):

-- Para ACTIVAR la IA:
-- UPDATE ai_settings SET is_enabled = true WHERE id = (SELECT id FROM ai_settings LIMIT 1);

-- Para DESACTIVAR la IA:
-- UPDATE ai_settings SET is_enabled = false WHERE id = (SELECT id FROM ai_settings LIMIT 1);

-- Verificar que cambió
SELECT id, is_enabled, updated_at FROM ai_settings;

-- Mensaje
SELECT 'Cambia manualmente is_enabled arriba y recarga la página del chat para probar' as instruccion;