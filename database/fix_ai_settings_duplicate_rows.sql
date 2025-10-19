-- ==========================================
-- ARREGLO: Eliminar filas duplicadas en ai_settings
-- La tabla debe tener SOLO UNA FILA
-- ==========================================

-- 1. Verificar cuántas filas hay (debería ser 1)
SELECT COUNT(*) as total_rows FROM ai_settings;

-- 2. Ver todas las filas actuales (sin ORDER BY porque created_at no existe)
SELECT * FROM ai_settings;

-- 3. ELIMINAR TODAS las filas
DELETE FROM ai_settings;

-- 4. Insertar UNA SOLA fila con configuración por defecto
-- (Sin created_at/updated_at porque no existen en la tabla)
INSERT INTO ai_settings (
  is_enabled,
  daily_budget_usd,
  monthly_budget_usd,
  rate_limit_per_minute,
  rate_limit_per_hour,
  rate_limit_per_day,
  max_tokens_per_question,
  max_conversation_length,
  welcome_message
) VALUES (
  false,  -- ⚠️ DESACTIVADO por defecto para que puedas probarlo
  2.00,
  50.00,
  2,
  3,
  5,
  300,
  10,
  '¡Hola! 👋 Soy tu asistente virtual de Charlitron Eventos 360. ¿En qué puedo ayudarte?'
);

-- 5. Verificar que solo hay 1 fila
SELECT COUNT(*) as filas_totales FROM ai_settings;

-- 6. Mostrar la configuración actual
SELECT 
  id,
  is_enabled,
  daily_budget_usd,
  monthly_budget_usd,
  rate_limit_per_day
FROM ai_settings;

-- 7. Agregar constraint ÚNICO para prevenir duplicados en el futuro (opcional)
-- Solo ejecutar si no existe ya
DO $$
BEGIN
  -- Verificar si ya existe una constraint similar
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_settings_single_row'
  ) THEN
    -- Crear trigger para asegurar solo 1 fila
    CREATE OR REPLACE FUNCTION prevent_ai_settings_insert()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF (SELECT COUNT(*) FROM ai_settings) >= 1 THEN
        RAISE EXCEPTION 'La tabla ai_settings solo puede tener una fila. Usa UPDATE en lugar de INSERT.';
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER ai_settings_single_row
    BEFORE INSERT ON ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ai_settings_insert();
  END IF;
END
$$;

-- ✅ RESULTADO ESPERADO
SELECT '✅ Tabla ai_settings arreglada - Solo 1 fila, IA desactivada para pruebas' as resultado;
