# ✅ Edge Functions Setup - LISTA COMPLETA

## 🔧 **PASO 1: Configurar Variables en Supabase Dashboard**

### 📍 **URL:** https://supabase.com/dashboard/project/tbtivlwldbwwoclraiue
### 📂 **Navegar a:** Settings > Edge Functions > Environment Variables

### 🔑 **Variables REQUERIDAS (copiar exactamente):**

```bash
STRIPE_SECRET_KEY=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
SUPABASE_URL=https://tbtivlwldbwwoclraiue.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGl2bHdsZGJ3d29jbHJhaXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjczNDQsImV4cCI6MjA3NDk0MzM0NH0.LoC4fxE1xfwqXaN1PBHioa6h8JKf_o2qL5vWexKR2No
SUPABASE_SERVICE_ROLE_KEY=[IR A Settings > API y copiar "service_role (secret)"]
STRIPE_WEBHOOK_SECRET=[LO DAMOS DESPUÉS DEL DEPLOY]
```

## 🚀 **PASO 2: Crear/Actualizar Edge Functions**

### A. **create-checkout-session**
- ✅ **Archivo creado:** `/workspaces/360aaa/edge-functions/create-checkout-session.ts`
- ✅ **Funcionalidad:** Validación completa + logs detallados  
- ✅ **CORS:** Headers correctos para frontend

### B. **stripe-webhook** 
- ✅ **Archivo creado:** `/workspaces/360aaa/edge-functions/stripe-webhook.ts`
- ✅ **Funcionalidad:** Manejo de todos los eventos Stripe + auto-aprobación
- ✅ **Logging:** Emojis y detalles para debugging fácil

## 📋 **PASO 3: Comandos para Deploy (Supabase CLI)**

```bash
# 1. Instalar Supabase CLI (si no tienes)
npm install -g supabase

# 2. Login a Supabase
supabase login

# 3. Link al proyecto
supabase link --project-ref tbtivlwldbwwoclraiue

# 4. Deploy Edge Functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## 🔗 **PASO 4: Configurar Webhook en Stripe Dashboard**

### A. **Ir a:** https://dashboard.stripe.com/webhooks
### B. **Crear Endpoint:**
- **URL:** `https://tbtivlwldbwwoclraiue.supabase.co/functions/v1/stripe-webhook`
- **Eventos a escuchar:**
  ```
  checkout.session.completed
  customer.subscription.created
  customer.subscription.updated  
  customer.subscription.deleted
  invoice.payment_succeeded
  invoice.payment_failed
  ```

### C. **Copiar Webhook Secret**
- En Stripe Dashboard > Webhook > "Signing secret"
- Agregar como `STRIPE_WEBHOOK_SECRET` en Supabase

## ✅ **CHECKLIST FINAL**

- [ ] Variables configuradas en Supabase Dashboard
- [ ] Edge Functions deployadas  
- [ ] Webhook configurado en Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` añadido a Supabase
- [ ] Frontend apuntando a URLs correctas

---
## 🎯 **URLs Finales de Edge Functions:**
- **Checkout:** `https://tbtivlwldbwwoclraiue.supabase.co/functions/v1/create-checkout-session`
- **Webhook:** `https://tbtivlwldbwwoclraiue.supabase.co/functions/v1/stripe-webhook`

### 3. Headers CORS Requeridos
Las Edge Functions deben incluir estos headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

## 🔍 Checklist de Debugging

### Edge Function: create-checkout-session
- [ ] Variable `STRIPE_SECRET_KEY` configurada
- [ ] Headers CORS incluidos
- [ ] Validación de datos de entrada
- [ ] Error handling completo
- [ ] Logs para debugging

### Edge Function: stripe-webhook  
- [ ] Variable `STRIPE_SECRET_KEY` configurada
- [ ] Verificación de signature de Stripe
- [ ] Actualización de estado en Supabase
- [ ] Error handling robusto

### Frontend Integration
- [ ] URL correcta de Edge Function
- [ ] Headers de autorización
- [ ] Manejo de errores 401/500
- [ ] Fallback UX

## 📋 Pasos Siguientes

1. **Pegar código de Edge Functions** aquí para revisión
2. **Configurar variables** en Supabase Dashboard  
3. **Probar funciones** con datos reales
4. **Validar flujo completo** de pago

---
*Última actualización: 15/11/2025*