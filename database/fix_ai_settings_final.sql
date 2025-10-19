-- ARREGLO DEFINITIVO PARA EL ERROR DE AI SETTINGS
-- Este script limpia y arregla la tabla ai_settings de una vez por todas

-- 1. Verificar cuántas filas hay en ai_settings
SELECT COUNT(*) as "Filas en ai_settings" FROM ai_settings;

-- 2. Ver todas las filas existentes
SELECT id, is_enabled, rate_limit_per_day, daily_budget_usd FROM ai_settings;

-- 3. LIMPIAR COMPLETAMENTE la tabla y insertar UNA SOLA fila
DELETE FROM ai_settings;

-- 4. Insertar EXACTAMENTE una fila de configuración
INSERT INTO ai_settings (
    is_enabled,
    daily_budget_usd,
    monthly_budget_usd,
    rate_limit_per_minute,
    rate_limit_per_hour,
    rate_limit_per_day,
    max_tokens_per_question,
    max_conversation_length,
    welcome_message,
    updated_at
) VALUES (
    true,
    2.00,
    50.00,
    2,
    3,
    5,
    300,
    10,
    '¡Hola! 👋 Soy tu asistente virtual de Charlitron Eventos 360. Puedo ayudarte a encontrar proveedores por categoría, ubicación y presupuesto. ¿Qué necesitas?',
    NOW()
);

-- 5. Verificar que ahora hay exactamente 1 fila
SELECT 
    COUNT(*) as "Total Filas",
    id,
    is_enabled,
    rate_limit_per_day,
    daily_budget_usd
FROM ai_settings 
GROUP BY id, is_enabled, rate_limit_per_day, daily_budget_usd;

-- 6. Insertar algunos datos de prueba para las estadísticas
INSERT INTO ai_usage_tracking (
    session_id, user_ip, question, response, 
    tokens_input, tokens_output, cost_usd, processing_time_ms, created_at
) VALUES 
(gen_random_uuid(), '127.0.0.1', 'Prueba 1', 'Respuesta 1', 50, 80, 0.001, 1000, NOW()),
(gen_random_uuid(), '127.0.0.2', 'Prueba 2', 'Respuesta 2', 60, 90, 0.002, 1200, NOW() - INTERVAL '1 hour'),
(gen_random_uuid(), '127.0.0.3', 'Prueba 3', 'Respuesta 3', 70, 100, 0.003, 1500, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- 7. Probar la función get_ai_stats
SELECT get_ai_stats('today') as estadisticas_hoy;

-- Mensaje final
SELECT '🎉 AI SETTINGS ARREGLADO - Ahora el toggle debería funcionar' as resultado;