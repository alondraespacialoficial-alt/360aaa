-- Agregar campo payment_status a provider_registrations
-- Para distinguir entre registros gratuitos y pagados

-- Agregar la columna
ALTER TABLE provider_registrations 
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';

-- Agregar comentario
COMMENT ON COLUMN provider_registrations.payment_status IS 'Estado del pago: pending, completed, failed';

-- Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_provider_registrations_payment_status 
ON provider_registrations(payment_status);

-- Actualizar registros existentes (asumir que los que tienen status approved ya pagaron)
UPDATE provider_registrations 
SET payment_status = CASE 
    WHEN status = 'approved' THEN 'completed'
    ELSE 'pending'
END;

-- Agregar constraint para valores válidos
ALTER TABLE provider_registrations
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled'));

-- Comentarios para documentación
COMMENT ON TABLE provider_registrations IS 'Registros de proveedores con estado de pago y aprobación separados';

-- Ver el resultado
SELECT 
    business_name,
    email,
    status,
    payment_status,
    created_at
FROM provider_registrations
ORDER BY created_at DESC
LIMIT 5;