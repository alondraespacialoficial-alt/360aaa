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

// Preguntas frecuentes con respuestas pre-definidas
const FAQ_RESPONSES: Record<string, string> = {
  'hola': '¡Hola! 👋 Soy tu asistente virtual de Charlitron Eventos 360. ¿En qué puedo ayudarte?',
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

  constructor() {
    this.sessionId = this.generateSessionId();
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
    const lowerQuestion = question.toLowerCase();
    
    for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerQuestion.includes(key)) {
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
      // Obtener datos en tiempo real de Supabase
      const [
        { data: providers },
        { data: categories }, 
        { data: reviews },
        { data: recentAnalytics },
        { data: services }
      ] = await Promise.all([
        supabase.from('providers').select('id, name, city, is_premium, featured, description, whatsapp').eq('is_active', true),
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('provider_reviews').select('provider_id, rating, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('provider_analytics').select('provider_id, event_type').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).limit(100),
        supabase.from('provider_services').select('provider_id, category_id, service_name, price_range, description').limit(200)
      ]);

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

      // Ciudades disponibles
      const cities = [...new Set(providers?.map(p => p.city).filter(Boolean))];

      // Agrupar servicios por categoría con precios
      const servicesByCategory: Record<string, Array<{ provider_name: string; service: string; price_range: string; city: string }>> = {};
      services?.forEach(service => {
        const provider = providers?.find(p => p.id === service.provider_id);
        if (provider && service.price_range) {
          const categoryName = categories?.find(c => c.id === service.category_id)?.name || 'Otros';
          if (!servicesByCategory[categoryName]) {
            servicesByCategory[categoryName] = [];
          }
          servicesByCategory[categoryName].push({
            provider_name: provider.name,
            service: service.service_name || service.description || 'Servicio',
            price_range: service.price_range,
            city: provider.city || 'No especificada'
          });
        }
      });

      return `
CHARLITRON EVENTOS 360 - DIRECTORIO DE PROVEEDORES
=================================================

ESTADÍSTICAS ACTUALES:
- Total de proveedores activos: ${totalProviders}
- Categorías disponibles: ${categoriesCount}
- Total de reseñas: ${totalReviews}
- Ciudades con proveedores: ${cities.join(', ')}

CATEGORÍAS DISPONIBLES:
${categories?.map(c => `- ${c.name} (${c.slug})`).join('\n') || 'No hay categorías'}

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

CIUDADES PRINCIPALES: ${cities.slice(0, 5).join(', ')}

PROVEEDORES Y SERVICIOS POR CATEGORÍA:
${Object.entries(servicesByCategory).slice(0, 5).map(([category, serviceList]) => 
  `${category.toUpperCase()}:
${serviceList.slice(0, 3).map(s => `- ${s.provider_name} (${s.city}): ${s.service} - ${s.price_range}`).join('\n')}`
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
- Responde siempre en español de México
- SÉ BREVE Y CONCISO: Máximo 3-4 líneas por respuesta
- Usa emojis para hacer las respuestas más atractivas
- CUANDO PREGUNTEN POR PRESUPUESTO: Menciona rangos específicos basados en la info disponible
- CUANDO PREGUNTEN POR UBICACIÓN: Filtra proveedores de esa ciudad específica
- Si solicitan presupuesto + ubicación: Da 2-3 recomendaciones específicas de esa ciudad con rangos de precio
- Incluye una llamada a la acción para contactar proveedores
- Si no tienes datos exactos, da rangos aproximados pero indica que contacten para cotización
- NO des explicaciones largas ni contexto extra
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
  private rankProviders(candidates: any[], userBudget?: number, userCity?: string) {
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
      const city_match = userCity && c.city ? (c.city.toLowerCase().includes(userCity.toLowerCase()) ? 1 : 0) : 0;
      const price_proximity = (userBudget && c.service_median) ? (1 - Math.min(Math.abs(c.service_median - userBudget) / Math.max(userBudget, 1), 1)) : 0.5;
      const rating_norm = (c.rating || 0) / 5;
      const reviews_norm = normalizeLog(c.reviews_count || 0, maxReviews);
      const views_norm = normalizeLog(c.views_30d || 0, maxViews);
      const whatsapp_norm = normalizeLog(c.whatsapp_30d || 0, maxWhatsapp);
      const media_norm = normalizeLog(c.media_count || 0, maxMedia);
      const premium_bonus = c.is_premium ? 0.03 : 0;

      const score =
        0.35 * service_match +
        0.20 * city_match +
        0.15 * price_proximity +
        0.10 * rating_norm +
        0.06 * reviews_norm +
        0.06 * views_norm +
        0.05 * whatsapp_norm +
        0.03 * media_norm +
        premium_bonus;

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

    // Refuerzo anti-hallucination: instrucciones globales que se agregan al prompt
    const antiHallucination = `\n\nIMPORTANTE: SOLO usa los proveedores listados en la sección PROVEEDORES CANDIDATOS (TOP K) incluida más abajo. NO inventes nombres, empresas ni datos. Si no hay proveedores apropiados en TOP K, responde: "No tenemos proveedores verificados en esa ciudad/rango" y ofrece alternativas (buscar en ciudades cercanas o contactar soporte).`;

  const fullPrompt = `${context}\n\nPREGUNTA DEL USUARIO: ${prompt}${specificInstructions}${antiHallucination}\n\nResponde de manera útil, amigable y específica usando la información del contexto. Máximo 300 caracteres.`;

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
        if (inserted && inserted.id) return inserted.id as string;
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
        if (/(video|vide|film)/i.test(q)) return 'video';
        if (/(foto|fotograf)/i.test(q)) return 'photo';
        if (/(dj|música|musica|sonido)/i.test(q)) return 'music';
        return 'general';
      };
      const detectCity = (q: string) => {
        const match = q.match(/en\s+([A-Za-záéíóúñ\s]+)/i);
        return match ? match[1].trim() : undefined;
      };
      const detectBudget = (q: string) => {
        const m = q.match(/\$?\s?(\d{3,7})/);
        return m ? Number(m[1]) : undefined;
      };

      // If we have a pending clarification from a previous turn, try to interpret this short
      // user reply as the missing info (city and/or budget) and merge with the original question.
      let service_slug = detectService(question);
      let city = detectCity(question);
      let budget = detectBudget(question);

      if (this.pendingClarification) {
        // If the current message looks like an answer (short and contains city/budget), merge it
        const looksLikeBudget = !!budget;
        const looksLikeCity = !!city;

        // If current message does not contain either but is short, try to parse according to what was asked
        if (!looksLikeBudget && !looksLikeCity) {
          const text = question.trim();
          // numeric-only answer likely budget
          const numericOnly = /^\$?\s?\d{2,7}$/.test(text);
          if (numericOnly && this.pendingClarification.askedBudget) {
            budget = detectBudget(text);
          } else if (this.pendingClarification.askedCity) {
            // treat as city name
            city = text;
          }
        }

        // Merge service from original if not present in this short reply
        const origService = detectService(this.pendingClarification.originalQuestion);
        if (!service_slug && origService) service_slug = origService;

        // Use original question as the base
        question = this.pendingClarification.originalQuestion + ' ' + question;

        // Clear pending once we've consumed it
        this.pendingClarification = null;
      }

      // Si faltan datos críticos (ciudad o presupuesto), pedimos clarificación antes de llamar al modelo
      const needsCity = !city;
      const needsBudget = !budget;

      if (needsCity || needsBudget) {
        const clarifications: string[] = [];
        if (needsCity) clarifications.push('¿En qué ciudad estás?');
        if (needsBudget) clarifications.push('¿Cuál es tu presupuesto aproximado para el servicio?');

        const clarificationText = `Antes de recomendar proveedores, necesito un par de datos: ${clarifications.join(' ')}`;

        // Store pending clarification so next short user reply can be merged
        this.pendingClarification = {
          originalQuestion: question,
          askedCity: needsCity,
          askedBudget: needsBudget
        };

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

      let candidates: any[] = [];
      try {
        candidates = await getProvidersForQuery({ service_slug, city, budget, limit: 50 });
      } catch (err) {
        console.warn('No se pudieron obtener candidatos:', err);
        candidates = [];
      }

      // 6.2 Rankear candidatos y tomar topK
      const ranked = this.rankProviders(candidates, budget, city);
      const topK = ranked.slice(0, 3);

      // Si no hay candidatos después del ranking, devolver respuesta controlada sin llamar al modelo
      if (!topK || topK.length === 0) {
        const noProvidersMsg = city
          ? `No tenemos proveedores verificados en ${city}. Puedes intentar buscar en ciudades cercanas o dejar tu contacto para que te avisemos cuando haya proveedores disponibles.`
          : `No tenemos proveedores verificados para esa búsqueda. ¿Puedes especificar la ciudad o probar otra categoría?`;

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
        service_id: p.service_id,
        service_name: p.service_name,
        price_range: p.service_price_min && p.service_price_max ? `${p.service_price_min}-${p.service_price_max}` : null,
        rating: p.rating,
        reviews_count: p.reviews_count,
        views_30d: p.views_30d,
        whatsapp_30d: p.whatsapp_30d,
        media_count: p.media_count,
        profile_url: `/proveedores/${p.provider_id}`
      }));

    const enrichedContext = context + '\n\nPROVEEDORES CANDIDATOS (TOP ' + topK.length + '):\n' + JSON.stringify(contextJSON, null, 2);

      // If topK has 1 or 2 providers, return a concise structured response immediately (save tokens)
          if (topK.length > 0 && topK.length <= 2) {
            const lines: string[] = [];
            lines.push(`En ${city || 'tu ciudad'} hay ${topK.length} proveedor${topK.length > 1 ? 'es' : ''} verificado${topK.length > 1 ? 's' : ''}:`);

            topK.forEach((p, idx) => {
              const name = p.provider_name || 'Proveedor';
              const price = p.price_range || (p.service_price_min && p.service_price_max ? `${p.service_price_min}-${p.service_price_max}` : 'Rango no disponible');
              const rating = p.rating ? `${p.rating}⭐` : null;
              const reason = rating ? `${rating}` : `score:${(p.score || 0).toFixed(2)}`;
              const profile = p.profile_url || `/proveedores/${p.provider_id}`;
              lines.push(`${idx + 1}) ${name} — ${price} — ${reason}. ${profile}`);
            });

            lines.push('¿Quieres que te pase el contacto de alguno?');
            const conciseResponse = lines.join(' ');

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
    return FAQ_RESPONSES['hola'];
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