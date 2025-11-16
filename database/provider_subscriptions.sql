-- Tabla para gestionar suscripciones de proveedores con Stripe
CREATE TABLE IF NOT EXISTS provider_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con proveedor
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES provider_registrations(id) ON DELETE SET NULL,
    
    -- Información del usuario
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    
    -- Información del plan
    plan_id TEXT NOT NULL, -- 'basico_mensual', 'destacado_mensual', etc.
    plan_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    
    -- IDs de Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT NOT NULL,
    stripe_checkout_session_id TEXT,
    
    -- Estado de la suscripción
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'canceled', 'past_due', 'unpaid', 'incomplete')
    ),
    
    -- Fechas
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON provider_subscriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON provider_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON provider_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON provider_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON provider_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_registration ON provider_subscriptions(registration_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_timestamp
    BEFORE UPDATE ON provider_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_timestamp();

-- RLS Policies
ALTER TABLE provider_subscriptions ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias suscripciones
CREATE POLICY "Users can view own subscriptions"
    ON provider_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Solo admins pueden modificar suscripciones (vía webhook de Stripe)
CREATE POLICY "Service role can manage subscriptions"
    ON provider_subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Los usuarios autenticados pueden crear suscripciones (al hacer checkout)
CREATE POLICY "Authenticated users can create subscriptions"
    ON provider_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Vista para ver suscripciones activas con información del proveedor
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    s.*,
    p.name as provider_name,
    p.is_active as provider_is_active,
    pr.business_name as registration_business_name
FROM provider_subscriptions s
LEFT JOIN providers p ON s.provider_id = p.id
LEFT JOIN provider_registrations pr ON s.registration_id = pr.id
WHERE s.status = 'active';

-- Función para obtener la suscripción activa de un proveedor
CREATE OR REPLACE FUNCTION get_active_subscription(p_provider_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_id TEXT,
    plan_name TEXT,
    status TEXT,
    current_period_end TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.plan_id,
        s.plan_name,
        s.status,
        s.current_period_end
    FROM provider_subscriptions s
    WHERE s.provider_id = p_provider_id
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar el estado de una suscripción (usada por webhook)
CREATE OR REPLACE FUNCTION update_subscription_status(
    p_stripe_subscription_id TEXT,
    p_status TEXT,
    p_current_period_start TIMESTAMPTZ DEFAULT NULL,
    p_current_period_end TIMESTAMPTZ DEFAULT NULL,
    p_canceled_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE provider_subscriptions
    SET 
        status = p_status,
        current_period_start = COALESCE(p_current_period_start, current_period_start),
        current_period_end = COALESCE(p_current_period_end, current_period_end),
        canceled_at = COALESCE(p_canceled_at, canceled_at),
        updated_at = NOW()
    WHERE stripe_subscription_id = p_stripe_subscription_id;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE provider_subscriptions IS 'Gestiona las suscripciones de pago de proveedores con Stripe';
COMMENT ON COLUMN provider_subscriptions.status IS 'Estado de la suscripción: pending (checkout no completado), active (pagando), canceled (cancelada), past_due (pago atrasado), unpaid (sin pagar), incomplete (pago incompleto)';
COMMENT ON COLUMN provider_subscriptions.billing_cycle IS 'Ciclo de facturación: monthly (mensual) o yearly (anual)';
