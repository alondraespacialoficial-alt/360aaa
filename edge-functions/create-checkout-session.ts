import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const { priceId, registrationId, userEmail, planName } = await req.json();
    
    // Validar parámetros
    if (!priceId || !userEmail) {
      console.error('Missing required parameters:', { priceId: !!priceId, userEmail: !!userEmail });
      throw new Error('Missing required parameters: priceId and userEmail are required');
    }

    // Verificar que existe la STRIPE_SECRET_KEY
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found in environment variables');
      throw new Error('Stripe configuration missing');
    }

    console.log('Creating Stripe session for:', { priceId, userEmail, planName });

    // Inicializar Stripe con la secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });

    // Crear o buscar el customer en Stripe
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          registration_id: registrationId || ''
        }
      });
      console.log('Created new customer:', customer.id);
    }

    // Obtener el origin correcto
    const origin = req.headers.get('origin') || 'http://localhost:3004';
    
    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${origin}/proveedor/estado?id=${registrationId}&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/proveedores/registro?canceled=true`,
      metadata: {
        registration_id: registrationId || '',
        plan_name: planName || ''
      },
      subscription_data: {
        metadata: {
          registration_id: registrationId || ''
        }
      }
    });

    console.log('Checkout session created:', session.id);

    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('Error creating checkout session:', {
      message: error.message,
      stack: error.stack,
      env_vars: {
        has_stripe_key: !!Deno.env.get('STRIPE_SECRET_KEY')
      }
    });
    
    return new Response(JSON.stringify({
      error: error.message,
      details: 'Check server logs for more information'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});