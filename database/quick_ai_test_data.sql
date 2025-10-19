-- SCRIPT RÁPIDO PARA GENERAR DATOS DE PRUEBA DE IA
-- Ejecuta esto para que aparezcan estadísticas en el panel admin

-- 1. Insertar datos de uso de IA de prueba
INSERT INTO ai_usage_tracking (
    session_id,
    user_ip,
    user_id,
    question,
    response,
    tokens_input,
    tokens_output,
    cost_usd,
    processing_time_ms,
    created_at
) VALUES 
-- Datos de hoy
(
    gen_random_uuid(),
    '192.168.1.100',
    NULL,
    '¿Qué proveedores de video tienes en San Luis Potosí?',
    'Te recomiendo VideoPro SLP ($2,500-$4,000) para bodas completas. Contáctalos por WhatsApp.',
    85,
    120,
    0.0025,
    1500,
    NOW()
),
(
    gen_random_uuid(),
    '192.168.1.101',
    NULL,
    'Tengo $3000 para video en San Luis',
    'Con $3,000 te conviene VideoPro SLP ($2,500-$4,000). Incluye ceremonia + recepción.',
    75,
    95,
    0.0018,
    1200,
    NOW() - INTERVAL '2 hours'
),
(
    gen_random_uuid(),
    '192.168.1.102', 
    NULL,
    'Necesito DJ para evento corporativo',
    'Para eventos corporativos te recomiendo SoundMaster ($1,500-$3,000). Equipos profesionales.',
    65,
    110,
    0.0022,
    1350,
    NOW() - INTERVAL '4 hours'
);

-- 2. Verificar que se insertaron
SELECT 
    COUNT(*) as "Total Registros Hoy",
    SUM(cost_usd) as "Costo Total Hoy",
    AVG(processing_time_ms) as "Tiempo Promedio",
    COUNT(DISTINCT user_ip) as "Usuarios Únicos Hoy"
FROM ai_usage_tracking 
WHERE created_at >= date_trunc('day', NOW());

-- 3. Probar la función get_ai_stats
SELECT get_ai_stats('today') as "Estadísticas Hoy";
SELECT get_ai_stats('week') as "Estadísticas Semana";

-- 4. Verificar configuración de IA
SELECT 
    is_enabled,
    rate_limit_per_day,
    daily_budget_usd,
    max_tokens_per_question
FROM ai_settings;

-- Mensaje final
SELECT '✅ Datos de prueba insertados - Recarga el panel admin para ver estadísticas' as resultado;