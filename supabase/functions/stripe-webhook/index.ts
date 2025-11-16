import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Received event: ${event.type}`)

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const registrationId = session.metadata?.registration_id
  const subscriptionId = session.subscription as string

  console.log('📝 Processing checkout completion...')
  console.log('Registration ID:', registrationId)
  console.log('Subscription ID:', subscriptionId)

  if (!subscriptionId) {
    console.error('❌ No subscription ID found in session')
    return
  }

  // Obtener detalles de la suscripción
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0].price.id
  const customerId = subscription.customer as string

  console.log('Price ID:', priceId)
  console.log('Customer ID:', customerId)

  // Buscar el plan correspondiente
  const planMapping: { [key: string]: { id: string; name: string; billing: string } } = {
    'price_1STciTIUfZRmRNv7PpiFZCGw': { id: 'basico_mensual', name: 'Básico', billing: 'monthly' },
    'price_1STckRIUfZRmRNv70fzEU8Wu': { id: 'destacado_mensual', name: 'Destacado', billing: 'monthly' },
    'price_1STcm9IUfZRmRNv7VyYecnoM': { id: 'basico_anual', name: 'Básico Anual', billing: 'yearly' },
    'price_1STco7IUfZRmRNv7f99ARIH0': { id: 'destacado_anual', name: 'Destacado Anual', billing: 'yearly' },
  }

  const plan = planMapping[priceId]
  if (!plan) {
    console.error('❌ Unknown price ID:', priceId)
    return
  }

  console.log('✅ Plan identified:', plan.name, '(' + plan.id + ')')

  // Crear registro de suscripción en Supabase
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('provider_subscriptions')
    .insert({
      registration_id: registrationId || null,
      email: session.customer_email || session.customer_details?.email,
      plan_id: plan.id,
      plan_name: plan.name,
      price: subscription.items.data[0].price.unit_amount! / 100,
      billing_cycle: plan.billing,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      stripe_checkout_session_id: session.id,
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .select()
    .single()

  if (subscriptionError) {
    console.error('❌ Error creating subscription record:', subscriptionError)
    return
  }

  console.log('✅ Subscription created in DB:', subscriptionData.id)

  // Marcar el registro como "pago confirmado" pero NO aprobar automáticamente
  if (registrationId) {
    console.log('💰 Payment confirmed for registration:', registrationId)
    console.log('⏳ Awaiting admin approval...')
    
    try {
      // Actualizar registro con nota de pago confirmado Y marcar pago como completado
      const { error: updateError } = await supabase
        .from('provider_registrations')
        .update({
          payment_status: 'completed',
          admin_notes: `✅ Pago confirmado vía Stripe el ${new Date().toLocaleString('es-MX')}. Plan: ${plan.name} (${plan.billing === 'monthly' ? 'Mensual' : 'Anual'}). Pendiente de aprobación manual.`,
          metadata: {
            payment_confirmed_at: new Date().toISOString(),
            stripe_subscription_id: subscriptionId,
            plan_id: plan.id
          }
        })
        .eq('id', registrationId)
      
      if (updateError) {
        console.error('❌ Error updating registration with payment info:', updateError)
      } else {
        console.log('✅ Registration updated with payment confirmation')
        console.log('📧 Admin should review and approve manually in admin panel')
      }
    } catch (error: any) {
      console.error('❌ Exception updating registration:', error)
    }
  } else {
    console.warn('⚠️ No registration ID provided, payment recorded but cannot link to registration')
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('provider_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('provider_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error canceling subscription:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    await handleSubscriptionUpdated(
      await stripe.subscriptions.retrieve(invoice.subscription as string)
    )
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const { error } = await supabase
    .from('provider_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription as string)

  if (error) {
    console.error('Error marking subscription as past_due:', error)
  }
}
