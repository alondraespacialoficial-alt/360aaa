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
   - `ProviderRegistrationForm.tsx` - Formulario completo de 8 pasos con integración de pago
   - `stripeService.ts` - Servicio para integrar con Stripe

3. **Base de Datos**:
   - `provider_subscriptions` - Tabla para gestionar suscripciones
   - `approve_provider_registration` - Función RPC para aprobar registros automáticamente

### 💳 Planes Disponibles
| Plan | Mensual | Anual | Price ID |
|------|---------|-------|----------|
| Básico | $99 MXN | $990 MXN | `price_1STciTIUfZRmRNv7PpiFZCGw` / `price_1STcm9IUfZRmRNv7VyYecnoM` |
| Destacado | $199 MXN | $1990 MXN | `price_1STckRIUfZRmRNv70fzEU8Wu` / `price_1STco7IUfZRmRNv7f99ARIH0` |

### 🔗 URLs Importantes
- **Webhook Stripe**: `https://tbtivlwldbwwoclraiue.supabase.co/functions/v1/stripe-webhook`
- **Checkout Function**: `https://tbtivlwldbwwoclraiue.supabase.co/functions/v1/create-checkout-session`

### 🔄 Flujo de Pago (ACTUALIZADO - 2025-01-15)

1. Usuario completa formulario de registro (pasos 1-7)
2. Click "Continuar al Pago" → Guarda registro en BD y obtiene `registrationId`
3. Avanza automáticamente a paso 8 con confirmación del registro
4. Usuario selecciona plan (Básico/Destacado, Mensual/Anual)
5. Validación: Verifica que `registrationId` exista antes de proceder
6. Click "Proceder al Pago" → Redirige a Stripe Checkout con `registrationId` en metadata
7. Usuario paga con tarjeta en Stripe
8. Webhook de Stripe recibe el pago con `registrationId`
9. Webhook crea registro en `provider_subscriptions` con `status: 'active'`
10. **Webhook marca el registro con nota "Pago confirmado" pero NO lo aprueba automáticamente**
11. **Admin recibe notificación para revisar y aprobar manualmente**
12. **Admin aprueba desde panel → Proveedor se publica en el directorio**

**IMPORTANTE**: 
- ✅ El pago se procesa y la suscripción queda activa
- ⏳ El registro queda como `status: 'pending'` hasta aprobación manual del admin
- 🔍 El admin puede revisar contenido, fotos y datos antes de publicar
- ✅ Una vez aprobado manualmente, el proveedor aparece en el directorio público

### 🎯 Eventos de Stripe Configurados
- `checkout.session.completed` - Pago completado ✅ **Marca pago confirmado, requiere aprobación manual**
- `customer.subscription.created` - Suscripción creada
- `customer.subscription.updated` - Suscripción actualizada
- `customer.subscription.deleted` - Suscripción cancelada
- `invoice.payment_succeeded` - Renovación exitosa
- `invoice.payment_failed` - Fallo en renovación

### 🔧 Mejoras Recientes (2025-01-15)

#### Problema resuelto:
- ❌ **ANTES**: El formulario recargaba la página después de guardar, perdiendo el `registrationId`
- ✅ **AHORA**: El formulario avanza directamente al paso 8 manteniendo el `registrationId` en estado

#### Cambios implementados:
1. **ProviderRegistrationForm.tsx**:
   - Elimina `window.location.reload()` que rompía el flujo
   - Mantiene `registrationId` en estado del componente
   - Avanza automáticamente a paso 8 después de guardar
   - Valida que `registrationId` exista antes de redirigir a Stripe
   - Muestra mensaje de confirmación con el ID del registro

2. **stripe-webhook/index.ts**:
   - Añade logs detallados para debugging
   - **NO aprueba automáticamente - requiere aprobación manual del admin**
   - Marca el registro con nota "Pago confirmado" y metadata del pago
   - Permite al admin revisar contenido antes de publicar
   - Manejo robusto de errores

### 🧪 Para Probar
1. Ir a `/proveedores/registro`
2. Completar formulario (pasos 1-7) con Google OAuth o manualmente
3. Click "Continuar al Pago" (final del paso 7)
4. **Verificar**: Debes ver paso 8 con mensaje verde "¡Registro guardado exitosamente!" y el ID
5. Seleccionar un plan (usa toggle Mensual/Anual)
6. Click "Proceder al Pago"
7. **Verificar**: Redirige a Stripe Checkout (NO muestra error de "ID no encontrado")
8. Usar tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura, CVV 3 dígitos
9. Completar pago
10. **Verificar**: Registro sigue como `pending` pero tiene nota "Pago confirmado"
11. **Ir al panel admin** (`/admin/panel`)
12. **Aprobar manualmente** el registro
13. **Verificar**: Proveedor ahora visible en directorio público `/proveedores`

### 🔐 Tarjetas de Prueba Stripe
- **Éxito**: 4242 4242 4242 4242
- **Fallo**: 4000 0000 0000 0002
- **Requiere autenticación 3D Secure**: 4000 0025 0000 3155
- Cualquier fecha futura y CVV de 3 dígitos

### 📊 Verificación en Supabase

Después de un pago exitoso, verifica:

```sql
-- 1. Verificar registro con pago confirmado (pero aún pendiente)
SELECT id, business_name, status, admin_notes, metadata
FROM provider_registrations 
WHERE email = 'tu-email@ejemplo.com';
-- Debe mostrar: status='pending', admin_notes con "Pago confirmado"

-- 2. Verificar suscripción activa
SELECT id, plan_name, status, current_period_end, registration_id
FROM provider_subscriptions 
WHERE email = 'tu-email@ejemplo.com';
-- Debe mostrar: status='active' (la suscripción está activa)

-- 3. Después de aprobar manualmente, verificar proveedor creado
SELECT id, name, is_active, created_at 
FROM providers 
WHERE email = 'tu-email@ejemplo.com';
-- Solo aparecerá después de la aprobación manual
```

### 🚨 Troubleshooting

#### Error: "No se encontró el ID de registro"
**Causa**: El `registrationId` se perdió en el flujo
**Solución**: Verifica que el formulario avance a paso 8 y muestre el mensaje de confirmación

#### El pago se procesa pero el proveedor NO se aprueba
**Causa**: Esto es el comportamiento correcto - requiere aprobación manual
**Solución**: 
1. Ir al panel admin → Registros pendientes
2. Verificar que aparezca la nota "Pago confirmado vía Stripe"
3. Revisar el contenido (fotos, descripción, servicios)
4. Aprobar manualmente si todo está correcto
5. El proveedor aparecerá en el directorio público

#### Webhook retorna error 400
**Causa**: Firma del webhook inválida o secret incorrecto
**Solución**: 
1. Verificar que `STRIPE_WEBHOOK_SECRET` esté configurado en Supabase
2. Regenerar el secret en Stripe Dashboard si es necesario

### 📝 Documentación Adicional

Para más detalles sobre la corrección implementada, ver:
- `STRIPE_FIX_RESUMEN.md` - Resumen completo de los cambios y el problema resuelto

---

**Última actualización**: 2025-01-15
**Estado**: ✅ FUNCIONANDO CORRECTAMENTE

