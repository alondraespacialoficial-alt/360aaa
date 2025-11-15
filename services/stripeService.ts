import { loadStripe } from '@stripe/stripe-js';

// Inicializar Stripe con la publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string; // Stripe Price ID
  features: string[];
  popular?: boolean;
}

// Planes disponibles (deberás crear estos productos en Stripe Dashboard)
export const AVAILABLE_PLANS: Plan[] = [
  {
    id: 'basico_mensual',
    name: 'Básico',
    price: 99,
    priceId: 'price_1STciTIUfZRmRNv7PpiFZCGw',
    features: [
      'Ficha con datos de contacto',
      'Hasta 5 fotos promocionales',
      'Aparición en el directorio por categoría'
    ]
  },
  {
    id: 'destacado_mensual',
    name: 'Destacado',
    price: 199,
    priceId: 'price_1STckRIUfZRmRNv70fzEU8Wu',
    features: [
      'Todo lo del Básico',
      'Aparición en la franja superior de Destacados',
      'Mayor probabilidad de ser contratado',
      '*Los Destacados se muestran primero en la portada y categoría.'
    ],
    popular: true
  },
  {
    id: 'basico_anual',
    name: 'Básico Anual',
    price: 990,
    priceId: 'price_1STcm9IUfZRmRNv7VyYecnoM',
    features: [
      'Ficha con datos de contacto',
      'Hasta 5 fotos promocionales',
      'Aparición en el directorio por categoría',
      'Precio preferencial anual'
    ]
  },
  {
    id: 'destacado_anual',
    name: 'Destacado Anual',
    price: 1990,
    priceId: 'price_1STco7IUfZRmRNv7f99ARIH0',
    features: [
      'Todo lo del Básico',
      'Aparición en la franja superior de Destacados',
      'Mayor probabilidad de ser contratado',
      'Precio preferencial anual',
      '*Los Destacados se muestran primero en la portada y categoría.'
    ],
    popular: true
  }
];

/**
 * Crea una sesión de checkout en Stripe
 */
export async function createCheckoutSession(
  planId: string,
  registrationId: string,
  userEmail: string
): Promise<{ sessionId: string; url: string } | { error: string }> {
  try {
    const plan = AVAILABLE_PLANS.find(p => p.id === planId);
    if (!plan) {
      return { error: 'Plan no encontrado' };
    }

    // Llamar a la Edge Function de Supabase
    const response = await fetch(
      'https://tbtivlwldbwwoclraiue.supabase.co/functions/v1/create-checkout-session',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          registrationId,
          userEmail,
          planName: plan.name
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Error al crear sesión de pago');
    }

    const { sessionId, url } = await response.json();
    return { sessionId, url };
  } catch (error: any) {
    console.error('Error en createCheckoutSession:', error);
    return { error: error.message || 'Error al procesar pago' };
  }
}

/**
 * Redirige al usuario a Stripe Checkout
 */
export async function redirectToCheckout(
  planId: string,
  registrationId: string,
  userEmail: string
): Promise<void> {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe no se pudo cargar');
    }

    const result = await createCheckoutSession(planId, registrationId, userEmail);
    
    if ('error' in result) {
      throw new Error(result.error);
    }

    // Redirigir a Stripe Checkout
    window.location.href = result.url;
  } catch (error: any) {
    console.error('Error redirectToCheckout:', error);
    alert('Error al procesar el pago: ' + error.message);
  }
}

/**
 * Verifica el estado de pago de una sesión
 */
export async function verifyPaymentStatus(sessionId: string): Promise<{
  paid: boolean;
  subscription?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/verify-payment?session_id=${sessionId}`);
    if (!response.ok) {
      throw new Error('Error al verificar pago');
    }
    return await response.json();
  } catch (error: any) {
    return { paid: false, error: error.message };
  }
}

export { stripePromise };
