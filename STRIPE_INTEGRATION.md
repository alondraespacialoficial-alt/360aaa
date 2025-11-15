# Integración Stripe - Charlitron Eventos 360

## ✅ Configuración Completada

### 🔑 Credenciales Configuradas
- ✅ Stripe Publishable Key (frontend)
- ✅ Stripe Secret Key (Supabase Edge Functions)
- ✅ Stripe Webhook Secret (Supabase)

### 📦 Componentes Implementados
1. **Edge Functions** (Supabase):
   - `create-checkout-session` - Crea sesiones de pago seguras
   - `stripe-webhook` - Procesa eventos de Stripe (pagos, cancelaciones)

2. **Frontend**:
   - `PlanSelector.tsx` - Selector de planes (Mensual/Anual)
   - `stripeService.ts` - Servicio para integrar con Stripe

3. **Base de Datos**:
   - `provider_subscriptions` - Tabla para gestionar suscripciones
   - Funciones SQL para aprobar registros automáticamente al pagar

### 💳 Planes Disponibles
| Plan | Mensual | Anual |
|------|---------|-------|
| Básico | $99 MXN | $990 MXN |
| Destacado | $199 MXN | $1990 MXN |

### 🔗 URLs Importantes
- **Webhook Stripe**: `https://tbtivlwldbwwoclraiue.supabase.co/functions/v1/stripe-webhook`
- **Checkout Function**: `https://tbtivlwldbwwoclraiue.supabase.co/functions/v1/create-checkout-session`

### 🔄 Flujo de Pago
1. Usuario completa formulario de registro
2. Selecciona plan (Básico/Destacado, Mensual/Anual)
3. Click "Proceder al Pago" → Redirige a Stripe Checkout
4. Usuario paga con tarjeta
5. Webhook de Stripe confirma pago
6. Registro se aprueba automáticamente
7. Proveedor aparece en el directorio público

### 🎯 Eventos de Stripe Configurados
- `checkout.session.completed` - Pago completado
- `customer.subscription.created` - Suscripción creada
- `customer.subscription.updated` - Suscripción actualizada
- `customer.subscription.deleted` - Suscripción cancelada
- `invoice.payment_succeeded` - Renovación exitosa
- `invoice.payment_failed` - Fallo en renovación

### 🧪 Para Probar
1. Ir a `/proveedores/registro`
2. Completar formulario con Google OAuth
3. Seleccionar plan
4. Proceder al pago (usa tarjeta de prueba: `4242 4242 4242 4242`)
5. Verificar en admin panel que el registro se aprobó automáticamente

### 🔐 Tarjetas de Prueba Stripe
- **Éxito**: 4242 4242 4242 4242
- **Fallo**: 4000 0000 0000 0002
- Cualquier fecha futura y CVV de 3 dígitos
