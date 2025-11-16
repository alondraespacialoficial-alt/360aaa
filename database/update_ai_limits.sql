-- ACTUALIZAR LÍMITES DE IA - VERSIÓN MÁS RESTRICTIVA
-- Ejecuta esto en Supabase SQL Editor para aplicar los nuevos límites

UPDATE ai_settings SET 
    rate_limit_per_minute = 2,
    rate_limit_per_hour = 3, 
    rate_limit_per_day = 5,
    max_tokens_per_question = 300,
    daily_budget_usd = 2.00,
    updated_at = NOW()
WHERE id IN (SELECT id FROM ai_settings LIMIT 1);

-- Verificar que se aplicó
SELECT 
    rate_limit_per_minute as "Por Minuto",
    rate_limit_per_hour as "Por Hora", 
    rate_limit_per_day as "Por Día",
    max_tokens_per_question as "Max Tokens",
    daily_budget_usd as "Presupuesto Diario"
FROM ai_settings;