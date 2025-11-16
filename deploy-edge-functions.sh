#!/bin/bash

# Script para re-deployar Edge Function con nuevas redirecciones
# Ejecutar: ./deploy-edge-functions.sh

echo "🚀 Re-deploying Edge Functions con nuevas redirecciones..."

echo "📦 Deploying create-checkout-session..."
supabase functions deploy create-checkout-session --no-verify-jwt

echo "📦 Deploying stripe-webhook..."
supabase functions deploy stripe-webhook --no-verify-jwt

echo "✅ Edge Functions deployed successfully!"
echo ""
echo "🔗 Nuevas URLs de redirección:"
echo "   Success: /proveedor/estado?id={REGISTRATION_ID}&success=true"
echo "   Cancel:  /proveedores/registro?canceled=true"
echo ""
echo "🧪 Para probar:"
echo "   1. Haz un registro de proveedor"
echo "   2. Completa el pago en Stripe"
echo "   3. Deberías ser redirigido a la página de estado"
echo ""