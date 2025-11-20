    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
    import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

    // Verificar variables de entorno al inicio
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !webhookSecret) {
    console.error('Missing required environment variables:', {
        has_stripe_key: !!stripeSecretKey,
        has_supabase_url: !!supabaseUrl,
        has_supabase_service_key: !!supabaseServiceKey,
        has_webhook_secret: !!webhookSecret
    });
    }

    const stripe = new Stripe(stripeSecretKey || '', {
    apiVersion: '2023-10-16'
    });

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    serve(async (req) => {
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
        console.error('Missing Stripe signature header');
        return new Response('Missing signature', { status: 400 });
    }

    if (!webhookSecret) {
        console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
        return new Response('Webhook configuration error', { status: 500 });
    }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    
    console.log(`✅ Received event: ${event.type} (ID: ${event.id})`);        // Manejar diferentes tipos de eventos
        switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as any;
            await handleCheckoutCompleted(session);
            break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const subscription = event.data.object as any;
            await handleSubscriptionUpdated(subscription);
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as any;
            await handleSubscriptionDeleted(subscription);
            break;
        }
        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as any;
            await handleInvoicePaymentSucceeded(invoice);
            break;
        }
        case 'invoice.payment_failed': {
            const invoice = event.data.object as any;
            await handleInvoicePaymentFailed(invoice);
            break;
        }
        default:
            console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
        });

    } catch (error) {
        console.error('❌ Webhook error:', {
        message: error.message,
        stack: error.stack,
        signature_exists: !!signature,
        webhook_secret_exists: !!webhookSecret
        });
        
        return new Response(JSON.stringify({
        error: 'Webhook processing failed',
        details: error.message
        }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
        });
    }
    });

    async function handleCheckoutCompleted(session: any) {
    try {
        const registrationId = session.metadata?.registration_id;
        const subscriptionId = session.subscription;
        
        console.log(`📋 Processing checkout completion:`, {
        session_id: session.id,
        registration_id: registrationId,
        subscription_id: subscriptionId
        });

        if (!subscriptionId) {
        console.log('⚠️ No subscription ID found in session');
        return;
        }

        // Obtener detalles de la suscripción
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        const customerId = subscription.customer;

        // Buscar el plan correspondiente
        const planMapping: Record<string, any> = {
        'price_1STciTIUfZRmRNv7PpiFZCGw': {
            id: 'basico_mensual',
            name: 'Básico',
            billing: 'monthly'
        },
        'price_1STckRIUfZRmRNv70fzEU8Wu': {
            id: 'destacado_mensual',
            name: 'Destacado',
            billing: 'monthly'
        },
        'price_1STcm9IUfZRmRNv7VyYecnoM': {
            id: 'basico_anual',
            name: 'Básico Anual',
            billing: 'yearly'
        },
        'price_1STco7IUfZRmRNv7f99ARIH0': {
            id: 'destacado_anual',
            name: 'Destacado Anual',
            billing: 'yearly'
        }
        };

        const plan = planMapping[priceId];
        if (!plan) {
        console.error('❌ Unknown price ID:', priceId);
        return;
        }

        console.log(`📦 Plan identified:`, plan);

        // Crear registro de suscripción en Supabase
        const { data, error } = await supabase
        .from('provider_subscriptions')
        .insert({
            registration_id: registrationId,
            user_id: session.client_reference_id || null,
            email: session.customer_email || session.customer_details?.email,
            plan_id: plan.id,
            plan_name: plan.name,
            price: subscription.items.data[0].price.unit_amount / 100,
            billing_cycle: plan.billing,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            stripe_checkout_session_id: session.id,
            status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .select()
        .single();

        if (error) {
        console.error('❌ Error creating subscription record:', error);
        throw error;
        }

        console.log('✅ Subscription created:', data.id);

        // Si hay registration_id, marcar pago como completado (NO aprobar automáticamente)
        if (registrationId) {
        console.log('💳 Payment confirmed for registration:', registrationId);
        console.log('⏳ Awaiting admin approval...');
        
        const { error: updateError } = await supabase
            .from('provider_registrations')
            .update({
            admin_notes: `✅ Pago confirmado vía Stripe el ${new Date().toLocaleString('es-MX')}. Plan: ${plan.name} (${plan.billing === 'monthly' ? 'Mensual' : 'Anual'}). Pendiente de aprobación manual.`,
            metadata: {
                payment_confirmed_at: new Date().toISOString(),
                stripe_subscription_id: subscriptionId,
                plan_id: plan.id,
                payment_status: 'completed'
            }
            })
            .eq('id', registrationId);

        if (updateError) {
            console.error('❌ Error updating registration with payment info:', updateError);
        } else {
            console.log('✅ Registration updated with payment confirmation');
            console.log('📧 Admin should review and approve manually in admin panel');
        }
        } else {
        console.warn('⚠️ No registration ID provided, payment recorded but cannot link to registration');
        }

    } catch (error) {
        console.error('❌ Error in handleCheckoutCompleted:', error);
        throw error;
    }
    }

async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log(`🔄 Processing subscription update/create: ${subscription.id}`);
    console.log(`Status: ${subscription.status}, Metadata:`, subscription.metadata);
    
    // Verificar si ya existe la suscripción
    const { data: existing } = await supabase
      .from('provider_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existing) {
      // Actualizar suscripción existente
      const { error } = await supabase
        .from('provider_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('❌ Error updating subscription:', error);
        throw error;
      }
      console.log('✅ Subscription updated successfully');
    } else {
      console.log('ℹ️ Subscription not found in DB, will be created by checkout.session.completed');
    }
  } catch (error) {
    console.error('❌ Error in handleSubscriptionUpdated:', error);
    throw error;
  }
}async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log(`🗑️ Canceling subscription: ${subscription.id}`);
    
    const canceledAt = subscription.canceled_at 
      ? new Date(subscription.canceled_at * 1000).toISOString() 
      : new Date().toISOString();
    
    const { error } = await supabase
      .from('provider_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: canceledAt
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('❌ Error canceling subscription:', error);
      throw error;
    }

    console.log('✅ Subscription canceled successfully');
  } catch (error) {
    console.error('❌ Error in handleSubscriptionDeleted:', error);
    throw error;
  }
}    async function handleInvoicePaymentSucceeded(invoice: any) {
    try {
        console.log(`💰 Payment succeeded for invoice: ${invoice.id}`);
        
        if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        await handleSubscriptionUpdated(subscription);
        }
    } catch (error) {
        console.error('❌ Error in handleInvoicePaymentSucceeded:', error);
        throw error;
    }
    }

    async function handleInvoicePaymentFailed(invoice: any) {
    try {
        console.log(`💸 Payment failed for invoice: ${invoice.id}`);
        
        if (invoice.subscription) {
        // Marcar suscripción como atrasada
        const { error } = await supabase
            .from('provider_subscriptions')
            .update({
            status: 'past_due'
            })
            .eq('stripe_subscription_id', invoice.subscription);

        if (error) {
            console.error('❌ Error marking subscription as past_due:', error);
            throw error;
        }

        console.log('✅ Subscription marked as past_due');
        
        // Notificar en el registro si existe
        const { data: subscription } = await supabase
            .from('provider_subscriptions')
            .select('registration_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();
        
        if (subscription?.registration_id) {
            await supabase
            .from('provider_registrations')
            .update({
                admin_notes: `❌ Pago fallido el ${new Date().toLocaleString('es-MX')}. Se requiere actualizar método de pago.`,
                metadata: {
                payment_status: 'failed',
                payment_failed_at: new Date().toISOString(),
                stripe_invoice_id: invoice.id
                }
            })
            .eq('id', subscription.registration_id);
        }
        }
    } catch (error) {
        console.error('❌ Error in handleInvoicePaymentFailed:', error);
        throw error;
    }
    }