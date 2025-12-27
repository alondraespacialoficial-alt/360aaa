import { supabase } from './supabaseClient';
import { getProvidersForQuery } from './supabaseClient';

// Configuración de la IA
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Tipos TypeScript
interface AISettings {
  is_enabled: boolean;
  daily_budget_usd: number;
  monthly_budget_usd: number;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  max_tokens_per_question: number;
  max_conversation_length: number;
  welcome_message: string;
}

interface AIUsage {
  session_id: string;
  user_ip: string;
  user_id?: string;
  question: string;
  response: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  processing_time_ms: number;
}

interface RateLimitResult {
  allowed: boolean;
  current_count?: number;
  limit?: number;
  window_reset?: string;
  error?: string;
}

// Cache para respuestas comunes (evitar tokens innecesarios)
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Preguntas frecuentes con respuestas pre-definidas (más específicas para evitar loops)
const FAQ_RESPONSES: Record<string, string> = {
  'ayuda': 'Puedo ayudarte con: 🔍 Buscar proveedores, ⭐ Ver reseñas y calificaciones, 💰 Comparar precios, 📍 Encontrar proveedores por ubicación. ¿Qué necesitas?',
  'horarios': 'Nuestro directorio está disponible 24/7. Los proveedores tienen sus propios horarios de atención que puedes consultar en sus perfiles.',
  'costo': 'El directorio de Charlitron Eventos 360 es completamente gratuito para usuarios. Los precios de servicios varían por proveedor.',
  'como funciona': 'Charlitron Eventos 360 es un directorio de proveedores de eventos verificados. Puedes buscar por categoría, ubicación, ver reseñas y contactar directamente a los proveedores.',
};

class AIAssistantService {
  private sessionId: string;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  // pending clarification stored between turns for this session
  private pendingClarification: { originalQuestion: string; askedCity: boolean; askedBudget: boolean } | null = null;
  // Context tracking para mantener el foco en el servicio actual
  private activeContext: { 
    service_type: string | null; 
    provider_name: string | null;
    last_candidates: any[] | null;
  } = {
    service_type: null,
    provider_name: null, 
    last_candidates: null
  };

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private updateConversationHistory(question: string, response: string) {
    // Mantener historial de las últimas 6 interacciones (3 pares pregunta-respuesta)
    this.conversationHistory.push({ role: 'user', content: question });
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    // Limitar historial para no consumir demasiada memoria
    if (this.conversationHistory.length > 6) {
      this.conversationHistory = this.conversationHistory.slice(-6);
    }
  }

  private updateActiveContext(service_type: string | null, candidates: any[] = []) {
    this.activeContext.service_type = service_type;
    this.activeContext.last_candidates = candidates.length > 0 ? candidates : null;
    
    // Si hay candidatos, establecer el proveedor principal
    if (candidates.length > 0) {
      this.activeContext.provider_name = candidates[0].provider_name;
    }
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private getCacheKey(question: string): string {
    return question.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').slice(0, 50);
  }

  private isInCache(question: string): string | null {
    const key = this.getCacheKey(question);
    const cached = responseCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.response;
    }
    
    return null;
  }

  private addToCache(question: string, response: string): void {
    const key = this.getCacheKey(question);
    responseCache.set(key, { response, timestamp: Date.now() });
  }

  private getFAQResponse(question: string): string | null {
    const lowerQuestion = question.toLowerCase().trim();
    
    // Solo responder FAQ si la pregunta es muy específica y corta
    if (lowerQuestion.length > 50) return null;
    
    // Evitar FAQ cuando hay términos de búsqueda específicos
    if (/(busco|necesito|quiero|proveedor|video|foto|dulce|catering|decorac|transport)/i.test(lowerQuestion)) {
      return null;
    }
    
    for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerQuestion === key || lowerQuestion.startsWith(key + ' ') || lowerQuestion.endsWith(' ' + key)) {
        return response;
      }
    }
    
    return null;
  }

  private async getAISettings(): Promise<AISettings> {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1);

    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      // Configuración por defecto si no hay en BD
      return {
        is_enabled: true,
        daily_budget_usd: 2.00,
        monthly_budget_usd: 50.00,
        rate_limit_per_minute: 2,
        rate_limit_per_hour: 3,
        rate_limit_per_day: 5,
        max_tokens_per_question: 300,
        max_conversation_length: 10,
        welcome_message: '¡Hola! Soy tu asistente virtual de Charlitron Eventos 360. ¿En qué puedo ayudarte?'
      };
    }

    // Si es array, tomar el primer elemento
    return Array.isArray(data) ? data[0] : data;
  }

  private async checkRateLimit(userIdentifier: string, identifierType: 'ip' | 'user_id'): Promise<RateLimitResult> {
    try {
      // Verificar límites para minuto, hora y día
      const windows = ['minute', 'hour', 'day'];
      
      for (const window of windows) {
        const { data, error } = await supabase.rpc('check_ai_rate_limit', {
          p_user_identifier: userIdentifier,
          p_identifier_type: identifierType,
          p_window_type: window
        });

        if (error) {
          console.error('Error checking rate limit:', error);
          continue;
        }

        if (!data.allowed) {
          return data;
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // En caso de error, permitir (fail-open)
      return { allowed: true };
    }
  }

  private async buildDynamicContext(): Promise<string> {
    try {
      console.log('🏗️ Building dynamic context...');
      
      // Obtener datos en tiempo real de Supabase
      const [
        { data: providers, error: providersError },
        { data: categories, error: categoriesError }, 
        { data: reviews, error: reviewsError },
        { data: recentAnalytics, error: analyticsError },
        { data: services, error: servicesError }
      ] = await Promise.all([
        supabase.from('providers').select(`
          id, name, city, state, description, is_premium, featured, is_verified,
          contact, website_url, instagram_url, facebook_url, 
          rating_average, total_reviews, total_events, years_experience,
          profile_image_url, cover_image_url
        `).eq('is_active', true),
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('provider_reviews').select('provider_id, rating, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('provider_analytics').select('provider_id, event_type').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).limit(100),
        supabase.from('provider_services').select('provider_id, category_id, name, price, description').limit(200)
      ]);
      
      // Log de errores específicos
      if (providersError) console.error('❌ Providers error:', providersError);
      if (categoriesError) console.error('❌ Categories error:', categoriesError);
      if (reviewsError) console.error('❌ Reviews error:', reviewsError);
      if (analyticsError) console.error('❌ Analytics error:', analyticsError);
      if (servicesError) console.error('❌ Services error:', servicesError);

      // Calcular estadísticas
      const totalProviders = providers?.length || 0;
      const categoriesCount = categories?.length || 0;
      const totalReviews = reviews?.length || 0;
      
      // Calcular promedios de rating por proveedor
      const ratingsByProvider: Record<string, number[]> = {};
      reviews?.forEach(review => {
        if (!ratingsByProvider[review.provider_id]) {
          ratingsByProvider[review.provider_id] = [];
        }
        ratingsByProvider[review.provider_id].push(review.rating);
      });

      const topRatedProviders = Object.entries(ratingsByProvider)
        .map(([providerId, ratings]) => ({
          providerId,
          avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          reviewCount: ratings.length
        }))
        .filter(p => p.reviewCount >= 2)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5);

      // Proveedores más visitados (última semana)
      const visitsByProvider: Record<string, number> = {};
      recentAnalytics?.forEach(event => {
        if (event.event_type === 'profile_view') {
          visitsByProvider[event.provider_id] = (visitsByProvider[event.provider_id] || 0) + 1;
        }
      });

      const mostVisited = Object.entries(visitsByProvider)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      // Obtener nombres de proveedores para las estadísticas
      const providerNames: Record<string, string> = {};
      providers?.forEach(p => {
        providerNames[p.id] = p.name;
      });

      // Ciudades y estados disponibles
      const cities = [...new Set(providers?.map(p => p.city).filter(Boolean))];
      const states = [...new Set(providers?.map(p => p.state).filter(Boolean))];

      // Proveedores verificados y con mejor reputación
      const verifiedProviders = providers?.filter(p => p.is_verified).length || 0;
      const premiumProviders = providers?.filter(p => p.is_premium).length || 0;
      const featuredProviders = providers?.filter(p => p.featured).length || 0;

      // Agrupar servicios por categoría con precios
      const servicesByCategory: Record<string, Array<{ 
        provider_name: string; 
        service: string; 
        price_range: string; 
        location: string;
        rating: number;
        verified: boolean;
      }>> = {};
      
      services?.forEach(service => {
        const provider = providers?.find(p => p.id === service.provider_id);
        if (provider && service.price) {
          const categoryName = categories?.find(c => c.id === service.category_id)?.name || 'Otros';
          if (!servicesByCategory[categoryName]) {
            servicesByCategory[categoryName] = [];
          }
          
          const location = provider.state && provider.city 
            ? `${provider.city}, ${provider.state}`
            : provider.city || provider.state || 'Ubicación no especificada';
          
          const priceFormatted = service.price ? `$${service.price}` : 'Cotización';
            
          servicesByCategory[categoryName].push({
            provider_name: provider.name,
            service: service.name || service.description || 'Servicio',
            price_range: priceFormatted,
            location: location,
            rating: provider.rating_average || 0,
            verified: provider.is_verified || false
          });
        }
      });

      return `
CHARLITRON EVENTOS 360 - DIRECTORIO DE PROVEEDORES
=================================================

ESTADÍSTICAS ACTUALES:
- Total de proveedores activos: ${totalProviders}
- Proveedores verificados: ${verifiedProviders}
- Proveedores premium: ${premiumProviders}  
- Proveedores destacados: ${featuredProviders}
- Categorías disponibles: ${categoriesCount}
- Total de reseñas: ${totalReviews}
- Estados con proveedores: ${states.slice(0, 8).join(', ')}
- Ciudades principales: ${cities.slice(0, 10).join(', ')}

CATEGORÍAS DISPONIBLES:
${categories?.map(c => `- ${c.name} (${c.slug}) - Color: ${c.color_scheme}`).join('\n') || 'No hay categorías'}

SERVICIOS ESPECÍFICOS DISPONIBLES EN SAN LUIS POTOSÍ:

CHARLIE PRODUCTION (VIDEO/AUDIOVISUAL) 🎥:
- Paquete Oro: 10 horas de servicio video editado ($7500)
- Paquete Plata: 5 horas de cobertura continua video editado ($5700)  
- Paquete Empresarial: Para empresas ($4000)
- Paquete Musical: Video para artistas y músicos ($5000)

SNACKS CHARLITRON (DULCES/SNACKS/ELOTES) 🍰:
- Barra de Snacks: 50 personas, 15 variedades ($2500)
- Barra Snacks: 100 personas, 15 variedades ($4100) 
- Máquina Palomera: Servicio opcional ($300)
- Paletas de Hielo: 25 pzs de agua, 25 pzs de leche ($450-850)
- Carro de elotes: 50 vasos 2 hrs ($1600-3500)

IMPORTANTE: Si preguntan por ELOTES, SNACKS, PALETAS o DULCES = Snacks Charlitron
Si preguntan por VIDEO, FOTOGRAFÍA, AUDIOVISUAL = Charlie Production

TIPOS DE PROVEEDORES - RESPUESTAS CLARAS:
- Charlie Production: Es un servicio PROFESIONAL de VIDEO y AUDIOVISUAL. NO es un grupo musical, es una empresa que graba y edita videos para bodas, eventos corporativos, quinceañeras y músicos.
- Snacks Charlitron: Es un servicio de SNACKS, DULCES y ELOTES/ESQUITES para eventos. NO es catering completo, se especializa en botanas y dulces.

SERVICIOS QUE NO TENEMOS DISPONIBLES:
- GRUPOS MUSICALES EN VIVO: No tenemos mariachis, trios, bandas o grupos musicales en vivo en nuestro catálogo actual.
- CATERING COMPLETO: Solo tenemos servicios de snacks/dulces, no comida completa/banquetes.

SI BUSCAN ALGO QUE NO TENEMOS:
1. Ser honesto: "En nuestro catálogo actual no tenemos [servicio específico]"
2. Derivar: "Te recomiendo contactar directamente con Charlitron Eventos 360 para conseguir [servicio] en tu zona"
3. Sugerir alternativas: "Como alternativa, tenemos [servicios relacionados disponibles]"
4. Ofrecer otros servicios para su evento: "Para tu fiesta también tenemos snacks, decoración, video..."

IMPORTANTE - ESPECIALIDADES POR CATEGORÍA:
🎥 VIDEO/FOTOGRAFÍA: Bodas, eventos, corporativos, quinceañeras
🎵 MÚSICA/DJ: DJs, sonido, grupos musicales, mariachis
🍽️ BANQUETES/CATERING: Comida, bebidas, servicio de meseros
🎪 DECORACIÓN: Flores, centros de mesa, ambientación, mobiliario
🎂 REPOSTERÍA: Pasteles, dulces, candy bar, postres
🚌 TRANSPORTE: Camiones, autos, limousinas
🏨 VENUES: Salones, jardines, hoteles para eventos

PROVEEDORES MEJOR CALIFICADOS:
${topRatedProviders.map(p => `- ${providerNames[p.providerId] || 'Proveedor'}: ${p.avgRating.toFixed(1)}⭐ (${p.reviewCount} reseñas)`).join('\n') || 'No hay suficientes reseñas'}

PROVEEDORES MÁS VISITADOS (última semana):
${mostVisited.map(([id, visits]) => `- ${providerNames[id] || 'Proveedor'}: ${visits} visitas`).join('\n') || 'No hay datos de visitas'}

BÚSQUEDA INTELIGENTE DISPONIBLE:
- Por estado y ciudad (ej: "fotógrafos en Guadalajara, Jalisco")
- Por descripción del servicio (busca en descripciones detalladas)
- Por tipo de evento y ubicación combinados
- Por calificaciones y verificación

PROVEEDORES Y SERVICIOS POR CATEGORÍA:
${Object.entries(servicesByCategory).slice(0, 5).map(([category, serviceList]) => 
  `${category.toUpperCase()}:
${serviceList.slice(0, 3).map(s => `- ${s.provider_name} (${s.location})${s.verified ? ' ✓' : ''}: ${s.service} - ${s.price_range}${s.rating ? ` - ${s.rating}⭐` : ''}`).join('\n')}`
).join('\n\n') || 'Información de servicios no disponible'}

RANGOS DE PRECIOS TÍPICOS:
🎥 Video/Fotografía: $2,000 - $15,000 MXN
🎵 Música/DJ: $1,500 - $8,000 MXN  
🍽️ Banquetes: $150 - $500 MXN por persona
🎪 Decoración: $3,000 - $20,000 MXN
🎂 Repostería: $800 - $5,000 MXN

SERVICIOS PLATFORM:
- Búsqueda de proveedores por categoría y ubicación
- Reseñas y calificaciones verificadas
- Información de contacto directo (WhatsApp, teléfono)
- Galería de trabajos de cada proveedor
- Comparación de servicios y precios

INSTRUCCIONES PARA EL ASISTENTE:
- Responde siempre en español de México con tono amigable y conversacional
- CONTEXTO DE CONVERSACIÓN: Mantén el tema de la conversación activa
- Si el usuario preguntó por VIDEO, solo habla de Charlie Production (Paquetes Oro/Plata/Empresarial) �
- Si el usuario preguntó por DJ/MÚSICA, solo habla de Charlie Production (servicios musicales) �
- Si el usuario preguntó por SNACKS/ELOTES, solo habla de Snacks Charlitron 🍰
- PREGUNTAS DE SEGUIMIENTO ("si pásame", "qué servicios hace"): 
  * Si conversación era sobre VIDEO → SOLO Charlie Production 🎥
  * Si conversación era sobre SNACKS → SOLO Snacks Charlitron 🍰  
  * Si conversación era sobre DJ/MÚSICA → SOLO Charlie Production servicios musicales 🎵
- CONTACTO DIRECTO: Cuando piden contacto, da WhatsApp/teléfono específico del proveedor
- SI PIDEN CONTACTO 2+ VECES: Da el número directo, no preguntes si quieren el WhatsApp
- NUNCA MEZCLES proveedores: video ≠ snacks ≠ música
- MANTÉN EL FOCO: Una vez establecido el contexto, no cambies de proveedor
`;
    } catch (error) {
      console.error('Error building context:', error);
      return `
CHARLITRON EVENTOS 360 - DIRECTORIO DE PROVEEDORES
=================================================

Soy el asistente virtual de Charlitron Eventos 360, un directorio de proveedores de eventos verificados en México.

Puedo ayudarte con:
- Búsqueda de proveedores por categoría (banquetes, fotografía, decoración, música, etc.)
- Información sobre reseñas y calificaciones
- Recomendaciones personalizadas
- Datos de contacto y ubicación de proveedores

¿En qué puedo ayudarte hoy?
`;
    }
  }

  // Rank providers deterministically using signals
  private rankProviders(candidates: any[], userBudget?: number, userCity?: string, userState?: string) {
    if (!candidates || candidates.length === 0) return [];

    const maxReviews = Math.max(...candidates.map(c => c.reviews_count || 0), 1);
    const maxViews = Math.max(...candidates.map(c => c.views_30d || 0), 1);
    const maxWhatsapp = Math.max(...candidates.map(c => c.whatsapp_30d || 0), 1);
    const maxMedia = Math.max(...candidates.map(c => c.media_count || 0), 1);

    function normalizeLog(value: number, max: number) {
      return Math.log(1 + value) / Math.log(1 + Math.max(1, max));
    }

    const scored = candidates.map(c => {
      const service_match = 1; // already filtered by service
      
      // Mejorar matching de ubicación (ciudad + estado)
      let location_match = 0;
      if (userCity && c.city) {
        location_match += c.city.toLowerCase().includes(userCity.toLowerCase()) ? 0.8 : 0;
      }
      if (userState && c.state) {
        location_match += c.state.toLowerCase().includes(userState.toLowerCase()) ? 0.6 : 0;
      }
      // Bonus if both city and state match
      if (userCity && userState && c.city && c.state) {
        const cityMatch = c.city.toLowerCase().includes(userCity.toLowerCase());
        const stateMatch = c.state.toLowerCase().includes(userState.toLowerCase());
        if (cityMatch && stateMatch) location_match += 0.4;
      }
      location_match = Math.min(location_match, 1); // Cap at 1
      
      const price_proximity = (userBudget && c.service_median) ? (1 - Math.min(Math.abs(c.service_median - userBudget) / Math.max(userBudget, 1), 1)) : 0.5;
      const rating_norm = (c.rating || 0) / 5;
      const reviews_norm = normalizeLog(c.reviews_count || 0, maxReviews);
      const views_norm = normalizeLog(c.views_30d || 0, maxViews);
      const whatsapp_norm = normalizeLog(c.whatsapp_30d || 0, maxWhatsapp);
      const media_norm = normalizeLog(c.media_count || 0, maxMedia);
      
      // Bonuses por calidad y verificación
      const premium_bonus = c.is_premium ? 0.05 : 0;
      const verified_bonus = c.is_verified ? 0.04 : 0;
      const description_bonus = (c.description && c.description.length > 50) ? 0.02 : 0;

      const score =
        0.30 * service_match +
        0.25 * location_match +  // Increased weight for location
        0.15 * price_proximity +
        0.10 * rating_norm +
        0.06 * reviews_norm +
        0.05 * views_norm +
        0.04 * whatsapp_norm +
        0.03 * media_norm +
        premium_bonus +
        verified_bonus +
        description_bonus;

      return { ...c, score };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  private async callGeminiAPI(prompt: string, context: string): Promise<{ response: string; tokensUsed: { input: number; output: number } }> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

  // Detectar si la pregunta incluye presupuesto, ubicación y categoría
    const hasBudget = /\$\d+|\d+\s*(pesos?|mx|mxn|mil|miles)/i.test(prompt);
    const hasLocation = /en\s+[\w\s]+|de\s+[\w\s]+|potosí|guadalajara|cdmx|méxico|monterrey/i.test(prompt);
    const hasCategory = /(video|fotograf|music|dj|banquet|catering|decorac|pastel|flores|sonido)/i.test(prompt);
    
    let specificInstructions = '';
    if (hasBudget && hasLocation && hasCategory) {
      specificInstructions = '\n\nESPECIAL: El usuario menciona presupuesto, ubicación Y categoría específica. SOLO recomienda proveedores que coincidan EXACTAMENTE con esa categoría en esa ciudad con ese presupuesto. NO recomiendes proveedores de otras categorías.';
    } else if (hasBudget && hasLocation) {
      specificInstructions = '\n\nESPECIAL: El usuario menciona presupuesto Y ubicación. Da 2-3 recomendaciones específicas de proveedores de esa ciudad con rangos de precio que se ajusten a su presupuesto. Sé muy específico y práctico.';
    } else if (hasCategory) {
      specificInstructions = '\n\nESPECIAL: El usuario busca una categoría específica. SOLO recomienda proveedores de esa categoría exacta, no de otras.';
    } else if (hasBudget) {
      specificInstructions = '\n\nESPECIAL: El usuario menciona un presupuesto. Recomienda opciones que se ajusten a ese rango de precio específico.';
    } else if (hasLocation) {
      specificInstructions = '\n\nESPECIAL: El usuario pregunta por una ubicación específica. Filtra solo proveedores de esa ciudad.';
    }

    // Detectar preguntas sobre tipo de servicio del proveedor en contexto
    const isServiceTypeQuestion = /(es|son).*(grupo|banda|dj|fotografo|videografo|catering|decorador|musical|video|foto)/i.test(prompt) ||
                                 /que tipo de (servicio|grupo|banda|musica)/i.test(prompt) ||
                                 /^(el|ella) (es|está|hace|ofrece)/i.test(prompt);

    // Detectar búsqueda de grupo musical cuando no tenemos grupos reales
    const isMusicalGroupSearch = /(busco|necesito|quiero).*(grupo musical|banda|mariachi|trio|cuarteto)/i.test(prompt) ||
                                /grupo musical/i.test(prompt);

    let serviceTypeInstructions = '';
    if (isServiceTypeQuestion) {
      serviceTypeInstructions = `\n\nESPECIAL: El usuario pregunta sobre QUÉ TIPO DE SERVICIO ofrece el proveedor. Responde claramente:
- Si es Charlie Production: "No, Charlie Production NO es un grupo musical. Es un servicio profesional de VIDEO y AUDIOVISUAL que graba y edita videos para eventos."
- Si es Snacks Charlitron: "Snacks Charlitron se especializa en DULCES, SNACKS y servicios de ELOTES/ESQUITES para eventos."
- Para otros proveedores: explica claramente qué tipo de servicio ofrecen basado en sus categorías.
NO busques nuevos proveedores, solo explica el servicio del proveedor mencionado en contexto.`;
    }

    if (isMusicalGroupSearch) {
      serviceTypeInstructions += `\n\nESPECIAL - BÚSQUEDA DE GRUPO MUSICAL: En nuestro catálogo actual no tenemos grupos musicales en vivo (mariachis, bandas, trios). Solo tenemos servicios de DJ y sonido. Sugiere:
1. "Para grupos musicales en vivo te recomiendo contactar directamente con Charlitron Eventos 360 para conseguir mariachis, trios o bandas de tu zona."
2. Como alternativa, menciona que tenemos servicios de DJ y sonido profesional si les interesa música para fiestas.
3. Ofrece otros servicios para fiestas: snacks, decoración, video, etc.`;
    }

    // Refuerzo anti-hallucination: instrucciones globales que se agregan al prompt
    const antiHallucination = `\n\nIMPORTANTE: SOLO usa los proveedores listados en la sección PROVEEDORES CANDIDATOS (TOP K) incluida más abajo. NO inventes nombres, empresas ni datos. Si no hay proveedores apropiados en TOP K, responde: "No tenemos proveedores verificados en esa ciudad/rango" y ofrece alternativas (buscar en ciudades cercanas o contactar soporte).`;

  const fullPrompt = `${context}\n\nPREGUNTA DEL USUARIO: ${prompt}${specificInstructions}${serviceTypeInstructions}${antiHallucination}\n\nResponde de manera útil, amigable y específica usando la información del contexto. Máximo 300 caracteres.`;

    const requestBody = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Error de la API de Gemini: ${response.status}`);
    }

    const data = await response.json();
    
    // Validación más robusta de la respuesta
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('❌ Error: No hay candidatos en la respuesta:', data);
      throw new Error('No se recibieron candidatos de respuesta de Gemini');
    }

    const candidate = data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      console.error('❌ Error: Estructura de respuesta inválida:', candidate);
      throw new Error('Estructura de respuesta inválida de Gemini');
    }

    const textPart = candidate.content.parts[0];
    if (!textPart || !textPart.text) {
      console.error('❌ Error: No hay texto en la respuesta:', textPart);
      throw new Error('No se recibió texto en la respuesta de Gemini');
    }

    const generatedText = textPart.text;
    
    // Estimar tokens (aproximación: 1 token ≈ 4 caracteres)
    const inputTokens = Math.ceil(fullPrompt.length / 4);
    const outputTokens = Math.ceil(generatedText.length / 4);

    return {
      response: generatedText,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens
      }
    };
  }

  private calculateCost(tokensInput: number, tokensOutput: number): number {
    // Precios de Gemini 1.5 Flash (aproximados)
    const inputCostPer1K = 0.00015;  // $0.15 per 1M tokens
    const outputCostPer1K = 0.0006;  // $0.60 per 1M tokens
    
    const inputCost = (tokensInput / 1000) * inputCostPer1K;
    const outputCost = (tokensOutput / 1000) * outputCostPer1K;
    
    return inputCost + outputCost;
  }

  private async logUsage(usage: Omit<AIUsage, 'cost_usd'> & { cost_usd?: number; sources_used?: any; ranking_scores?: any }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_ai_usage', {
        p_session_id: usage.session_id,
        p_user_ip: usage.user_ip,
        p_user_id: usage.user_id || null,
        p_question: usage.question,
        p_response: usage.response,
        p_tokens_input: usage.tokens_input,
        p_tokens_output: usage.tokens_output,
        p_cost_usd: usage.cost_usd || 0,
        p_processing_time_ms: usage.processing_time_ms,
        p_sources_used: (usage as any).sources_used || null,
        p_ranking_scores: (usage as any).ranking_scores || null
      });

      if (error) {
        console.error('Error logging AI usage:', error);
        return null;
      }

      // rpc returns the uuid of the inserted row
      if (data && (Array.isArray(data) ? data[0] : data)) {
        const row = Array.isArray(data) ? data[0] : data;
        // depending on supabase client, RPC may return { log_ai_usage: '<uuid>' } or direct uuid
        if (row.id) return row.id;
        if (row.log_ai_usage) return row.log_ai_usage;
        // if RPC returned bare uuid
        if (typeof row === 'string') return row;
      }

      return null;
    } catch (error) {
      console.error('Error logging AI usage:', error);
      // Fallback: try direct insert into ai_usage_tracking in case RPC signature mismatch or overload
      try {
        const insertObj: any = {
          session_id: usage.session_id,
          user_ip: usage.user_ip,
          user_id: usage.user_id || null,
          question: usage.question,
          response: usage.response,
          tokens_input: usage.tokens_input || 0,
          tokens_output: usage.tokens_output || 0,
          cost_usd: usage.cost_usd || 0,
          processing_time_ms: usage.processing_time_ms || 0,
          created_at: new Date().toISOString(),
        };
        if ((usage as any).sources_used) insertObj.sources_used = (usage as any).sources_used;
        if ((usage as any).ranking_scores) insertObj.ranking_scores = (usage as any).ranking_scores;

        const { data: inserted, error: insertErr } = await supabase.from('ai_usage_tracking').insert(insertObj).select('id').limit(1);
        if (insertErr) {
          console.error('Fallback insert into ai_usage_tracking failed:', insertErr);
          return null;
        }
        if (inserted && Array.isArray(inserted) && inserted[0] && inserted[0].id) return inserted[0].id;
        if (inserted && !Array.isArray(inserted) && (inserted as any).id) return (inserted as any).id as string;
      } catch (innerErr) {
        console.error('Fallback logging also failed:', innerErr);
      }
      return null;
    }
  }

  async askQuestion(
    question: string,
    userIP: string,
    userId?: string
  ): Promise<{ response: string; usage: AIUsage }> {
    const startTime = Date.now();

    try {
      // 1. Verificar si la IA está habilitada
      const settings = await this.getAISettings();
      if (!settings.is_enabled) {
        throw new Error('El asistente virtual está temporalmente no disponible. Inténtalo más tarde.');
      }

      // 2. Verificar rate limits
      const rateLimitResult = await this.checkRateLimit(userIP, 'ip');
      if (!rateLimitResult.allowed) {
        const resetTime = rateLimitResult.window_reset ? new Date(rateLimitResult.window_reset) : new Date();
        const minutesUntilReset = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60)));
        
        let timeMessage = '';
        if (minutesUntilReset <= 60) {
          timeMessage = `${minutesUntilReset} minuto${minutesUntilReset > 1 ? 's' : ''}`;
        } else {
          const hours = Math.ceil(minutesUntilReset / 60);
          timeMessage = `${hours} hora${hours > 1 ? 's' : ''}`;
        }
        
        throw new Error(`Has alcanzado el límite de preguntas. Inténtalo nuevamente en ${timeMessage}.`);
      }

      // 3. Verificar cache
      const cachedResponse = this.isInCache(question);
      if (cachedResponse) {
        const usage: AIUsage = {
          session_id: this.sessionId,
          user_ip: userIP,
          user_id: userId,
          question,
          response: cachedResponse,
          tokens_input: 0,
          tokens_output: 0,
          cost_usd: 0,
          processing_time_ms: Date.now() - startTime
        };
        const inserted = await this.logUsage(usage as any);
        (usage as any).id = inserted || null;
        return { response: cachedResponse, usage };
      }

      // 4. Verificar FAQ
      const faqResponse = this.getFAQResponse(question);
      if (faqResponse) {
        this.addToCache(question, faqResponse);
        
        const usage: AIUsage = {
          session_id: this.sessionId,
          user_ip: userIP,
          user_id: userId,
          question,
          response: faqResponse,
          tokens_input: 0,
          tokens_output: 0,
          cost_usd: 0,
          processing_time_ms: Date.now() - startTime
        };
        const inserted = await this.logUsage(usage as any);
        (usage as any).id = inserted || null;
        return { response: faqResponse, usage };
      }

      // 5. Validar longitud de pregunta
      if (question.length > settings.max_tokens_per_question * 4) {
        throw new Error('Tu pregunta es muy larga. Por favor, hazla más específica.');
      }

      // 6. Construir contexto dinámico
      const context = await this.buildDynamicContext();

  // 6.1 Obtener candidatos relevantes (servicio, ciudad y presupuesto detectados desde la pregunta)
      // Extraemos heurísticamente service_slug, city y budget del texto de la pregunta
      const detectService = (q: string) => {
        const lowerQ = q.toLowerCase();
        
        // Si la pregunta es muy genérica o sobre servicios específicos de un proveedor, no detectar servicio
        if (/(si|sí|pasamelo|pásame|contacto|que servicios|qué servicios|cuales servicios|cuáles servicios|tiene|ofrece)/i.test(lowerQ) && 
            !(/(busco|necesito|quiero|cotiz)/i.test(lowerQ))) {
          return null;
        }
        
        // Música y entretenimiento - ANTES que video para capturar DJ
        if (/(dj|disc jockey|música|musica|sonido|audio|mariachi|grupo|banda|cantante|karaoke|live music|música en vivo|animación musical|playlist|playlist|repertorio|equipo de sonido|microfono|microfono|amplificador)/i.test(lowerQ)) return 'music';
        
        // Video y fotografía
        if (/(video|vide|film|videograf|videografia|camarógrafo|camerografo|paquete|grabacion|grabación|filmacion|filmación|drone|edicion|edición|postproduccion|postproducción|audiovisual|cinematografia|cinematografía|documental|trailer|highlight|reel)/i.test(lowerQ) && 
            !/(dj|música|musica)/i.test(lowerQ)) return 'video';
        if (/(foto|fotograf|fotografia|fotografía|sesion|sesión|session|retratos|book|album|photoshoot|instantaneas|instantáneas|pictures|captura|imagen|photobook|galeria|galería)/i.test(lowerQ)) return 'photography';
        
        // Dulces, snacks y comida casual - PRIORIDAD ALTA
        if (/(snacks|elotes|paletas|palomera|dulce|candy|barra.*snacks|barra.*elotes|carro.*elotes|helado|chocolate|postre|golosinas|dulceria|dulcería|mesa.*dulces|carrito.*dulces|algodón.*azucar|algodón.*azúcar|churros|donas|donitas|gelatinas|nieves|raspados|chamoy|tamarindo|gomitas|caramelos|lollipops|malvaviscos|marshmallows)/i.test(lowerQ)) return 'sweets';
        
        // Catering formal (después de dulces para evitar conflictos)
        if (/(catering|banquet|banquete|comida|bebida|mesero|meseros|buffet|buffé|coctel|cóctel|servicio.*mesa|servicio.*comida|chef|cocinero|menu|menú|platillos|aperitivos|entradas|platos.*fuertes|postres.*formales|barra.*libre|open.*bar|servicio.*bebidas)/i.test(lowerQ) && 
            !/(snacks|elotes|dulce|postre|helado|paletas)/i.test(lowerQ)) return 'catering';
        
        // Repostería específica
        if (/(reposteria|repostería|pastel|cake|torta|cupcakes|muffins|galletas|cookies|brownies|tartas|pays|cheesecake|fondant|betún|glaseado|decoracion.*pasteles|mesa.*postres)/i.test(lowerQ)) return 'sweets';
        
        // Decoración específica
        if (/(decorac.*globos|globos|decoracion|decoración|flores|arreglo.*floral|centro.*mesa|decoracion.*eventos|ambientacion|ambientación|ornamentacion|ornamentación|manteleria|mantelería|globoflexia|arcos.*globos|columnas.*globos|bouquet|ramos|coronas|guirnaldas|backdrops|photobooth|props|atrezzo)/i.test(lowerQ)) return 'decoration';
        
        // Transporte
        if (/(transport|transporte|camion|camión|autobus|autobús|van|microbus|microbús|limousina|uber|taxi|chofer|conductor|traslado|viaje|renta.*vehiculo|renta.*vehículo|shuttle|transfers)/i.test(lowerQ)) return 'transport';
        
        // Venues y salones
        if (/(salon|salón|venue|lugar|espacio|jardin|jardín|hotel|terraza|quinta|hacienda|ranch|salon.*fiestas|salon.*eventos|patio|area.*verde|área.*verde|casa.*eventos|centro.*convenciones|auditorio|explanada|palapa|terreno)/i.test(lowerQ)) return 'venue';
        
        return null; // No forzar categoría específica
      };
      const detectLocation = (q: string) => {
        const lowerQ = q.toLowerCase();
        
        // Detectar San Luis Potosí específicamente con todas sus variantes
        if (/(san luis potosi|san luis potosí|slp)/i.test(lowerQ)) {
          return { 
            city: 'San Luis Potosi', 
            state: 'San Luis Potosi' // En la BD aparece como "San Luis Potosi" sin acento
          };
        }
        
        // Estados mexicanos
        const stateMap: Record<string, string> = {
          'jalisco': 'Jalisco',
          'cdmx': 'CDMX',
          'nuevo león': 'Nuevo León',
          'nuevo leon': 'Nuevo León',
          'puebla': 'Puebla',
          'guanajuato': 'Guanajuato',
          'veracruz': 'Veracruz',
          'chiapas': 'Chiapas',
          'querétaro': 'Querétaro',
          'queretaro': 'Querétaro'
        };
        
        // Ciudades mexicanas comunes  
        const cityMap: Record<string, { city: string; state?: string }> = {
          'guadalajara': { city: 'Guadalajara', state: 'Jalisco' },
          'monterrey': { city: 'Monterrey', state: 'Nuevo León' },
          'puebla': { city: 'Puebla', state: 'Puebla' },
          'leon': { city: 'León', state: 'Guanajuato' },
          'león': { city: 'León', state: 'Guanajuato' },
          'queretaro': { city: 'Querétaro', state: 'Querétaro' },
          'querétaro': { city: 'Querétaro', state: 'Querétaro' }
        };
        
        let detectedCity, detectedState;
        
        // Buscar estados
        for (const [key, value] of Object.entries(stateMap)) {
          if (lowerQ.includes(key)) {
            detectedState = value;
            break;
          }
        }
        
        // Buscar ciudades
        for (const [key, value] of Object.entries(cityMap)) {
          if (lowerQ.includes(key)) {
            detectedCity = value.city;
            if (!detectedState && value.state) {
              detectedState = value.state;
            }
            break;
          }
        }
        
        return { city: detectedCity, state: detectedState };
      };
      const detectBudget = (q: string) => {
        // Match numbers of 3-7 digits (e.g., 5000, 10000)
        const m = q.match(/\$?\s?(\d{3,7})(?:\s|$|,|\.)/);
        return m ? Number(m[1]) : undefined;
      };

      // If we have a pending clarification from a previous turn, try to interpret this short
      // user reply as the missing info (location and/or budget) and merge with the original question.
      let service_slug = detectService(question);
      let budget = detectBudget(question);

      // Actualizar detección de ubicación 
      const locationData = detectLocation(question);
      let city = locationData.city;
      let state = locationData.state;

      if (this.pendingClarification) {
        // If the current message looks like an answer (short and contains location/budget), merge it
        const looksLikeBudget = !!budget;
        const looksLikeLocation = !!(city || state);

        // If current message does not contain either but is short, try to parse according to what was asked
        if (!looksLikeBudget && !looksLikeLocation) {
          const text = question.trim();
          // numeric-only answer likely budget
          const numericOnly = /^\$?\s?\d{3,7}\s*$/.test(text);
          if (numericOnly && this.pendingClarification.askedBudget) {
            budget = Number(text.replace(/[^\d]/g, ''));
          } else if (this.pendingClarification.askedCity) {
            // Use the same detectLocation logic to extract location from short answer
            const detectedLocation = detectLocation(text);
            if (detectedLocation.city || detectedLocation.state) {
              city = detectedLocation.city;
              state = detectedLocation.state;
            }
          }
        }

        // Merge service from original if not present in this short reply
        const origService = detectService(this.pendingClarification.originalQuestion);
        if (!service_slug && origService) service_slug = origService;

        // Use original question as the base
        const mergedQuestion = this.pendingClarification.originalQuestion + ' ' + question;
        
        // Re-detect location and budget from merged question in case they're now present
        if (!city && !state) {
          const mergedLocation = detectLocation(mergedQuestion);
          city = mergedLocation.city;
          state = mergedLocation.state;
        }
        if (!budget) budget = detectBudget(mergedQuestion);
        
        question = mergedQuestion;

        // Only clear pending if we now have both location AND budget (or question doesn't need them)
        // If we still need data, keep asking
        const stillNeedsLocation = this.pendingClarification.askedCity && !city && !state;
        const stillNeedsBudget = this.pendingClarification.askedBudget && !budget;
        
        if (!stillNeedsLocation && !stillNeedsBudget) {
          this.pendingClarification = null;
        } else {
          // Update what we still need
          this.pendingClarification.askedCity = stillNeedsLocation;
          this.pendingClarification.askedBudget = stillNeedsBudget;
        }
      }

      // Si faltan datos críticos solo para casos MUY específicos, pedimos clarificación
      const needsLocation = false; // Permitir búsquedas generales
      const needsBudget = false;   // No requerir presupuesto siempre

      // Solo pedir clarificación si realmente no hay nada que mostrar
      if (needsLocation || needsBudget) {
        const clarifications: string[] = [];
        if (needsLocation) clarifications.push('¿En qué ciudad y estado estás?');
        if (needsBudget) clarifications.push('¿Cuál es tu presupuesto aproximado para el servicio?');

        const clarificationText = `Antes de recomendar proveedores, necesito: ${clarifications.join(' ')}`;

        // Store pending clarification so next short user reply can be merged
        // Only update if we don't already have one (avoid overriding mid-conversation)
        if (!this.pendingClarification) {
          this.pendingClarification = {
            originalQuestion: question,
            askedCity: needsLocation,
            askedBudget: needsBudget
          };
        }

        const usage: AIUsage = {
          session_id: this.sessionId,
          user_ip: userIP,
          user_id: userId,
          question,
          response: clarificationText,
          tokens_input: 0,
          tokens_output: 0,
          cost_usd: 0,
          processing_time_ms: Date.now() - startTime
        };

        // NOTA: no registramos clarificaciones en la tabla de uso para evitar consumir
        // el límite de preguntas del usuario con interacciones de clarificación.
        // Esto evita loops donde cada aclaración cuenta contra la cuota.
        (usage as any).id = null;
        return { response: clarificationText, usage };
      }

      // Verificar si la pregunta es lo suficientemente específica para buscar proveedores
      const isSpecificQuery = (q: string) => {
        const lowerQ = q.toLowerCase();
        
        // Si tenemos contexto activo y es una pregunta de seguimiento, usar contexto existente
        if (this.activeContext.service_type && this.activeContext.last_candidates) {
          // Detectar rechazo - limpiar contexto y buscar nuevamente
          const rejectionPatterns = [
            /^no.*(necesito|quiero|busco|interesa)/,
            /no (me |)interesa/,
            /no (es |)(lo que|lo q) (busco|necesito|quiero)/,
            /mejor (busco|necesito|quiero) (otro|otra)/,
            /no.*(sirve|funciona)/
          ];
          
          if (rejectionPatterns.some(pattern => pattern.test(lowerQ))) {
            this.activeContext = { service_type: null, provider_name: null, last_candidates: null };
            return true; // Nueva búsqueda
          }
          
          const followUpPatterns = [
            /^(si|sí|pasamelo|pásame|contacto|dame el contacto)$/,
            /^(si|sí).*(pasamelo|pásame|contacto)/,
            /(que|qué) (servicios|servicio) (tiene|ofrece|hace)/,
            /^(cuales|cuáles) (servicios|servicio)/,
            /(informacion|información|detalles|mas info|más info)/,
            // Preguntas específicas sobre servicios de un proveedor
            /.*\s+(que|qué) (servicios|servicio)/,
            /(contacto|telefono|teléfono|whatsapp|direccion|dirección)/,
            // Solicitudes de contacto repetidas
            /(si|sí).*(whatsapp|telefono|teléfono)/,
            /dame (el |)whatsapp/,
            // Preguntas sobre tipo de servicio del proveedor actual
            /^(el|ella) (es|está|hace|ofrece)/,
            /es.*(grupo|banda|dj|fotografo|videografo|catering|decorador)/,
            /(es|son) (un|una) (grupo|banda|dj|fotografo|videografo|chef|cocinero)/,
            /que tipo de (servicio|grupo|banda|musica)/,
            /es.*(musical|video|foto|decoracion|catering|transporte)/
          ];
          
          if (followUpPatterns.some(pattern => pattern.test(lowerQ))) {
            return 'follow_up'; // Valor especial para usar contexto existente
          }
        }
        
        // Preguntas conversacionales simples - NO buscar proveedores
        const conversationalPatterns = [
          /^(gracias|perfecto|ok|vale|está bien)$/,
          /^(hola|buenos días|buenas tardes|buenas noches)$/,
          /^(como estas|cómo estás|que tal|qué tal)$/
        ];
        
        if (conversationalPatterns.some(pattern => pattern.test(lowerQ))) {
          console.log('� Pregunta conversacional, NO buscar proveedores:', q);
          return false;
        }
        
        // Preguntas específicas de búsqueda - SÍ buscar proveedores
        const searchPatterns = [
          /(busco|necesito|quiero|requiero|solicito|cotiz|precio)/,
          /(proveedor de|servicio de|empresa de)/,
          /(barra de|carro de)/,
          // Servicios específicos sin contexto conversacional
          /^(video|foto|dj|música|snacks|elotes|catering|decorac|transport)/,
          // Nuevas búsquedas directas
          /^(paquete|servicio) (de |para )/
        ];
        
        if (searchPatterns.some(pattern => pattern.test(lowerQ))) {
          return true;
        }
        
        return false; // Cambio: por defecto NO buscar si no es claramente específica
      };

      let candidates: any[] = [];
      const queryType = isSpecificQuery(question);
      
      if (queryType === 'follow_up') {
        // Usar contexto existente para preguntas de seguimiento
        candidates = this.activeContext.last_candidates || [];
      } else if (queryType === true) {
        // Nueva búsqueda específica - limpiar contexto
        this.activeContext = { service_type: null, provider_name: null, last_candidates: null };
        
        // INTERCEPTAR búsquedas de servicios que NO tenemos disponibles
        const lowerQuestion = question.toLowerCase();
        
        // Detectar búsqueda de grupos musicales en vivo
        if (/(busco|necesito|quiero).*(grupo musical|banda|mariachi|trio|cuarteto|grupo.*(cantar|tocar))/i.test(question) ||
            /grupo.*(musical|cantar|tocar|en vivo)/i.test(question)) {
          
          const noMusicalGroupResponse = `En nuestro catálogo actual no tenemos grupos musicales en vivo (mariachis, bandas, tríos). 

Para conseguir un grupo musical te recomiendo contactar directamente con **Charlitron Eventos 360** que pueden conseguirte el grupo perfecto para tu zona. 📞

Como alternativa, tenemos:
- **Servicios de DJ y sonido** profesional
- **Snacks y dulces** para tu fiesta 
- **Video y fotografía** para capturar los momentos

¿Te interesa alguno de estos servicios? 🎉`;

          const usage: AIUsage = {
            session_id: this.sessionId,
            user_ip: userIP,
            user_id: userId,
            question,
            response: noMusicalGroupResponse,
            tokens_input: 0,
            tokens_output: 0,
            cost_usd: 0,
            processing_time_ms: Date.now() - startTime
          };

          await this.logUsage(usage);
          this.updateConversationHistory(question, noMusicalGroupResponse);
          return { response: noMusicalGroupResponse, usage };
        }
        
        // Detectar búsqueda de restaurantes/catering completo
        if (/(busco|necesito|quiero).*(restaurant|restaurante|catering completo|banquete|comida completa)/i.test(question)) {
          
          const noRestaurantResponse = `En nuestro catálogo actual no tenemos restaurantes o servicios de catering completo. 

Solo tenemos **Snacks Charlitron** que ofrece:
- Barra de snacks y dulces
- Elotes y esquites
- Paletas y botanas

Para un restaurant o catering completo te recomiendo contactar directamente con **Charlitron Eventos 360** que pueden conseguirte opciones de catering en tu zona. 📞

¿Te interesa el servicio de snacks disponible? 🍿`;

          const usage: AIUsage = {
            session_id: this.sessionId,
            user_ip: userIP,
            user_id: userId,
            question,
            response: noRestaurantResponse,
            tokens_input: 0,
            tokens_output: 0,
            cost_usd: 0,
            processing_time_ms: Date.now() - startTime
          };

          await this.logUsage(usage);
          this.updateConversationHistory(question, noRestaurantResponse);
          return { response: noRestaurantResponse, usage };
        }
        
        try {
          candidates = await getProvidersForQuery({ service_slug, city, state, budget, limit: 50 });
        } catch (err) {
          console.error('❌ Error obteniendo candidatos:', err);
          candidates = [];
        }
      } else {
        candidates = [];
      }

      // 6.2 Rankear candidatos y tomar topK
      const ranked = this.rankProviders(candidates, budget, city, state);
      const topK = ranked.slice(0, 5); // Aumentar a 5 para más opciones
      
      // Actualizar contexto activo cuando tenemos candidatos
      if (topK.length > 0 && queryType === true) {
        this.updateActiveContext(service_slug, topK);
      }

      // Si no hay candidatos después del ranking, buscar sin filtros de ubicación
      if (!topK || topK.length === 0) {
        
        try {
          // Buscar sin filtros de ubicación
          const allCandidates = await getProvidersForQuery({ service_slug, budget, limit: 20 });
          const allRanked = this.rankProviders(allCandidates, budget);
          const generalTopK = allRanked.slice(0, 3);
          
          if (generalTopK.length > 0) {
            // Permitir que Gemini responda con recomendaciones generales
            const generalContext = context + '\n\nPROVEEDORES DISPONIBLES (GENERALES):\n' + 
              JSON.stringify(generalTopK.map(p => ({
                id: p.provider_id,
                provider_name: p.provider_name,
                city: p.city,
                state: p.state,
                service_name: p.service_name,
                rating: p.rating,
                is_verified: p.is_verified
              })), null, 2);
              
            // Llamar a Gemini con contexto general
            const geminiResult = await this.callGeminiAPI(question, generalContext);
            const cost = this.calculateCost(geminiResult.tokensUsed.input, geminiResult.tokensUsed.output);
            this.addToCache(question, geminiResult.response);

            const usageFull: AIUsage = {
              session_id: this.sessionId,
              user_ip: userIP,
              user_id: userId,
              question,
              response: geminiResult.response,
              tokens_input: geminiResult.tokensUsed.input,
              tokens_output: geminiResult.tokensUsed.output,
              cost_usd: cost,
              processing_time_ms: Date.now() - startTime
            };

            try {
              (usageFull as any).sources_used = generalTopK.map(p => ({ provider_id: p.provider_id, service_id: p.service_id }));
              (usageFull as any).ranking_scores = generalTopK.map(p => ({ provider_id: p.provider_id, score: p.score }));
            } catch (err) {
              console.warn('Error preparando metadata para logging:', err);
            }

            const insertedFullId = await this.logUsage(usageFull as any);
            (usageFull as any).id = insertedFullId || null;

            return { response: usageFull.response, usage: usageFull };
          }
        } catch (err) {
          console.warn('Error in general search:', err);
        }
        
        // Si definitivamente no hay proveedores, mensaje amigable
        let location = '';
        if (city && state) {
          location = `${city}, ${state}`;
        } else if (city) {
          location = city;
        } else if (state) {
          location = state;
        }
        
        // Mapear términos técnicos a nombres amigables
        const friendlyServiceNames: Record<string, string> = {
          'venue': 'salón para eventos',
          'decoration': 'decoración',
          'photography': 'fotografía',
          'music': 'música y DJ',
          'catering': 'catering y banquetes',
          'transport': 'transporte',
          'sweets': 'snacks y dulces',
          'video': 'video y audiovisual'
        };
        
        const serviceName = friendlyServiceNames[service_slug || ''] || service_slug || 'ese servicio';
        
        const noProvidersMsg = location
          ? `En ${location} no tengo proveedores de ${serviceName} en este momento. Te puedo recomendar buscar en ciudades cercanas o contactar directamente con Charlitron para ver opciones. 📞`
          : `No tengo proveedores de ${serviceName} disponibles ahora mismo. ¿Te interesa otro tipo de proveedor o alguna ciudad específica? 🤔`;

        const usageNo: AIUsage = {
          session_id: this.sessionId,
          user_ip: userIP,
          user_id: userId,
          question,
          response: noProvidersMsg,
          tokens_input: 0,
          tokens_output: 0,
          cost_usd: 0,
          processing_time_ms: Date.now() - startTime
        };

        try {
          (usageNo as any).sources_used = [];
          (usageNo as any).ranking_scores = [];
        } catch (err) {
          // noop
        }

        // Mark that this usage was a "no providers" answer so frontend can show a CTA
        (usageNo as any).no_providers = true;
        // Include detected city so frontend can prefill notify modal
        (usageNo as any).city = city || null;

        const insertedIdNo = await this.logUsage(usageNo as any);
        (usageNo as any).id = insertedIdNo || null;
        return { response: noProvidersMsg, usage: usageNo };
      }

      // 6.3 Construir contexto JSON reducido con topK para pasar al modelo
      const contextJSON = topK.map(p => ({
        id: p.provider_id,
        provider_name: p.provider_name,
        city: p.city,
        state: p.state,
        service_type: p.service_type || service_slug,
        service_id: p.service_id,
        service_name: p.service_name,
        service_description: p.service_description,
        price_range: p.service_price ? `$${p.service_price}` : 'Cotización directa',
        rating: p.rating,
        reviews_count: p.reviews_count,
        is_verified: p.is_verified,
        is_premium: p.is_premium,
        views_30d: p.views_30d,
        whatsapp_30d: p.whatsapp_30d,
        media_count: p.media_count,
        profile_url: `/proveedores/${p.provider_id}`,
        // Información de contacto crítica
        contact_whatsapp: p.contact?.whatsapp || p.whatsapp || null,
        contact_phone: p.contact?.phone || p.phone || null,
        contact_email: p.contact?.email || p.email || null,
        contact_instagram: p.contact?.instagram || p.instagram_url || null,
        contact_facebook: p.contact?.facebook || p.facebook_url || null,
        website_url: p.website_url || null
      }));

    // Agregar contexto de conversación previa
    let conversationContext = '';
    if (this.conversationHistory.length > 0) {
      const lastExchange = this.conversationHistory[this.conversationHistory.length - 1];
      if (lastExchange && lastExchange.role === 'assistant') {
        // Detectar si ya preguntaron por contacto antes
        const alreadyAskedContact = lastExchange.content.toLowerCase().includes('whatsapp') || 
                                  lastExchange.content.toLowerCase().includes('contacto') ||
                                  lastExchange.content.toLowerCase().includes('¿te interesa su whatsapp');
        
        conversationContext = `\n\nCONTEXTO DE CONVERSACIÓN PREVIA:
Última respuesta: "${lastExchange.content}"
${alreadyAskedContact ? 'IMPORTANTE: Ya preguntaste por el contacto. Si piden contacto de nuevo, da el WhatsApp/teléfono directo.' : ''}
IMPORTANTE: Si la conversación previa era sobre un servicio específico (video/DJ/snacks), mantén ese contexto y NO mezcles otros proveedores.
`;
      }
    }

    const enrichedContext = context + conversationContext + '\n\nPROVEEDORES CANDIDATOS (TOP ' + topK.length + '):\n' + JSON.stringify(contextJSON, null, 2);

      // If topK has 1 or 2 providers AND it's NOT a follow-up question, return a concise structured response immediately (save tokens)
          if (topK.length > 0 && topK.length <= 2 && queryType !== 'follow_up') {
            const lines: string[] = [];
            let locationText = '';
            if (city && state) {
              locationText = `${city}, ${state}`;
            } else if (city) {
              locationText = city;
            } else if (state) {
              locationText = state;
            } else {
              locationText = 'tu ubicación';
            }
            
            lines.push(`En ${locationText} hay ${topK.length} proveedor${topK.length > 1 ? 'es' : ''} destacado${topK.length > 1 ? 's' : ''}:`);

            topK.forEach((p, idx) => {
              const name = p.provider_name || 'Proveedor';
              const price = p.price_range || (p.service_price_min && p.service_price_max ? `${p.service_price_min}-${p.service_price_max}` : 'Cotización directa');
              const rating = p.rating ? `${p.rating}⭐` : null;
              const verified = p.is_verified ? '✓' : '';
              const premium = p.is_premium ? '👑' : '';
              
              let providerLocation = '';
              if (p.city && p.state) {
                providerLocation = ` (${p.city}, ${p.state})`;
              } else if (p.city) {
                providerLocation = ` (${p.city})`;
              }
              
              const badges = [verified, premium, rating].filter(Boolean).join(' ');
              lines.push(`${idx + 1}. ${name}${providerLocation} — ${price} ${badges}`);
            });

            lines.push('💬 ¿Te paso el contacto de alguno?');
            const conciseResponse = lines.join('\n');

            // log usage with minimal token accounting
            const usage: AIUsage = {
              session_id: this.sessionId,
              user_ip: userIP,
              user_id: userId,
              question,
              response: conciseResponse,
              tokens_input: 0,
              tokens_output: 0,
              cost_usd: 0,
              processing_time_ms: Date.now() - startTime
            };

            try {
              (usage as any).sources_used = topK.map(p => ({ provider_id: p.provider_id, service_id: p.service_id }));
              (usage as any).ranking_scores = topK.map(p => ({ provider_id: p.provider_id, score: p.score }));
            } catch (err) {
              console.warn('Error preparando metadata para logging:', err);
            }

            // cache the concise answer (optional)
            this.addToCache(question, conciseResponse);

            const insertedId = await this.logUsage(usage as any);
            (usage as any).id = insertedId || null;
            
            // Actualizar historial de conversación
            this.updateConversationHistory(question, conciseResponse);
            
            return { response: conciseResponse, usage };
          }

          // 7. Llamar a Gemini API con contexto enriquecido (fallback cuando topK tiene >=3)
          const geminiResult = await this.callGeminiAPI(question, enrichedContext);

          // 8. Calcular costo
          const cost = this.calculateCost(geminiResult.tokensUsed.input, geminiResult.tokensUsed.output);

          // 9. Agregar al cache
          this.addToCache(question, geminiResult.response);

          // 10. Registrar uso (intentamos adjuntar sources_used y ranking_scores)
          const usageFull: AIUsage = {
            session_id: this.sessionId,
            user_ip: userIP,
            user_id: userId,
            question,
            response: geminiResult.response,
            tokens_input: geminiResult.tokensUsed.input,
            tokens_output: geminiResult.tokensUsed.output,
            cost_usd: cost,
            processing_time_ms: Date.now() - startTime
          };

          try {
            // Si topK existe, añadimos metadata al log (tratamos en logUsage)
            (usageFull as any).sources_used = topK.map(p => ({ provider_id: p.provider_id, service_id: p.service_id }));
            (usageFull as any).ranking_scores = topK.map(p => ({ provider_id: p.provider_id, score: p.score }));
          } catch (err) {
            console.warn('Error preparando metadata para logging:', err);
          }

          const insertedFullId = await this.logUsage(usageFull as any);
          (usageFull as any).id = insertedFullId || null;

          // Actualizar historial de conversación
          this.updateConversationHistory(question, usageFull.response);

          return { response: usageFull.response, usage: usageFull };
      } catch (error: any) {
        console.error('AI Assistant error:', error);
      
        // Registrar error también
        const errorUsage: AIUsage = {
          session_id: this.sessionId,
          user_ip: userIP,
          user_id: userId,
          question,
          response: `Error: ${error.message}`,
          tokens_input: 0,
          tokens_output: 0,
          cost_usd: 0,
          processing_time_ms: Date.now() - startTime
        };
      
        await this.logUsage(errorUsage);

        throw error;
      }
  }

  getWelcomeMessage(): string {
    return '¡Hola! 👋 Soy tu asistente virtual de Charlitron Eventos 360. ¿En qué puedo ayudarte hoy?';
  }
}

// Singleton instance
export const aiAssistant = new AIAssistantService();

// Funciones para admin
export async function getAIStats(period: 'today' | 'week' | 'month' = 'today') {
  try {
    // Calcular fecha de inicio según el período
    let startDate: Date;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Query directa a la tabla (sin RPC)
    const { data, error } = await supabase
      .from('ai_usage_tracking')
      .select('*')
      .gte('created_at', startDate.toISOString());
    
    if (error) {
      console.error('Error querying ai_usage_tracking:', error);
      return {
        period: period,
        total_questions: 0,
        total_cost_usd: 0,
        avg_processing_time_ms: 0,
        total_tokens_input: 0,
        total_tokens_output: 0,
        unique_users: 0,
        top_questions: []
      };
    }

    // Calcular estadísticas manualmente
    const total_questions = data?.length || 0;
    const total_cost_usd = data?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0;
    const avg_processing_time_ms = total_questions > 0 
      ? data.reduce((sum, row) => sum + (row.processing_time_ms || 0), 0) / total_questions 
      : 0;
    const total_tokens_input = data?.reduce((sum, row) => sum + (row.tokens_input || 0), 0) || 0;
    const total_tokens_output = data?.reduce((sum, row) => sum + (row.tokens_output || 0), 0) || 0;
    
    // Contar usuarios únicos
    const uniqueIdentifiers = new Set();
    data?.forEach(row => {
      const identifier = row.user_id || row.user_ip;
      if (identifier) uniqueIdentifiers.add(identifier);
    });
    const unique_users = uniqueIdentifiers.size;

    // Top preguntas
    const questionCounts: Record<string, number> = {};
    data?.forEach(row => {
      if (row.question) {
        questionCounts[row.question] = (questionCounts[row.question] || 0) + 1;
      }
    });
    
    const top_questions = Object.entries(questionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([question, count]) => ({ question_text: question, frequency: count }));

    const result = {
      period,
      total_questions,
      total_cost_usd: parseFloat(total_cost_usd.toFixed(4)),
      avg_processing_time_ms: Math.round(avg_processing_time_ms),
      total_tokens_input,
      total_tokens_output,
      unique_users,
      top_questions
    };

    console.log(`✅ AI Stats for ${period}:`, result);
    return result;
    
  } catch (error) {
    console.error('Error getting AI stats:', error);
    return {
      period: period,
      total_questions: 0,
      total_cost_usd: 0,
      avg_processing_time_ms: 0,
      total_tokens_input: 0,
      total_tokens_output: 0,
      unique_users: 0,
      top_questions: []
    };
  }
}

export async function updateAISettings(settings: Partial<AISettings>) {
  try {
    // Primero obtener el ID de la configuración (sin .single() para evitar errores)
    const { data: existingData, error: fetchError } = await supabase
      .from('ai_settings')
      .select('id')
      .limit(1);

    if (fetchError || !existingData || existingData.length === 0) {
      throw new Error('No se encontró la configuración de IA en la base de datos');
    }

    // Extraer el ID (manejar array)
    const firstRow = existingData[0] as any;
    const settingsId = firstRow.id;

    // Actualizar usando el ID específico
    const { data, error } = await supabase
      .from('ai_settings')
      .update(settings)
      .eq('id', settingsId)
      .select('*');

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Error actualizando configuración: ${error.message}`);
    }

    // Retornar la primera fila si hay múltiples
    const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
    console.log('AI Settings updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating AI settings:', error);
    throw error;
  }
}

export async function getAISettings() {
  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    // Manejar tanto array como objeto único
    return Array.isArray(data) && data.length > 0 ? data[0] : data;
  } catch (error) {
    console.error('Error getting AI settings:', error);
    return null;
  }
}