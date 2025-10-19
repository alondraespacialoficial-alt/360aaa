-- INSERTAR DATOS DE PRUEBA PARA AI USAGE TRACKING
-- Para verificar que las estadísticas funcionen correctamente

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
    uuid_generate_v4(),
    '192.168.1.100',
    NULL,
    '¿Qué proveedores de video tienes en San Luis Potosí?',
    'Te puedo ayudar con proveedores de video en San Luis Potosí. Tenemos varios especialistas verificados...',
    85,
    120,
    0.0025,
    1500,
    NOW()
),
(
    uuid_generate_v4(),
    '192.168.1.101',
    NULL,
    '¿Cuánto cuesta un servicio de fotografía para boda?',
    'Los precios de fotografía de boda varían según el paquete...',
    75,
    95,
    0.0018,
    1200,
    NOW() - INTERVAL '2 hours'
),
(
    uuid_generate_v4(),
    '192.168.1.102', 
    NULL,
    'Necesito DJ para evento corporativo',
    'Para eventos corporativos tenemos excelentes DJs profesionales...',
    65,
    110,
    0.0022,
    1350,
    NOW() - INTERVAL '4 hours'
),
-- Datos de ayer
(
    uuid_generate_v4(),
    '192.168.1.103',
    NULL,
    '¿Tienen proveedores de catering para 100 personas?',
    'Sí, contamos con varios proveedores de catering que pueden atender eventos de 100 personas...',
    90,
    130,
    0.0030,
    1600,
    NOW() - INTERVAL '1 day'
),
-- Datos de la semana pasada
(
    uuid_generate_v4(),
    '192.168.1.104',
    NULL,
    'Busco decoración para quinceañera',
    'Tenemos especialistas en decoración para quinceañeras con diferentes estilos...',
    70,
    105,
    0.0020,
    1100,
    NOW() - INTERVAL '5 days'
);

-- Verificar que se insertaron
SELECT 
    COUNT(*) as "Total Registros",
    SUM(cost_usd) as "Costo Total",
    AVG(processing_time_ms) as "Tiempo Promedio",
    COUNT(DISTINCT user_ip) as "Usuarios Únicos"
FROM ai_usage_tracking;

-- Verificar datos de hoy
SELECT 
    COUNT(*) as "Preguntas Hoy",
    SUM(cost_usd) as "Costo Hoy"
FROM ai_usage_tracking 
WHERE created_at >= date_trunc('day', NOW());