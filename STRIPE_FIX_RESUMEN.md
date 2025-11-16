# 🔧 Corrección Integración Stripe - Resumen

## ❌ Problema Identificado

La integración de Stripe **NO estaba detectando los pagos correctamente** porque había un problema en el flujo de datos del `registrationId`.

### Qué fallaba:

1. **Flujo roto del `registrationId`**:
   - El formulario guardaba el registro en la BD ✅
   - Pero NO avanzaba automáticamente al paso 8 (pago) ❌
   - El usuario tenía que hacer clic de nuevo, perdiendo el `registrationId` ❌

2. **Webhook sin `registrationId`**:
   - Al crear el checkout de Stripe, a veces el `registrationId` era `undefined`
   - El webhook recibía el pago pero NO podía aprobar el registro automáticamente
   - El proveedor pagaba pero su perfil NO se activaba 😱

3. **Falta de logs y validación**:
   - No había logs detallados en el webhook
   - No había validación de que el `registrationId` existiera antes de redirigir a Stripe
   - No había mensaje de confirmación al usuario de que su registro fue guardado

---

## ✅ Solución Implementada

### 1. **Formulario de Registro** (`ProviderRegistrationForm.tsx`)

**Cambios**:
```typescript
// ANTES: El formulario recargaba la página después de guardar
// DESPUÉS: Avanza directamente al paso 8 con el registrationId guardado

const handleSubmit = async () => {
  const result = await registerProvider(registrationData);
  
  if (result.success) {
    const regId = result.registrationId || '';
    setRegistrationId(regId); // ✅ Guarda el ID en el estado
    
    setCurrentStep(8); // ✅ Avanza automáticamente al paso de pago
    setIsSubmitting(false);
  }
};
```

**Mejoras**:
- ✅ Elimina el `sessionStorage` innecesario
- ✅ Elimina el `window.location.reload()` que rompía el flujo
- ✅ Mantiene el `registrationId` en el estado del componente
- ✅ Avanza automáticamente al paso 8 (pago)

### 2. **Paso 8 - Selección de Plan**

**Cambios**:
```typescript
// ANTES: No validaba que existiera el registrationId
// DESPUÉS: Muestra confirmación y valida antes de proceder

{registrationId && (
  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
    <h3>¡Registro guardado exitosamente!</h3>
    <p>ID: <code>{registrationId}</code></p>
  </div>
)}

onPaymentClick={async () => {
  if (!registrationId) {
    alert('Error: No se encontró el ID de registro');
    return; // ✅ Previene continuar sin registrationId
  }
  
  console.log('💳 Procesando pago para registro:', registrationId);
  
  await redirectToCheckout(
    selectedPlanId,
    registrationId, // ✅ SIEMPRE pasa el registrationId
    formData.email
  );
}}
```

**Mejoras**:
- ✅ Muestra mensaje de confirmación con el ID del registro
- ✅ Valida que exista `registrationId` antes de proceder al pago
- ✅ Añade logs para debugging
- ✅ Evita llamar a Stripe sin el `registrationId`

### 3. **Webhook de Stripe** (`stripe-webhook/index.ts`)

**Cambios**:
```typescript
// ANTES: Logs mínimos, aprobación fallaba silenciosamente
// DESPUÉS: Logs detallados, múltiples métodos de aprobación

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('📝 Processing checkout completion...');
  console.log('Registration ID:', registrationId);
  console.log('Subscription ID:', subscriptionId);
  
  // ... crear suscripción ...
  
  if (registrationId) {
    console.log('🔄 Auto-approving registration:', registrationId);
    
    try {
      // Método 1: RPC function
      const { data, error } = await supabase.rpc(
        'approve_provider_registration',
        {
          registration_id: registrationId,
          admin_user_id: '00000000-0000-0000-0000-000000000000' // UUID especial
        }
      );
      
      if (error) {
        // Método 2: Actualización directa (fallback)
        console.log('🔄 Trying alternative approval method...');
        await supabase
          .from('provider_registrations')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            admin_notes: 'Auto-aprobado por pago exitoso vía Stripe'
          })
          .eq('id', registrationId);
      }
    } catch (error) {
      console.error('❌ Exception during approval:', error);
    }
  } else {
    console.warn('⚠️ No registration ID provided, skipping auto-approval');
  }
}
```

**Mejoras**:
- ✅ Logs detallados en cada paso del proceso
- ✅ UUID especial para aprobaciones automáticas (`00000000-0000-0000-0000-000000000000`)
- ✅ Método alternativo de aprobación si la RPC function falla
- ✅ Actualiza `provider_subscriptions` con el `provider_id` después de la aprobación
- ✅ Manejo robusto de errores con fallback

---

## 🔄 Flujo Correcto Ahora

### Paso a Paso:

1. **Usuario completa formulario (pasos 1-7)**
   - Datos básicos, categorías, descripción, ubicación, servicios, fotos, redes

2. **Click "Continuar al Pago"** (final del paso 7)
   - Se ejecuta `handleSubmit()`
   - Se guarda registro en `provider_registrations`
   - Se obtiene `registrationId` (ej: `550e8400-e29b-41d4-a716-446655440000`)
   - Se guarda en estado: `setRegistrationId(regId)`
   - Se avanza automáticamente: `setCurrentStep(8)`

3. **Paso 8 - Selección de Plan**
   - Se muestra mensaje de confirmación con el `registrationId`
   - Usuario selecciona plan (Básico/Destacado, Mensual/Anual)
   - Click "Proceder al Pago"

4. **Validación pre-checkout**
   ```typescript
   if (!registrationId) {
     alert('Error: No se encontró el ID de registro');
     return;
   }
   ```

5. **Crear sesión de Stripe**
   - Se llama `redirectToCheckout(planId, registrationId, email)`
   - Edge Function `create-checkout-session` recibe:
     ```json
     {
       "priceId": "price_1STckRIUfZRmRNv70fzEU8Wu",
       "registrationId": "550e8400-e29b-41d4-a716-446655440000",
       "userEmail": "proveedor@ejemplo.com",
       "planName": "Destacado"
     }
     ```
   - Stripe crea sesión con `metadata.registration_id`

6. **Usuario paga en Stripe Checkout**
   - Stripe procesa el pago
   - Crea la suscripción
   - Dispara webhook `checkout.session.completed`

7. **Webhook procesa el pago**
   ```typescript
   // Recibe session.metadata.registration_id
   const registrationId = session.metadata?.registration_id; // ✅ EXISTE
   
   // Crea registro en provider_subscriptions
   await supabase.from('provider_subscriptions').insert({
     registration_id: registrationId,
     plan_id: 'destacado_mensual',
     status: 'active', // ✅ Suscripción activa
     // ...
   });
   
   // Marca el pago como confirmado pero NO aprueba automáticamente
   await supabase
     .from('provider_registrations')
     .update({
       admin_notes: '✅ Pago confirmado vía Stripe. Pendiente de aprobación manual.',
       metadata: {
         payment_confirmed_at: new Date().toISOString(),
         stripe_subscription_id: subscriptionId,
         plan_id: 'destacado_mensual'
       }
     })
     .eq('id', registrationId);
   ```

8. **Admin revisa y aprueba manualmente**:
   - ✅ Registro en `provider_registrations` con `status: 'pending'` y nota "Pago confirmado"
   - ✅ Suscripción activa en `provider_subscriptions` con `status: 'active'`
   - ⏳ Admin revisa contenido, fotos y datos en el panel admin
   - ✅ Admin aprueba → Proveedor se crea en `providers` con `is_active: true`
   - ✅ Proveedor visible en el directorio público
   - ✅ Tracking de analytics activado
     status: 'active',
     // ...
   });
   
   // Aprueba el registro
   const { data: providerId } = await supabase.rpc('approve_provider_registration', {
     registration_id: registrationId,
     admin_user_id: '00000000-0000-0000-0000-000000000000'
   });
   
   // Actualiza suscripción con provider_id
   await supabase
     .from('provider_subscriptions')
     .update({ provider_id: providerId })
     .eq('id', subscriptionData.id);
   ```

8. **Resultado final**:
   - ✅ Registro en `provider_registrations` con `status: 'approved'`
   - ✅ Proveedor creado en `providers` con `is_active: true`
   - ✅ Suscripción activa en `provider_subscriptions`
   - ✅ Proveedor visible en el directorio público
   - ✅ Tracking de analytics activado
   - ✅ Email de confirmación (si está configurado)

---

## 🧪 Cómo Probar

### Modo Test (Stripe Test Mode):

1. **Ir a** `/proveedores/registro`

2. **Completar formulario** (todos los pasos 1-7)

3. **En paso 7 - Click "Continuar al Pago"**
   - ✅ Deberías ver el paso 8 inmediatamente
   - ✅ Deberías ver mensaje verde: "¡Registro guardado exitosamente!" con el ID

4. **Seleccionar un plan** (ej: Destacado Mensual - $199)

5. **Click "Proceder al Pago"**
   - ✅ Redirige a Stripe Checkout
   - ✅ URL contiene el `session_id`

6. **En Stripe Checkout, usar tarjeta de prueba**:
   - **Número**: `4242 4242 4242 4242`
   - **Fecha**: Cualquier fecha futura (ej: `12/25`)
   - **CVV**: Cualquier 3 dígitos (ej: `123`)
   - **Código postal**: Cualquiera (ej: `12345`)

7. **Completar el pago**
   - ✅ Stripe procesa el pago
   - ✅ Redirige a `/proveedores/registro?success=true&session_id=...`

8. **Verificar en Supabase**:
   ```sql
   -- 1. Verificar registro aprobado
   SELECT status, reviewed_at, provider_id 
   FROM provider_registrations 
   WHERE email = 'tu-email@ejemplo.com';
   -- Debería mostrar: status='approved'
   
   -- 2. Verificar proveedor creado
   SELECT id, name, is_active 
   FROM providers 
   WHERE email = 'tu-email@ejemplo.com';
   -- Debería existir con is_active=true
   
   -- 3. Verificar suscripción
   SELECT * 
   FROM provider_subscriptions 
   WHERE email = 'tu-email@ejemplo.com';
   -- Debería mostrar status='active'
   ```

9. **Verificar en el directorio público**:
   - Ir a `/proveedores`
   - Buscar tu negocio por nombre o categoría
   - ✅ Debería aparecer en los resultados

---

## 📊 Logs para Debugging

### En el navegador (Console):
```
📝 Enviando registro...
✅ Registro guardado con ID: 550e8400-e29b-41d4-a716-446655440000
💳 Procesando pago para registro: 550e8400-e29b-41d4-a716-446655440000
📦 Plan seleccionado: destacado_mensual
```

### En Supabase Edge Functions (Logs del webhook):
```
📝 Processing checkout completion...
Registration ID: 550e8400-e29b-41d4-a716-446655440000
Subscription ID: sub_1QaBcD2eFgHiJkLm
Price ID: price_1STckRIUfZRmRNv70fzEU8Wu
Customer ID: cus_AbCdEfGhIjKl
✅ Plan identified: Destacado (destacado_mensual)
✅ Subscription created in DB: 12345678-abcd-efgh-ijkl-123456789012
🔄 Auto-approving registration: 550e8400-e29b-41d4-a716-446655440000
✅ Registration auto-approved! Provider ID: 98765432-zyxw-vusr-qpon-987654321098
```

---

## 🚀 Deploy a Producción

### 1. Actualizar Edge Functions en Supabase:

```bash
# Navegar a la carpeta de funciones
cd supabase/functions

# Deploy de create-checkout-session
supabase functions deploy create-checkout-session

# Deploy de stripe-webhook
supabase functions deploy stripe-webhook
```

### 2. Verificar variables de entorno en Supabase:

En el dashboard de Supabase → Project Settings → Edge Functions → Secrets:

- ✅ `STRIPE_SECRET_KEY` (de Stripe Dashboard → Developers → API Keys)
- ✅ `STRIPE_WEBHOOK_SECRET` (de Stripe Dashboard → Developers → Webhooks)
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurar webhook en Stripe:

1. Ir a Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://tbtivlwldbwwoclraiue.supabase.co/functions/v1/stripe-webhook`
4. **Events to listen**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copiar el **Signing secret** y guardarlo en Supabase como `STRIPE_WEBHOOK_SECRET`

### 4. Deploy del frontend:

```bash
# Build de producción
npm run build

# Deploy a Vercel (si usas Vercel)
vercel --prod
```

---

## ✅ Checklist Final

Antes de considerar la integración completa, verifica:

- [ ] Los Price IDs en `stripeService.ts` coinciden con los de Stripe Dashboard
- [ ] El webhook está configurado en Stripe con la URL correcta
- [ ] Las variables de entorno están configuradas en Supabase
- [ ] Las Edge Functions están deployadas en Supabase
- [ ] La función `approve_provider_registration` existe en la BD
- [ ] La tabla `provider_subscriptions` tiene RLS habilitado
- [ ] El flujo de prueba funciona de principio a fin
- [ ] Los logs del webhook muestran `✅ Registration auto-approved`
- [ ] El proveedor aparece en el directorio público después del pago
- [ ] El email de confirmación se envía (si está configurado)

---

## 🆘 Troubleshooting

### Problema: "El pago se procesa pero el proveedor NO se aprueba"

**Solución**:
1. Revisar logs del webhook en Supabase → Edge Functions → Logs
2. Buscar el mensaje: `Registration ID: ...`
3. Si es `undefined` o `null`, el problema está en el frontend
4. Verificar que `redirectToCheckout()` reciba el `registrationId` correcto

### Problema: "Error: No se encontró el ID de registro"

**Solución**:
1. Verificar que el formulario llegue al paso 8
2. Revisar console del navegador: debe mostrar `✅ Registro guardado con ID: ...`
3. Si no aparece, revisar que `registerProvider()` retorne `success: true`

### Problema: "El webhook retorna error 400"

**Solución**:
1. Verificar que `STRIPE_WEBHOOK_SECRET` esté configurado en Supabase
2. Verificar que la firma del webhook sea válida
3. Revisar logs del webhook para ver el error específico

---

## 📝 Notas Adicionales

- El `admin_user_id` especial `00000000-0000-0000-0000-000000000000` se usa para identificar aprobaciones automáticas
- Si la función RPC falla, el webhook intenta aprobar con `UPDATE` directo
- Los logs son cruciales para debugging en producción
- Stripe Test Mode usa tarjetas de prueba, Production Mode usa tarjetas reales
- Las suscripciones se renuevan automáticamente según el `billing_cycle`

---

**Autor**: GitHub Copilot
**Fecha**: 2025-01-15
**Versión**: 1.0
